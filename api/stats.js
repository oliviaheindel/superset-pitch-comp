import { list } from '@vercel/blob';

// How many people have sold themselves so far, plus the latest first names (for the big screen).
export default async function handler(req, res) {
  try {
    let cursor, blobs = [];
    do {
      const page = await list({ prefix: 'signups/', cursor, limit: 1000 });
      blobs = blobs.concat(page.blobs);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor && blobs.length < 10000);
    const names = blobs
      .map((b) => b.pathname.replace('signups/', '').split('-'))
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map((p) => p[1])
      .filter((n) => n && n !== 'anon')
      .slice(0, 24);
    res.setHeader('Cache-Control', 's-maxage=3, stale-while-revalidate=10');
    return res.status(200).json({ count: blobs.length, names });
  } catch (e) {
    console.error('stats failed', e);
    return res.status(200).json({ count: 0, names: [], offline: true });
  }
}
