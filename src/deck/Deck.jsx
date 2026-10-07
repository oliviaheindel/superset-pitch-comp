import { useEffect, useRef, useState } from 'react';
import { Deck as Engine, Unlock } from '../engine.jsx';
import ClickSpark from '../rb/ClickSpark.jsx';
import Shuffle from '../rb/Shuffle.jsx';
import DecryptedText from '../rb/DecryptedText.jsx';
import CountUp from '../rb/CountUp.jsx';
import { QRBox } from '../QR.jsx';
import { battery, cap, collectDevice, postSignup, useStats } from '../shared.js';
import { PopupStorm } from './Popups.jsx';
import { collected, startedAt } from './store.js';
import './deck.css';

const SITE = location.origin;
const HOST = location.host;

/* Lines that rise in on a beat. */
const Show = ({ when, children, className = '', as: T = 'div', d = 0 }) => (
  <T className={`show ${when ? 'on' : ''} ${className}`} style={{ '--d': `${d}ms` }}>{children}</T>
);

/* ---------- 1. the popup storm ---------- */
function Storm({ active }) {
  return <PopupStorm active={active} />;
}

/* ---------- 2. the receipt ---------- */
const LABELS = { name: 'Name', email: 'Email', birthday: 'Birthday', pet: 'First pet', street: 'Childhood street', crush: 'Celebrity crush', screen: 'Screen time' };
function Receipt({ active }) {
  const [dev, setDev] = useState(() => collectDevice());
  const [secs] = useState(() => Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
  const sent = useRef(false);
  const answers = collected();
  useEffect(() => { battery().then((b) => b && setDev((d) => ({ ...d, battery: b }))); }, []);
  // The popups' answers become a real signup (if they gave a name), so they show up on the traction slide.
  useEffect(() => {
    if (!active || sent.current || !answers.name) return;
    sent.current = true;
    postSignup({ source: 'deck', name: answers.name, email: /@/.test(answers.email || '') ? answers.email : '', answers, device: dev }).catch(() => {});
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = [
    ...Object.entries(LABELS).filter(([k]) => answers[k]).map(([k, l]) => [l, answers[k]]),
    ['Device', `${dev.device} · ${dev.os} · ${dev.browser}`], ['Screen', dev.screen], ['Time zone', dev.timezone],
    ['Local time', dev.localTime], ['Battery', dev.battery], ['Vibe', dev.vibe],
  ].filter(([, v]) => v);
  return (
    <div className="pad split2">
      <div>
        <p className="eyebrow">Receipt</p>
        <h2 className="mid">That took<br /><span className="red">{secs} seconds.</span></h2>
        <p className="under">and you said yes to all of it.</p>
      </div>
      <div className="receipt">
        <p className="rc-h"><span>SELLF DATA CO.</span><span>{new Date().toLocaleDateString()}</span></p>
        <ul>
          {rows.map(([k, v], i) => (
            <li key={k} style={{ '--i': i }}>
              <span>{k}</span>
              {active ? <DecryptedText text={String(v)} animateOn="view" sequential speed={28} className="dv" encryptedClassName="dv enc" /> : <b className="dv">{v}</b>}
            </li>
          ))}
        </ul>
        <p className="rc-total"><span>Paid to you</span><span>$0.00</span></p>
      </div>
    </div>
  );
}

/* ---------- 3. the problem ---------- */
function Problem({ active, beat }) {
  return (
    <div className="pad center">
      <p className="eyebrow">The problem</p>
      <h2 className="big">Meta makes <span className="red">${active ? <CountUp to={200} from={0} duration={1.6} /> : '200'}+</span></h2>
      <p className="under">a year off every North American user.</p>
      <Show when={beat >= 1} className="you-make"><h2 className="huge blue">You make $0.</h2></Show>
    </div>
  );
}

/* ---------- 4. the name ---------- */
function Name({ active }) {
  return (
    <div className="pad center">
      <p className="eyebrow light">Introducing</p>
      <h1 className="logo-xl">SELLF<span>®</span></h1>
      {active && <Shuffle text="Sell yourself." tag="p" className="name-sub" duration={0.45} shuffleTimes={3} stagger={0.05} rootMargin="0px" triggerOnHover />}
      <p className="acc-xl">literally.</p>
    </div>
  );
}

/* ---------- 5. how it works ---------- */
const TRACKERS = ['Cookies', 'Tracking pixels', 'SDKs', 'Ad IDs', 'Location pings', 'Fingerprinting'];
const DEVICES = [['💻', 'Laptop'], ['📱', 'Phone'], ['📟', 'Tablet'], ['📺', 'TV'], ['🚗', 'Car'], ['🧊', 'Smart fridge']];
const BUYERS = ['Meta', 'Google', 'TikTok', 'Amazon', 'That one app you deleted'];
function How({ beat }) {
  return (
    <div className="pad how2">
      <p className="eyebrow">How it works</p>
      <div className="how-rows">
        <div className="how-row on">
          <span className="how-n">1</span>
          <div><h3>We use the exact same trackers they use.</h3>
            <div className="chips">{TRACKERS.map((t, i) => <span key={t} className="chip" style={{ '--i': i }}>{t}</span>)}</div></div>
        </div>
        <Show when={beat >= 1} className="how-row">
          <span className="how-n">2</span>
          <div><h3>Turn it on across your devices. <span className="red">We keep everything.</span></h3>
            <div className="chips">{DEVICES.map(([e, t], i) => <span key={t} className="chip dev" style={{ '--i': i }}>{e} {t}</span>)}</div></div>
        </Show>
        <Show when={beat >= 2} className="how-row">
          <span className="how-n">3</span>
          <div><h3>Then we sell it to <span className="blue">the exact same companies.</span></h3>
            <div className="chips">{BUYERS.map((t, i) => <span key={t} className="chip buy" style={{ '--i': i }}>{t}</span>)}</div></div>
        </Show>
      </div>
    </div>
  );
}

/* ---------- 6. nothing changes ---------- */
function Same({ beat }) {
  const Flow = ({ paid }) => (
    <div className="flow2">
      <span className="nd you">You</span><i className="ar" /><span className="nd">your data</span><i className="ar" /><span className="nd">Meta · Google · TikTok</span>
      <span className={`bag ${paid ? 'paid' : ''}`}>{paid ? '+50% 💰' : '$0'}</span>
    </div>
  );
  return (
    <div className="pad center">
      <div className="ba2">
        <div className="ba2-card"><p className="ba2-l">Before Sellf</p><Flow /></div>
        <div className="ba2-card after"><p className="ba2-l">After Sellf</p><Flow paid /></div>
      </div>
      <Show when={beat >= 1}><h2 className="mid">Nothing changes. <span className="acc">That's the feature.</span></h2></Show>
    </div>
  );
}

/* ---------- 7. earn more ---------- */
const TIERS = [['Browser only', 0.42, 8], ['+ Give us your phone', 2.22, 42], ['+ Every device you own', 5.32, 100]];
function Earn({ beat }) {
  return (
    <div className="pad">
      <p className="eyebrow">Earnings</p>
      <h2 className="mid">The more you give, <span className="red">the more you make.</span></h2>
      <div className="tiers">
        {TIERS.map(([l, v, w], i) => (
          <div key={l} className="tier" style={{ '--w': `${w}%`, '--d': `${300 + i * 250}ms` }}>
            <span className="tier-l">{l}</span>
            <span className="tier-bar"><b>${v.toFixed(2)}<small>/mo</small></b></span>
          </div>
        ))}
      </div>
      <Show when={beat >= 1} className="never2">
        <span className="no">🚫 Health data</span><span className="no">🚫 Financial data</span>
        <p className="under">We have standards. They're low, but they're there.</p>
      </Show>
    </div>
  );
}

/* ---------- 8. premium ---------- */
function Exclusive({ beat }) {
  return (
    <div className="pad center">
      <p className="eyebrow light">Premium</p>
      <h2 className="big">Sellf <span className="red">Exclusive™</span></h2>
      <p className="body-xl">We block every other company from keeping your data…</p>
      <Show when={beat >= 1}><p className="body-xl strong">…so we're the only ones who can <span className="red">sell it to them.</span></p></Show>
      <Show when={beat >= 2}><p className="acc-l">Your data has never been more exclusive. Or more available.</p></Show>
    </div>
  );
}

/* ---------- 9. the split ---------- */
function Split({ active }) {
  const parts = [['You', 50, 'var(--red)'], ['Us', 25, 'var(--blue)'], ['Our investors', 25, 'var(--ink)']];
  let off = 0;
  return (
    <div className="pad split2">
      <svg className={`donut ${active ? 'on' : ''}`} viewBox="0 0 42 42" aria-hidden="true">
        {parts.map(([k, v, c], i) => {
          const el = <circle key={k} cx="21" cy="21" r="15.915" fill="none" stroke={c} strokeWidth="7" strokeDashoffset={25 - off} style={{ '--d': `${i * 260}ms`, '--dash': `${v} ${100 - v}` }} />;
          off += v;
          return el;
        })}
        <text x="21" y="23.5" textAnchor="middle" className="donut-t">50/25/25</text>
      </svg>
      <div>
        <p className="eyebrow">Business model</p>
        <ul className="legend">
          {parts.map(([k, v, c]) => <li key={k}><i style={{ background: c }} /><b>{v}%</b> {k}</li>)}
        </ul>
        <p className="under">Is that a lot of people taking a cut of you? Yes. But now you're one of them.</p>
      </div>
    </div>
  );
}

/* ---------- 10. pricing ---------- */
function Pricing({ beat }) {
  return (
    <div className="pad center">
      <p className="eyebrow light">Unit economics</p>
      <table className="price">
        <tbody>
          <tr><td>Sellf Exclusive™</td><td>$9.99/mo</td></tr>
          <tr><td>Average payout</td><td>$4.20/mo</td></tr>
          <tr className={`net ${beat >= 1 ? 'on' : ''}`}><td>Net</td><td>−$5.79/mo</td></tr>
        </tbody>
      </table>
      <Show when={beat >= 1}><p className="acc-l">For the first time, you're losing money on your own terms.</p></Show>
    </div>
  );
}

/* ---------- 11. traction (live) ---------- */
function Traction({ active }) {
  const { count, names } = useStats(3000);
  return (
    <div className="pad split2">
      <div>
        <p className="eyebrow light"><span className="rec"><i />Live</span> Traction</p>
        <p className="count-xl">{active ? <CountUp key={count} to={count} from={Math.max(0, count - 3)} duration={0.8} /> : count}</p>
        <p className="acc-l">{count === 1 ? 'person in this room has' : 'people in this room have'} already sold themselves.</p>
        <ul className="names">{names.slice(0, 16).map((n, i) => <li key={n + i} style={{ '--i': i }}>{cap(n)}</li>)}</ul>
      </div>
      <div className="qr-card">
        <QRBox url={SITE} />
        <p>Scan to sell yourself</p>
        <small>{HOST}</small>
      </div>
    </div>
  );
}

/* ---------- 12. close ---------- */
function Close() {
  return (
    <div className="pad center close">
      <h2 className="big">50% of something</h2>
      <h2 className="big outline">beats 100% of nothing.</h2>
      <p className="acc-l">Sellf. We're raising $5M for 25% of you.</p>
      <div className="close-qr"><QRBox url={SITE} /><span>{HOST}</span></div>
      <Unlock className="sr-only">End</Unlock>
    </div>
  );
}

const SLIDES = [
  { id: 'storm', theme: 'white', Component: Storm, label: 'Popups' },
  { id: 'receipt', theme: 'ink', enter: 'zoom', Component: Receipt, label: 'What we collected' },
  { id: 'problem', theme: 'white', enter: 'push', beats: 1, Component: Problem, label: 'The problem' },
  { id: 'name', theme: 'red', enter: 'dome', Component: Name, label: 'Sellf' },
  { id: 'how', theme: 'white', enter: 'arch', beats: 2, Component: How, label: 'How it works' },
  { id: 'same', theme: 'blue', enter: 'swap', beats: 1, Component: Same, label: 'Nothing changes' },
  { id: 'earn', theme: 'white', enter: 'flip', beats: 1, Component: Earn, label: 'Earn more' },
  { id: 'exclusive', theme: 'ink', enter: 'zoom', beats: 2, Component: Exclusive, label: 'Premium' },
  { id: 'split', theme: 'white', enter: 'sweep', Component: Split, label: 'The split' },
  { id: 'pricing', theme: 'red', enter: 'push', beats: 1, Component: Pricing, label: 'Pricing' },
  { id: 'traction', theme: 'ink', enter: 'dome', Component: Traction, label: 'Traction' },
  { id: 'close', theme: 'blue', enter: 'arch', Component: Close, label: 'Close' },
];

function Chrome({ idx, slides }) {
  return (
    <>
      <div className="fbar fbar-top"><span className="fbar-logo">SELLF®</span><span className="rec"><i />collecting</span></div>
      <div className="fbar fbar-bottom"><span className="fbar-num">{String(idx + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span><span className="fbar-hint">← → to move · {HOST}</span></div>
    </>
  );
}

export default function Deck() {
  useEffect(() => { document.title = 'Sellf — the pitch'; document.body.classList.add('is-deck'); }, []);
  return (
    <ClickSpark sparkColor="#e4002b" sparkSize={12} sparkRadius={22} sparkCount={10} duration={500}>
      <Engine slides={SLIDES} chrome={(ctx) => <Chrome {...ctx} />} />
    </ClickSpark>
  );
}
