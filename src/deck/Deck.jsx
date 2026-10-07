import { useEffect, useRef, useState } from 'react';
import { Deck as Engine } from '../engine.jsx';
import ClickSpark from '../rb/ClickSpark.jsx';
import CountUp from '../rb/CountUp.jsx';
import { QRBox } from '../QR.jsx';
import Wordmark from '../Wordmark.jsx';
import { BUCKETS, BUYERS, PREMIUM_PRICE, PRICE, simulateYear } from '../model.js';
import './deck.css';

const SITE = location.origin;
const HOST = location.host;

const Show = ({ when, children, className = '', as: T = 'div', d = 0 }) => (
  <T className={`show ${when ? 'on' : ''} ${className}`} style={{ '--d': `${d}ms` }}>{children}</T>
);

/* ---------- 1. blank, for the video ----------
   Plays public/video.mp4 if it exists, or drag any video file onto the slide. Click plays/pauses. */
function Video({ active }) {
  const [src, setSrc] = useState('/video.mp4');
  const [ok, setOk] = useState(false);
  const v = useRef(null);
  useEffect(() => { if (!active) v.current?.pause(); }, [active]);
  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('video/')) { setSrc(URL.createObjectURL(f)); setOk(true); }
  };
  return (
    <div className="vid" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <video ref={v} src={src} playsInline preload="auto" className={ok ? 'on' : ''} data-noclick={ok ? '' : undefined}
        onLoadedData={() => setOk(true)} onError={() => setOk(false)}
        onClick={(e) => { e.stopPropagation(); const el = v.current; if (el) (el.paused ? el.play() : el.pause()); }} />
    </div>
  );
}

/* ---------- 2. what the company does ---------- */
const AI = ['OpenAI', 'Anthropic', 'Google DeepMind', 'xAI', 'Mistral', 'Meta AI'];
const DATA = ['Meta', 'Google', 'TikTok', 'Amazon', '600+ data brokers'];
function What({ beat }) {
  const rows = [...BUYERS.high.slice(0, 3), BUYERS.low[0]];
  return (
    <div className="pad what">
      <div className="what-head">
        <p className="eyebrow"><Wordmark /> · what we do</p>
        <h2 className="mid">California gave you a <s className="blue">Delete</s> button.<br />We give you a <span className="red">Sell</span> button.</h2>
      </div>
      <div className="what-grid">
        <Show when={beat >= 1} className="wcard">
          <p className="wc-n">1 · We sell you</p>
          <p className="wc-t">To everyone already taking your data.</p>
          <div className="chips">{DATA.map((t, i) => <span key={t} className="chip" style={{ '--i': i }}>{t}</span>)}</div>
          <div className="chips">{AI.map((t, i) => <span key={t} className="chip buy" style={{ '--i': i + 5 }}>{t}</span>)}</div>
          <p className="wc-f">Same trackers they use, across every device. Never health or financial data. You keep 50%.</p>
        </Show>
        <Show when={beat >= 2} className="wcard ink">
          <p className="wc-n">2 · Your data portfolio</p>
          {['low', 'high'].map((k) => (
            <div key={k} className={`wb wb-${k}`}>
              <div className="wb-top"><b>{BUCKETS[k].name}</b><span>{BUCKETS[k].range}</span></div>
              <p>{BUCKETS[k].what}: {BUCKETS[k].items.toLowerCase()} → {BUCKETS[k].to.toLowerCase()}</p>
              <i style={{ '--w': k === 'low' ? '34%' : '100%' }} />
            </div>
          ))}
        </Show>
        <Show when={beat >= 3} className="wcard">
          <p className="wc-n">3 · Who wanted you</p>
          <ul className="wrows">
            {rows.map((r) => (
              <li key={r.co}><b>{r.co}</b><span>{r.did}</span><em>${r.paid.toFixed(2)}</em></li>
            ))}
          </ul>
          <p className="wc-f">A statement every month: who bought you, what they got, what you made.</p>
        </Show>
      </div>
    </div>
  );
}

/* ---------- 3. pricing + application ---------- */
function Pricing({ beat, active }) {
  const year = simulateYear(0.4, 7).slice(0, 8);
  const top = Math.max(60, ...year);
  const loop = ['Apply', 'Get accepted', `Pay $${PRICE}/mo to stay on`, 'Stop paying → reapply'];
  return (
    <div className="pad pricing">
      <div className="pr-head">
        <p className="eyebrow">Pricing</p>
        <h2 className="mid">You don't sign up. <span className="red">You apply.</span></h2>
      </div>
      <ol className="ploop">
        {loop.map((t, i) => <li key={t} style={{ '--i': i }}><span>{i + 1}</span>{t}</li>)}
        <i className="ploop-back" aria-hidden="true">↺</i>
      </ol>
      <div className="pr-grid">
        <Show when={beat >= 1} className="pcard">
          <p className="pc-n">Member</p>
          <p className="pc-p">${active ? <CountUp to={PRICE} from={0} duration={1} /> : PRICE}<small>/mo</small></p>
          <div className="mini" style={{ '--line-n': PRICE / top }}>
            {year.map((m, i) => <i key={i} className={m > PRICE ? 'win' : ''} style={{ '--h': `${(m / top) * 100}%`, '--i': i }} />)}
            <em>${PRICE}</em>
          </div>
          <p className="pc-f">Sometimes you profit. Sometimes you don't. Red months beat the fee.</p>
        </Show>
        <Show when={beat >= 2} className="pcard prem" d={100}>
          <p className="pc-n">Premium · Off the Market</p>
          <p className="pc-p">${PREMIUM_PRICE}<small>/mo</small></p>
          <p className="pc-big">No company gets your data. At all.</p>
          <p className="pc-f">Not data brokers. Not AI companies. Nobody.</p>
        </Show>
        <Show when={beat >= 2} className="pqr" d={250}>
          <QRBox url={SITE} />
          <span>Apply now</span>
          <small>{HOST}</small>
        </Show>
      </div>
    </div>
  );
}

const SLIDES = [
  { id: 'video', theme: 'ink', Component: Video, label: 'Video' },
  { id: 'what', theme: 'white', enter: 'dome', beats: 3, Component: What, label: 'What we do' },
  { id: 'pricing', theme: 'white', enter: 'arch', beats: 2, Component: Pricing, label: 'Pricing + application' },
];

function Chrome({ idx, slides }) {
  if (idx === 0) return null; // the video slide stays blank
  return (
    <>
      <div className="fbar fbar-top"><span className="fbar-logo"><Wordmark /></span><span className="rec"><i />collecting</span></div>
      <div className="fbar fbar-bottom"><span className="fbar-num">{String(idx + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span><span className="fbar-hint">{HOST}</span></div>
    </>
  );
}

export default function Deck() {
  useEffect(() => { document.title = 'sell.yoursellf — the pitch'; document.body.classList.add('is-deck'); }, []);
  return (
    <ClickSpark sparkColor="#e4002b" sparkSize={12} sparkRadius={22} sparkCount={10} duration={500}>
      <Engine slides={SLIDES} chrome={(ctx) => <Chrome {...ctx} />} />
    </ClickSpark>
  );
}
