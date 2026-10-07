/* The business model, in one place, so the site and the deck always agree. */
export const PRICE = 20;
export const PREMIUM_PRICE = 49;
export const YOUR_CUT = 50;

// Who buys you. Sample month, made-up numbers (it's a parody).
export const BUYERS = {
  low: [
    { co: 'Meta', took: '2,914 photos + who you stalk', did: 'Showed you ads for the couch you already bought', paid: 38.4 },
    { co: 'Google', took: 'Every 3am search', did: 'Autocomplete now finishes your sentences', paid: 31.2 },
    { co: 'TikTok', took: 'Scroll speed, pause length', did: 'Kept you up until 2am, 19 nights straight', paid: 24.6 },
    { co: 'Amazon', took: 'Alexa audio, cart history', did: 'Sold you a second air fryer', paid: 19.8 },
    { co: 'A data broker you\'ve never heard of', took: 'Everything', did: 'Sold it to another data broker', paid: 9.4 },
  ],
  high: [
    { co: 'OpenAI', took: 'Your group chats', did: 'Taught a chatbot to text like you', paid: 240.0 },
    { co: 'Google DeepMind', took: 'Your voice memos', did: 'A podcast host that sounds like you', paid: 165.5 },
    { co: 'Anthropic', took: 'Your Notes app', did: 'Taught a model to overthink like you', paid: 120.3 },
    { co: 'Mistral', took: 'Your French homework', did: 'Pas mal', paid: 48.9 },
    { co: 'xAI', took: 'Your tweets', did: 'Made it meaner', paid: 14.2 },
    { co: 'Meta AI', took: 'Your vacation photos', did: 'An AI influencer with your face', paid: 9.1 },
  ],
};

export const BUCKETS = {
  low: { name: 'Low risk', what: 'Basic data', items: 'Browsing, shopping, location, screen time', to: 'Ad & data companies', range: '$10–40/mo profit', note: 'Steady. Boring. Like a savings account that watches you.' },
  high: { name: 'High risk', what: 'AI training data', items: 'Your writing, voice, photos, group chats', to: 'AI companies', range: '$50–500/mo profit', note: 'Volatile. Some months OpenAI wants you badly. Some months they just want you.' },
};

/* One month's payout (your 50%) for a portfolio that is `h` (0..1) high risk. */
function month(h, rnd) {
  const low = 30 + rnd() * 30; // low risk: $10–40 profit
  const high = 70 + rnd() * 450; // high risk: $50–500 profit
  return low * (1 - h) + high * h;
}

/* A seeded year, so a re-render doesn't reshuffle it. */
export function simulateYear(h, seed) {
  let s = seed >>> 0 || 1;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  return Array.from({ length: 12 }, () => month(h, rnd));
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
