// What the popups collected. Kept for the session so going back and forth keeps it.
const KEY = 'sell-yoursellf-deck-collected';
let data = {};
try { data = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch { data = {}; }
export const startedAt = Date.now();
export const collected = () => data;
export function remember(k, v) {
  data = { ...data, [k]: v };
  try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch { /* private mode */ }
}
