// ═══════════════════════════════════════════════════════════
//  GRAP WATCH — Vercel Serverless API Proxy
//  Keeps WAQI token secret on the server side
// ═══════════════════════════════════════════════════════════

export default async function handler(req, res) {
  const { action, param } = req.query;

  if (!action || !param) {
    return res.status(400).json({ error: 'Missing action or param' });
  }

  const token = process.env.WAQI_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'API token not configured' });
  }

  let url;
  if (action === 'feed') {
    url = `https://api.waqi.info/feed/${encodeURIComponent(param)}/?token=${token}`;
  } else if (action === 'search') {
    url = `https://api.waqi.info/search/?token=${token}&keyword=${encodeURIComponent(param)}`;
  } else {
    return res.status(400).json({ error: 'Invalid action. Use "feed" or "search".' });
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach WAQI API' });
  }
}
