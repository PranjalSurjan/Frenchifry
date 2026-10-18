// Shared storage for the notebook on Cloudflare Pages, backed by Cloudflare D1 (free).
// Same API as api/data.js (the Vercel version), so index.html works unchanged: ping, profiles, all, put, del.
// Each person's notes are rows (person, field, value) where field is "page:<id>" or "entry:<id>"
// and value is a JSON string.
//
// The first time it runs with the old Upstash settings present (UPSTASH_REDIS_REST_URL and a token),
// it copies the notes over from Upstash. That copy only reads from Upstash; nothing there is changed.

const PEOPLE = ['p1', 'p2'];
const FIELD = /^(page|entry):[\w-]+$/;
let ready = false; // tables exist and the one-time copy is done (per Worker instance)
let copyError = null; // why the last copy from Upstash failed, shown by ?action=status

const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

async function setup(db, env) {
  if (ready) return;
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS items (person TEXT NOT NULL, field TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (person, field))'),
    db.prepare('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)'),
  ]);
  try {
    await copyFromUpstash(db, env);
    ready = true; copyError = null;
  } catch (e) {
    copyError = e.message;
    console.error('Copy from Upstash failed, will try again on the next request:', e.message);
  }
}

// /api/data?action=status: what this site can see, without any secrets or notes.
// /api/data?action=recopy&passcode=…: copy from Upstash again (never overwrites what's saved here).
async function status(db, env) {
  await setup(db, env);
  const count = async p => (await db.prepare('SELECT COUNT(*) AS n FROM items WHERE person = ?').bind(p).first()).n;
  const copied = await db.prepare("SELECT value FROM meta WHERE key = 'copied'").first();
  return {
    storage: 'connected',
    passcodeSet: !!env.APP_PASSCODE,
    upstashUrlSet: !!(env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL),
    upstashTokenSet: !!(env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_READ_ONLY_TOKEN || env.KV_REST_API_TOKEN),
    copied: copied ? copied.value : 'not yet',
    copyError,
    notesHere: { p1: await count('p1'), p2: await count('p2') },
    profilesHere: !!(await db.prepare("SELECT 1 FROM meta WHERE key = 'profiles'").first()),
    sizeKB: { p1: await size('p1'), p2: await size('p2') },
    biggestItemsKB: (await db.prepare('SELECT person, field, LENGTH(value) AS n FROM items ORDER BY n DESC LIMIT 5').all())
      .results.map(r => `${r.person} ${r.field.split(':')[0]}: ${Math.round(r.n / 1024)}`),
    loadTest: await loadTest(db), // the same work as loading notes, timed, without returning them
  };
  async function size(p) { return Math.round(((await db.prepare('SELECT SUM(LENGTH(value)) AS n FROM items WHERE person = ?').bind(p).first()).n || 0) / 1024); }
}
async function loadTest(db) {
  const out = {};
  for (const p of PEOPLE) {
    const t = Date.now();
    try {
      const { results } = await db.prepare('SELECT field, value FROM items WHERE person = ?').bind(p).all();
      const items = {}; for (const row of results) items[row.field] = row.value;
      out[p] = `ok, ${Math.round(JSON.stringify({ items }).length / 1024)} KB in ${Date.now() - t} ms`;
    } catch (e) { out[p] = 'FAILED: ' + e.message; }
  }
  return out;
}

async function copyFromUpstash(db, env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_READ_ONLY_TOKEN || env.KV_REST_API_TOKEN;
  if (!url || !token) return; // nothing to copy from
  if (await db.prepare("SELECT 1 FROM meta WHERE key = 'copied'").first()) return; // already done
  const redis = async command => { // read-only commands only: HGETALL and GET
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });
    const j = await r.json();
    if (j.error) throw new Error(j.error);
    return j.result;
  };
  const writes = [];
  for (const person of PEOPLE) {
    const flat = (await redis(['HGETALL', `fn:data:${person}`])) || [];
    for (let i = 0; i < flat.length; i += 2) {
      if (!FIELD.test(flat[i])) continue;
      // OR IGNORE: anything already written here on Cloudflare wins over the old copy
      writes.push(db.prepare('INSERT OR IGNORE INTO items (person, field, value) VALUES (?, ?, ?)').bind(person, flat[i], flat[i + 1]));
    }
  }
  const profiles = await redis(['GET', 'fn:profiles']);
  if (profiles) writes.push(db.prepare("INSERT OR IGNORE INTO meta (key, value) VALUES ('profiles', ?)").bind(profiles));
  const note = `${new Date().toISOString()}: copied ${writes.length} items from Upstash`;
  writes.push(db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('copied', ?)").bind(note));
  for (let i = 0; i < writes.length; i += 50) await db.batch(writes.slice(i, i + 50));
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  let body = {};
  if (request.method === 'POST') { try { body = await request.json(); } catch (e) { } }
  const action = url.searchParams.get('action') || body.action;
  const db = env.DB, passcode = env.APP_PASSCODE || '';

  // ping tells the app whether storage is set up and a passcode is needed
  if (action === 'ping') return json(200, { ok: !!db, auth: !!passcode });
  if (!db) return json(action === 'status' ? 200 : 503, { error: 'Storage is not connected. Bind a D1 database named DB in Cloudflare Pages, then retry the deployment.' });
  try {
    if (action === 'status') return json(200, await status(db, env));
    if (action === 'recopy') {
      if (passcode && url.searchParams.get('passcode') !== passcode) return json(401, { error: 'Add &passcode=… with your passcode' });
      await db.prepare("DELETE FROM meta WHERE key = 'copied'").run().catch(() => { });
      ready = false;
      return json(200, await status(db, env));
    }
  } catch (e) {
    return json(500, { error: e.message });
  }
  if (passcode && request.headers.get('x-passcode') !== passcode) return json(401, { error: 'Wrong passcode' });

  try {
    await setup(db, env);
    if (request.method === 'GET' && action === 'all') {
      const person = url.searchParams.get('person');
      if (!PEOPLE.includes(person)) return json(400, { error: 'Unknown person' });
      const { results } = await db.prepare('SELECT field, value FROM items WHERE person = ?').bind(person).all();
      const items = {};
      for (const row of results) items[row.field] = row.value;
      return json(200, { items });
    }
    if (request.method === 'GET' && action === 'profiles') {
      const row = await db.prepare("SELECT value FROM meta WHERE key = 'profiles'").first();
      return json(200, { profiles: row ? JSON.parse(row.value) : null });
    }
    if (request.method === 'POST') {
      const { person, field, value, fields, profiles } = body;
      if (action === 'profiles') {
        await db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('profiles', ?)").bind(JSON.stringify(profiles)).run();
        return json(200, { ok: true });
      }
      if (!PEOPLE.includes(person)) return json(400, { error: 'Unknown person' });
      if (action === 'put') {
        if (!FIELD.test(field || '')) return json(400, { error: 'Bad field' });
        await db.prepare('INSERT INTO items (person, field, value) VALUES (?, ?, ?) ON CONFLICT (person, field) DO UPDATE SET value = excluded.value')
          .bind(person, field, JSON.stringify(value)).run();
        return json(200, { ok: true });
      }
      if (action === 'del') {
        const list = (fields || []).filter(f => FIELD.test(f));
        if (list.length) await db.batch(list.map(f => db.prepare('DELETE FROM items WHERE person = ? AND field = ?').bind(person, f)));
        return json(200, { ok: true });
      }
    }
    return json(400, { error: 'Unknown action' });
  } catch (e) {
    return json(500, { error: e.message });
  }
}
