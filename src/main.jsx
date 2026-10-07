import { createRoot } from 'react-dom/client';
import './fonts.css';
import './base.css';

// One app, three doors: the site (what the QR opens), /deck (the pitch), /qr (the poster for the screen).
const path = location.pathname.replace(/\/+$/, '');
const load = path === '/deck' ? import('./deck/Deck.jsx') : path === '/qr' ? import('./QR.jsx') : import('./site/Site.jsx');

const FONTS = ['400 1em Anton', '300 1em "Plus Jakarta Sans"', 'italic 400 1em "Playfair Display"'];
const fontsReady = Promise.all(FONTS.map((f) => document.fonts?.load(f))).catch(() => {});
Promise.all([load, Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))])]).then(([m]) => {
  const App = m.default;
  createRoot(document.getElementById('root')).render(<App />);
});
