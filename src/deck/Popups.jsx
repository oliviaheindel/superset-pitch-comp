import { useCallback, useEffect, useRef, useState } from 'react';
import { useDeck } from '../engine.jsx';
import { collected, remember } from './store.js';

/*
 * Slide 1: the popup storm. Popups keep landing on top of each other, every one asking for more.
 * The ones with a text box really do collect what you type (shown back on the next slide).
 * Closing one spawns two more. → (or the last popup's button) moves on.
 */
const POPUPS = [
  { kind: 'cookie', title: 'We value your privacy 🍪', body: 'We and our 1,482 partners use cookies to personalise, measure, and mostly to sell.', yes: 'Accept all', no: 'Accept all (but grey)' },
  { kind: 'ask', key: 'name', title: 'Hey! What should we call you?', placeholder: 'First name', yes: 'Continue' },
  { kind: 'perm', icon: '🔔', title: 'sellf.com wants to', body: 'Show notifications', yes: 'Allow', no: 'Also allow' },
  { kind: 'ask', key: 'email', title: 'Get 10% off your own data', placeholder: 'Email address', yes: 'Claim my 10%' },
  { kind: 'perm', icon: '📍', title: 'Allow "Sellf" to use your location?', body: 'Your location is used to find you. Constantly.', yes: 'Allow while using app', no: 'Allow always' },
  { kind: 'ask', key: 'birthday', title: 'When\'s your birthday? 🎂', placeholder: 'MM / DD', yes: 'Save' },
  { kind: 'perm', icon: '📇', title: 'Sellf would like to access your contacts', body: 'So we can sell them too. They\'ll never know.', yes: 'OK', no: 'Fine' },
  { kind: 'ask', key: 'pet', title: 'Security question', body: 'What was the name of your first pet?', placeholder: 'Totally just for security', yes: 'Secure me' },
  { kind: 'ask', key: 'street', title: 'Security question #2', body: 'What street did you grow up on?', placeholder: 'Also just for security', yes: 'Still secure' },
  { kind: 'perm', icon: '🎙️', title: '"Sellf" would like to access the microphone', body: 'We heard you talking about air fryers.', yes: 'Allow', no: 'Allow (sad)' },
  { kind: 'att', title: 'Allow "Sellf" to track your activity across other companies\' apps and websites?', yes: 'Allow', no: 'Ask App Not to Track' },
  { kind: 'ask', key: 'crush', title: 'Quick survey (1 of 1)', body: 'Who\'s your celebrity crush?', placeholder: 'For ad targeting purposes', yes: 'Submit' },
  { kind: 'rate', title: 'Enjoying having your data harvested?', body: 'Rate us on the App Store', yes: '★★★★★' },
  { kind: 'perm', icon: '📷', title: 'Sellf wants to use your camera', body: 'Nice shirt, by the way.', yes: 'Allow', no: 'Allow anyway' },
  { kind: 'ask', key: 'screen', title: 'Be honest', body: 'What\'s your daily screen time?', placeholder: 'We already know. Just checking.', yes: 'Confess' },
  { kind: 'leave', title: 'Wait! Don\'t go!', body: 'You haven\'t given us everything yet.', yes: 'Fine, take it all' },
];
const AUTO_EVERY = 1100;
const FINAL_AT = POPUPS.length;

let uid = 0;
const place = (i) => {
  // Scatter, but drift toward the middle as the pile grows.
  const spread = Math.max(0.35, 1 - i * 0.03);
  return {
    x: 50 + (Math.random() - 0.5) * 70 * spread,
    y: 46 + (Math.random() - 0.5) * 56 * spread,
    r: (Math.random() - 0.5) * 8,
  };
};

function Popup({ p, onDone, z }) {
  const [val, setVal] = useState('');
  const [dodge, setDodge] = useState(0);
  const input = useRef(null);
  const submit = (e) => {
    e?.preventDefault();
    if (p.key && val.trim()) remember(p.key, val.trim());
    onDone(p.id, 'yes');
  };
  return (
    <form className={`pop pop-${p.kind}`} onSubmit={submit} data-noclick
      style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: z, '--r': `${p.r}deg` }}>
      <button type="button" className="pop-x" aria-label="Close" onClick={() => onDone(p.id, 'close')}>×</button>
      {p.icon && <div className="pop-icon">{p.icon}</div>}
      <p className="pop-t">{p.title}</p>
      {p.body && <p className="pop-b">{p.body}</p>}
      {p.kind === 'ask' && (
        <input ref={input} className="pop-in" value={val} onChange={(e) => setVal(e.target.value)} placeholder={p.placeholder} maxLength={60}
          onKeyDown={(e) => e.stopPropagation()} />
      )}
      <div className="pop-btns">
        <button type="submit" className="pop-yes">{p.yes}</button>
        {p.no && (
          <button type="button" className="pop-no" style={{ transform: `translate(${dodge * 18}px, ${dodge ? -6 : 0}px)` }}
            onPointerEnter={() => setDodge((d) => (d >= 0 ? -1 : 1))} onClick={() => onDone(p.id, 'yes')}>{p.no}</button>
        )}
      </div>
    </form>
  );
}

export function PopupStorm({ active }) {
  const deck = useDeck();
  const [pops, setPops] = useState([]);
  const [served, setServed] = useState(0);
  const [accepted, setAccepted] = useState(0);
  const servedRef = useRef(0);
  const [started, setStarted] = useState(false);

  const spawn = useCallback((n = 1) => {
    setPops((list) => {
      let out = list;
      for (let k = 0; k < n; k += 1) {
        const i = servedRef.current;
        if (i >= POPUPS.length) break;
        servedRef.current += 1;
        out = [...out, { ...POPUPS[i], id: ++uid, ...place(i) }];
      }
      return out.slice(-9);
    });
    setServed(servedRef.current);
  }, []);

  useEffect(() => {
    if (!active || !started) return undefined;
    const id = setInterval(() => { if (servedRef.current < POPUPS.length) spawn(1); }, AUTO_EVERY);
    return () => clearInterval(id);
  }, [active, started, spawn]);

  const onDone = (id, how) => {
    setPops((l) => l.filter((x) => x.id !== id));
    if (how === 'yes') setAccepted((a) => a + 1);
    else spawn(2); // closing one only makes it worse
  };

  const start = () => { if (!started) { setStarted(true); spawn(2); } };
  const done = served >= FINAL_AT;
  const count = Object.keys(collected()).length;

  return (
    <div className="storm" data-noclick onPointerDown={start}>
      <div className="fake-site" aria-hidden={started}>
        <p className="fs-logo">sellf<span>.com</span></p>
        <div className="fs-hero">
          <span className="fs-line" /><span className="fs-line short" /><span className="fs-line" />
        </div>
        {!started && (
          <button type="button" className="fs-enter" onClick={start}>
            <span>Enter site</span>
            <small>just one click, we promise</small>
          </button>
        )}
      </div>
      {pops.map((p, i) => <Popup key={p.id} p={p} onDone={onDone} z={10 + i} />)}
      {started && (
        <div className="storm-meter" aria-live="polite">
          <span className="rec"><i />collecting</span>
          <b>{accepted}</b> permissions granted · <b>{count}</b> answers saved
        </div>
      )}
      {done && (
        <button type="button" className="storm-done" onClick={(e) => deck.advance(e.currentTarget)}>
          Thank you for your data →
        </button>
      )}
    </div>
  );
}
