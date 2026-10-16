// Forwards S Pen strokes to Google's free handwriting recognizer (French).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const r = await fetch('https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const j = await r.json();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(j);
  } catch (e) {
    return res.status(502).json({ error: 'Handwriting service unavailable' });
  }
}
