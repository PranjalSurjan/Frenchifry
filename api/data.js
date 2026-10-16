// Shared storage for the notebook, backed by Upstash Redis (free tier).
// Each person's notes live in one Redis hash: fn:data:<person>
// Fields are "page:<id>" and "entry:<id>", values are JSON strings.

const URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const PASSCODE = process.env.APP_PASSCODE || '';
const PEOPLE = new Set(['p1', 'p2']);

async function redis(command) {
  const r = await fetch(URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

function send(res, code, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(code).json(body);
}

export default async function handler(req, res) {
  const action = (req.query && req.query.action) || (req.body && req.body.action);

  // ping tells the app whether storage is set up and a passcode is needed
  if (action === 'ping') return send(res, 200, { ok: !!(URL && TOKEN), auth: !!PASSCODE });
  if (!URL || !TOKEN) return send(res, 503, { error: 'Storage is not connected. Add Upstash Redis in Vercel.' });
  if (PASSCODE && req.headers['x-passcode'] !== PASSCODE) return send(res, 401, { error: 'Wrong passcode' });

  try {
    if (req.method === 'GET' && action === 'all') {
      const person = req.query.person;
      if (!PEOPLE.has(person)) return send(res, 400, { error: 'Unknown person' });
      const flat = (await redis(['HGETALL', `fn:data:${person}`])) || [];
      const items = {};
      for (let i = 0; i < flat.length; i += 2) items[flat[i]] = flat[i + 1];
      return send(res, 200, { items });
    }
    if (req.method === 'GET' && action === 'profiles') {
      const v = await redis(['GET', 'fn:profiles']);
      return send(res, 200, { profiles: v ? JSON.parse(v) : null });
    }
    if (req.method === 'POST') {
      const { person, field, value, fields, profiles } = req.body || {};
      if (action === 'profiles') {
        await redis(['SET', 'fn:profiles', JSON.stringify(profiles)]);
        return send(res, 200, { ok: true });
      }
      if (!PEOPLE.has(person)) return send(res, 400, { error: 'Unknown person' });
      if (action === 'put') {
        if (!/^(page|entry):[\w-]+$/.test(field)) return send(res, 400, { error: 'Bad field' });
        await redis(['HSET', `fn:data:${person}`, field, JSON.stringify(value)]);
        return send(res, 200, { ok: true });
      }
      if (action === 'del') {
        const list = (fields || []).filter(f => /^(page|entry):[\w-]+$/.test(f));
        if (list.length) await redis(['HDEL', `fn:data:${person}`, ...list]);
        return send(res, 200, { ok: true });
      }
    }
    return send(res, 400, { error: 'Unknown action' });
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}
