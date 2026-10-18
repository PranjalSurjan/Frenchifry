// Forwards S Pen strokes to Google's free handwriting recognizer (Cloudflare Pages version of api/handwriting.js).
export async function onRequestPost({ request }) {
  try {
    const r = await fetch('https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: await request.text(),
    });
    return new Response(await r.text(), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Handwriting service unavailable' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}
