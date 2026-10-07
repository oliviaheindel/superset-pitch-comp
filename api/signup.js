import { put } from '@vercel/blob';

// One signup = one private JSON file in the Blob store. The first name rides in the
// file name so /api/stats can show it without opening every file.
const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const slug = (v) => clip(v, 40).split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'anon';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const b = typeof req.body === 'object' && req.body ? req.body : {};
  const name = clip(b.name, 60);
  const email = clip(b.email, 120);
  if (!name) return res.status(400).json({ error: 'We need at least a name. We are a data company.' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'That email looks fake. We would know.' });

  const record = {
    at: new Date().toISOString(),
    source: clip(b.source, 20) || 'site',
    name,
    email,
    plan: clip(b.plan, 20),
    answers: Object.fromEntries(Object.entries(b.answers || {}).slice(0, 20).map(([k, v]) => [clip(k, 40), clip(String(v), 200)])),
    perms: Object.fromEntries(Object.entries(b.perms || {}).slice(0, 20).map(([k, v]) => [clip(k, 40), !!v])),
    device: Object.fromEntries(Object.entries(b.device || {}).slice(0, 20).map(([k, v]) => [clip(k, 40), clip(String(v), 300)])),
  };
  try {
    const id = `${Date.now()}-${slug(name)}-${Math.random().toString(36).slice(2, 8)}`;
    await put(`signups/${id}.json`, JSON.stringify(record, null, 2), {
      access: 'private', contentType: 'application/json', addRandomSuffix: false,
    });
    return res.status(200).json({ ok: true, id });
  } catch (e) {
    console.error('signup failed', e);
    return res.status(500).json({ error: 'Our data broker is on break. Try again.' });
  }
}
