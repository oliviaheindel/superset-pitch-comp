/* The business model, in one place, so the site and the deck always agree. */
export const PRICE = 20;
export const PREMIUM_PRICE = 49;
export const YOUR_CUT = 50;

// Who buys you. Sample month, made-up numbers (it's a parody).
export const BUYERS = {
  low: [
    { co: 'Meta', took: '2,914 photos + who you stalk', did: 'Showed you ads for the couch you already bought', paid: 1.84 },
    { co: 'Google', took: 'Every 3am search', did: 'Autocomplete now finishes your sentences', paid: 1.52 },
    { co: 'TikTok', took: 'Scroll speed, pause length', did: 'Kept you up until 2am, 19 nights straight', paid: 1.21 },
    { co: 'Amazon', took: 'Alexa audio, cart history', did: 'Sold you a second air fryer', paid: 0.96 },
    { co: 'A data broker you\'ve never heard of', took: 'Everything', did: 'Sold it to another data broker', paid: 0.47 },
  ],
  high: [
    { co: 'OpenAI', took: 'Your group chats', did: 'Taught a chatbot to text like you', paid: 14.2 },
    { co: 'Google DeepMind', took: 'Your voice memos', did: 'A podcast host that sounds like you', paid: 9.1 },
    { co: 'Anthropic', took: 'Your Notes app', did: 'Taught a model to overthink like you', paid: 6.8 },
    { co: 'Mistral', took: 'Your French homework', did: 'Pas mal', paid: 2.4 },
    { co: 'xAI', took: 'Your tweets', did: 'Made it meaner', paid: 0.03 },
    { co: 'Meta AI', took: 'Your vacation photos', did: '"Already scraped it." Paid nothing', paid: 0 },
  ],
};

export const BUCKETS = {
  low: { name: 'Low risk', what: 'Basic data', items: 'Browsing, shopping, location, screen time', to: 'Ad & data companies', range: '$9–15/mo', note: 'Steady. Boring. Like a savings account that watches you.' },
  high: { name: 'High risk', what: 'AI training data', items: 'Your writing, voice, photos, group chats', to: 'AI companies', range: '$0–90/mo', note: 'Volatile. One month you\'re training data, the next you\'re "already scraped."' },
};

/* One month's payout (your 50%) for a portfolio that is `h` (0..1) high risk. */
function month(h, rnd) {
  const low = 9 + rnd() * 6;
  const r = rnd();
  const high = r < 0.45 ? rnd() * 3 : r < 0.85 ? 10 + rnd() * 25 : 40 + rnd() * 50;
  return low * (1 - h) + high * h;
}

/* A seeded year, so a re-render doesn't reshuffle it. */
export function simulateYear(h, seed) {
  let s = seed >>> 0 || 1;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  return Array.from({ length: 12 }, () => month(h, rnd));
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
