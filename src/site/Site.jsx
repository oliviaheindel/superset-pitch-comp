import { useEffect, useMemo, useRef, useState } from 'react';
import Shuffle from '../rb/Shuffle.jsx';
import DecryptedText from '../rb/DecryptedText.jsx';
import CountUp from '../rb/CountUp.jsx';
import DotGrid from '../rb/DotGrid.jsx';
import ClickSpark from '../rb/ClickSpark.jsx';
import { battery, cap, collectDevice, postSignup, useStats } from '../shared.js';
import { BUCKETS, BUYERS, MONTHS, PREMIUM_PRICE, PRICE, simulateYear } from '../model.js';
import Wordmark from '../Wordmark.jsx';
import './site.css';

const DEMO = import.meta.env.MODE === 'single'; // the preview build has no backend

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
const Reveal = ({ as: T = 'div', className = '', children, ...p }) => <T ref={useReveal()} className={`rv ${className}`} {...p}>{children}</T>;

function Num({ value, decimals = 2, prefix = '$' }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const a = from.current, b = value, t0 = performance.now();
    let raf;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3);
      setShown(a + (b - a) * e);
      if (k < 1) raf = requestAnimationFrame(step); else from.current = b;
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); from.current = b; };
  }, [value]);
  return <span className="num">{shown < -0.004 ? '−' : ''}{prefix}{Math.abs(shown).toFixed(decimals)}</span>;
}

const TICKER = ['location', 'search history', 'screen time', 'group chats', 'voice memos', '3am snack orders', 'that one playlist', 'who you stalk', 'cart you abandoned', 'scroll speed', 'wifi name'];

function Nav() {
  return (
    <header className="nav">
      <a href="#top" className="logo" aria-label="sell.yoursellf home"><Wordmark /></a>
      <span className="rec"><i /><span className="rec-t">collecting</span></span>
      <a href="#apply" className="btn btn-red btn-sm">Apply</a>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-dots" aria-hidden="true">
        <DotGrid dotSize={5} gap={22} baseColor="#d8ddf7" activeColor="#e4002b" proximity={130} shockRadius={220} shockStrength={4} resistance={700} returnDuration={1.4} />
      </div>
      <div className="hero-in">
        <p className="eyebrow">Membership by application only</p>
        <h1 className="hero-h">
          <Shuffle text="Sell" tag="span" className="h-line" textAlign="left" duration={0.4} shuffleTimes={2} stagger={0.04} triggerOnHover rootMargin="0px" />
          <Shuffle text="yourself." tag="span" className="h-line red" textAlign="left" duration={0.4} shuffleTimes={3} stagger={0.04} triggerOnHover rootMargin="0px" />
        </h1>
        <p className="hero-acc">literally.</p>
        <p className="hero-body">California gave you a <b className="blue-b">Delete</b> button. We give you a <b>Sell</b> button. Your data becomes a portfolio: we sell it to the data companies <i>and</i> the AI companies already taking it, and you keep 50%.</p>
        <div className="hero-cta">
          <a href="#apply" className="btn btn-red">Apply to sell yourself →</a>
          <a href="#portfolio" className="btn btn-ghost">See a portfolio</a>
        </div>
      </div>
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map((k) => <span key={k}>{TICKER.map((t) => <em key={t}>{t}<b>•</b></em>)}</span>)}
        </div>
      </div>
    </section>
  );
}

function Drop() {
  return (
    <section className="drop">
      <Reveal className="drop-in">
        <div className="drop-btn del"><span>Delete</span><small>California's DROP: tell 600+ data brokers to delete you. Live since Aug 2026.</small></div>
        <span className="drop-vs">vs</span>
        <div className="drop-btn sell"><span>Sell</span><small>sell.yoursellf: make those same companies pay you instead.</small></div>
      </Reveal>
    </section>
  );
}

function Live() {
  const { count, names, loaded } = useStats(5000);
  return (
    <section className="live">
      <Reveal className="live-in">
        <p className="eyebrow light">Live from the waitlist</p>
        <div className="live-n"><CountUp to={count} from={0} duration={1.2} separator="," /></div>
        <p className="live-l">{count === 1 ? 'person has' : 'people have'} applied to sell themselves{loaded ? '.' : '…'}</p>
        {names.length > 0 && (
          <ul className="live-names" aria-label="Recent applicants">
            {names.slice(0, 14).map((n, i) => <li key={n + i} style={{ '--i': i }}>{cap(n)}</li>)}
          </ul>
        )}
      </Reveal>
    </section>
  );
}

function How() {
  const steps = [
    ['01', 'Apply.', 'You can\'t just sign up. Not everyone is worth buying. (Everyone is worth buying.)'],
    ['02', 'Turn it on across your devices.', 'We use the exact same trackers everyone else uses, and keep everything. Never health data. Never financial data.'],
    ['03', 'We sell you. You see who bought.', 'Data companies and AI companies bid on your portfolio. You get a breakdown of who took what, and you keep 50%.'],
  ];
  return (
    <section className="how" id="how">
      <Reveal className="sec-head">
        <p className="eyebrow">How it works</p>
        <h2 className="h2">They already take it.<br /><span className="blue">Now they pay you.</span></h2>
      </Reveal>
      <ol className="steps">
        {steps.map(([n, t, d], i) => (
          <Reveal as="li" key={n} className="step" style={{ '--d': `${i * 110}ms` }}>
            <span className="step-n">{n}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function Breakdown() {
  const [tab, setTab] = useState('high');
  const rows = BUYERS[tab];
  const max = Math.max(...rows.map((r) => r.paid), 1);
  const total = rows.reduce((s, r) => s + r.paid, 0);
  return (
    <section className="bd" id="breakdown">
      <Reveal className="sec-head">
        <p className="eyebrow light">Your monthly statement</p>
        <h2 className="h2">Who wanted you,<br />and what they got.</h2>
      </Reveal>
      <Reveal className="bd-card">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'high'} className={tab === 'high' ? 'on' : ''} onClick={() => setTab('high')}>AI companies</button>
          <button role="tab" aria-selected={tab === 'low'} className={tab === 'low' ? 'on' : ''} onClick={() => setTab('low')}>Data companies</button>
        </div>
        <ul className="bd-rows" key={tab}>
          {rows.map((r, i) => (
            <li key={r.co} style={{ '--i': i, '--w': `${(r.paid / max) * 100}%` }}>
              <div className="bd-top"><b>{r.co}</b><span className="bd-paid">${r.paid.toFixed(2)}</span></div>
              <p><span>Took:</span> {r.took}</p>
              <p><span>Got out of it:</span> {r.did}</p>
              <i className="bd-bar" />
            </li>
          ))}
        </ul>
        <p className="bd-total"><span>Your cut this month</span><b>${total.toFixed(2)}</b></p>
        <p className="bd-fine">Sample statement. Made-up numbers. It's a parody.</p>
      </Reveal>
    </section>
  );
}

function Portfolio({ high, setHigh }) {
  const [seed, setSeed] = useState(7);
  const year = useMemo(() => simulateYear(high / 100, seed), [high, seed]);
  const wins = year.filter((v) => v > PRICE).length;
  const net = year.reduce((s, v) => s + v - PRICE, 0);
  const top = Math.max(60, ...year);
  return (
    <section className="pf" id="portfolio">
      <Reveal className="sec-head">
        <p className="eyebrow">Your data portfolio</p>
        <h2 className="h2">Pick your risk.<br /><span className="red">Monetize yourself.</span></h2>
      </Reveal>
      <div className="pf-grid">
        <Reveal className="buckets">
          {['low', 'high'].map((k) => {
            const b = BUCKETS[k];
            const pct = k === 'high' ? high : 100 - high;
            return (
              <div key={k} className={`bucket b-${k}`}>
                <div className="bk-top"><span className="bk-name">{b.name}</span><span className="bk-pct">{pct}%</span></div>
                <p className="bk-what">{b.what}</p>
                <p className="bk-items">{b.items}</p>
                <p className="bk-to">→ {b.to} · <b>{b.range}</b></p>
                <p className="bk-note">{b.note}</p>
              </div>
            );
          })}
          <label className="slider">
            <span>Low risk</span>
            <input type="range" min="0" max="100" step="5" value={high} onChange={(e) => setHigh(Number(e.target.value))} aria-label="Share of your portfolio in high risk" />
            <span>High risk</span>
          </label>
        </Reveal>
        <Reveal className="sim">
          <p className="sim-l">A simulated year · ${PRICE}/mo membership</p>
          <div className="chart" style={{ '--line-n': PRICE / top }}>
            {year.map((v, i) => (
              <div key={i} className={`col ${v > PRICE ? 'win' : ''}`} style={{ '--h': `${(v / top) * 100}%` }} title={`${MONTHS[i]}: $${v.toFixed(2)}`}>
                <i /><span>{MONTHS[i][0]}</span>
              </div>
            ))}
            <em className="fee">${PRICE} fee</em>
          </div>
          <p className="sim-wins">You profited <b>{wins} of 12</b> months.</p>
          <p className="sim-net">Year: <span className={net < 0 ? 'neg' : 'pos'}><Num value={net} /></span></p>
          <button className="btn btn-white" onClick={() => setSeed((s) => s + 1)}>Simulate another year</button>
        </Reveal>
      </div>
    </section>
  );
}

function Pricing() {
  const loop = ['Apply', 'Get accepted', `Pay $${PRICE} every month to stay on the market`, 'Miss a payment? You\'re delisted. Reapply.'];
  return (
    <section className="price-sec" id="pricing">
      <Reveal className="sec-head">
        <p className="eyebrow light">Pricing</p>
        <h2 className="h2">You don't sign up.<br />You apply.</h2>
      </Reveal>
      <Reveal as="ol" className="loop">
        {loop.map((t, i) => <li key={t} style={{ '--d': `${i * 140}ms` }}><span>{i + 1}</span>{t}</li>)}
      </Reveal>
      <div className="plans">
        <Reveal className="plan">
          <p className="plan-n">Member</p>
          <p className="plan-p">${PRICE}<small>/mo</small></p>
          <ul><li>Your data portfolio, low + high risk</li><li>Monthly statement of who bought you</li><li>You keep 50% of every sale</li><li>Some months you profit. Some months you don't.</li></ul>
        </Reveal>
        <Reveal className="plan prem" style={{ '--d': '140ms' }}>
          <p className="plan-n">Premium · Off the Market</p>
          <p className="plan-p">${PREMIUM_PRICE}<small>/mo</small></p>
          <ul><li>No company gets your data. At all.</li><li>Not data brokers. Not AI companies. Nobody.</li><li>You earn $0 and feel incredible</li></ul>
        </Reveal>
      </div>
    </section>
  );
}

const DEVICES = ['Phone', 'Laptop', 'Tablet', 'TV', 'Car', 'Smart fridge'];
const REVIEW = ['Reading your screen time…', 'Skimming your group chats…', 'Asking OpenAI if they want you…', 'Checking your credit— kidding. We never touch financial data.', 'Decision made.'];

function Apply({ high }) {
  const [device, setDevice] = useState(null);
  const [f, setF] = useState({ name: '', email: '', devices: ['Phone', 'Laptop'], screen: '5–8 hours', why: '', plan: 'member' });
  const [stage, setStage] = useState('form'); // form → review → accepted → lapsed
  const [step, setStep] = useState(0);
  const [err, setErr] = useState('');
  const [app, setApp] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setDevice(collectDevice());
    battery().then((b) => b && setDevice((x) => ({ ...x, battery: b })));
  }, []);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const toggleDev = (d) => setF((s) => ({ ...s, devices: s.devices.includes(d) ? s.devices.filter((x) => x !== d) : [...s.devices, d] }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setStage('review');
    setStep(0);
    const save = DEMO ? Promise.resolve() : postSignup({
      source: 'site', name: f.name, email: f.email, plan: f.plan,
      answers: { devices: f.devices.join(', '), screenTime: f.screen, why: f.why, highRisk: `${high}%` }, device,
    });
    save.catch(() => {}); // handled below, after the review animation
    for (let i = 1; i < REVIEW.length; i += 1) { await new Promise((r) => setTimeout(r, 750)); setStep(i); }
    try {
      await save;
      setApp({ n: String(Math.floor(1000 + Math.random() * 8999)), name: f.name.trim().split(/\s+/)[0] });
      setStage('accepted');
    } catch (x) {
      setErr(x.message);
      setStage('form');
    }
  };

  const facts = device ? [
    ['Device', device.device], ['OS', device.os], ['Browser', device.browser], ['Screen', device.screen],
    ['Time zone', device.timezone], ['Language', device.language], ['Local time', device.localTime],
    ['Battery', device.battery], ['CPU cores', device.cores], ['Vibe', device.vibe],
  ].filter(([, v]) => v) : [];
  const prem = f.plan === 'premium';

  return (
    <section className="join" id="apply">
      <div className="join-grid">
        <Reveal className="join-form-wrap">
          {stage === 'form' && (
            <form className="join-form" onSubmit={submit}>
              <p className="eyebrow light">Application · takes 30 seconds · acceptance not guaranteed*</p>
              <h2 className="h2">Apply to be<br />on the market.</h2>
              <label className="fld"><span>First name</span>
                <input required maxLength={60} value={f.name} onChange={set('name')} autoComplete="given-name" placeholder="Your name (worth $0.02)" /></label>
              <label className="fld"><span>Email <em>optional, but it's worth $0.04</em></span>
                <input type="email" maxLength={120} value={f.email} onChange={set('email')} autoComplete="email" placeholder="you@literally.anything" /></label>
              <fieldset className="fld"><span>Devices we can track</span>
                <div className="pick">{DEVICES.map((d) => (
                  <button type="button" key={d} className={f.devices.includes(d) ? 'on' : ''} aria-pressed={f.devices.includes(d)} onClick={() => toggleDev(d)}>{d}</button>
                ))}</div></fieldset>
              <label className="fld"><span>Daily screen time</span>
                <select value={f.screen} onChange={set('screen')}>
                  <option>Under 2 hours (suspicious)</option><option>2–5 hours</option><option>5–8 hours</option><option>8+ hours (ideal candidate)</option>
                </select></label>
              <label className="fld"><span>Why would a company want your data?</span>
                <input maxLength={140} value={f.why} onChange={set('why')} placeholder="I have a lot of opinions about air fryers" /></label>
              <div className="fld"><span>Plan</span>
                <div className="pick plan-pick">
                  <button type="button" className={!prem ? 'on' : ''} aria-pressed={!prem} onClick={() => setF((s) => ({ ...s, plan: 'member' }))}>Member · ${PRICE}/mo</button>
                  <button type="button" className={prem ? 'on' : ''} aria-pressed={prem} onClick={() => setF((s) => ({ ...s, plan: 'premium' }))}>Off the Market · ${PREMIUM_PRICE}/mo</button>
                </div></div>
              {err && <p className="err" role="alert">{err}</p>}
              <button className="btn btn-red btn-big">Submit application</button>
              <p className="fine">*It's guaranteed. sell.yoursellf is a parody built for a pitch competition. Nobody is charged, nothing is sold, nothing is tracked. Your first name may show up on the big screen.</p>
            </form>
          )}
          {stage === 'review' && (
            <div className="review" role="status">
              <p className="eyebrow light">Application under review</p>
              <ul>{REVIEW.slice(0, step + 1).map((t, i) => <li key={t} className={i === step ? 'now' : 'done'}>{i < step ? '✓' : '…'} {t}</li>)}</ul>
            </div>
          )}
          {stage === 'accepted' && app && (
            <div className="lot" role="status">
              <p className="lot-top"><span>Application #{app.n}</span><span>sell.yoursellf</span></p>
              <h2 className="lot-name">{cap(app.name)}</h2>
              <p className="lot-desc">{prem ? 'is officially off the market.' : 'is officially on the market.'}</p>
              <dl className="lot-dl">
                <div><dt>Plan</dt><dd>{prem ? `$${PREMIUM_PRICE}/mo` : `$${PRICE}/mo`}</dd></div>
                <div><dt>Low/High risk</dt><dd>{prem ? 'Nobody' : `${100 - high}/${high}`}</dd></div>
                <div><dt>Next payment</dt><dd className="red">Today</dd></div>
              </dl>
              <span className="stamp" aria-hidden="true">ACCEPTED</span>
              <p className="lot-foot">{prem ? 'No company gets your data. You pay us to be left alone.' : 'Keep paying to stay listed. Miss a payment and you start over.'}</p>
              <div className="lot-btns">
                <button className="btn btn-red btn-sm" onClick={() => { setToast('Payment received (not really). See you in 30 days.'); setTimeout(() => setToast(''), 2400); }}>Keep paying</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setStage('lapsed')}>Stop paying</button>
              </div>
              {toast && <p className="toast">{toast}</p>}
            </div>
          )}
          {stage === 'lapsed' && (
            <div className="lot lapsed" role="status">
              <p className="lot-top"><span>Payment missed</span><span>sell.yoursellf</span></p>
              <h2 className="lot-name">Delisted.</h2>
              <p className="lot-desc">Your spot is gone. Companies still have your data. You just don't get paid for it anymore.</p>
              <button className="btn btn-red" onClick={() => setStage('form')}>Reapply →</button>
            </div>
          )}
        </Reveal>
        <Reveal className="dossier">
          <p className="dos-h"><span className="rec"><i />Already collected</span><small>while you were reading</small></p>
          <ul>
            {facts.map(([k, v], i) => (
              <li key={k} style={{ '--i': i }}><span>{k}</span>
                <DecryptedText text={v} animateOn="view" sequential speed={35} revealDirection="start" className="dv" encryptedClassName="dv enc" /></li>
            ))}
          </ul>
          <p className="dos-foot">Every website can see this. We're just the first to show you.</p>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <p className="foot-big"><Wordmark /></p>
      <p className="foot-acc">California gave you a Delete button. We give you a Sell button.</p>
      <p className="foot-fine">sell.yoursellf is a parody startup made for a pitch competition. Nobody is charged and nothing is sold. We don't take health or financial information. We don't take anything, actually.</p>
    </footer>
  );
}

export default function Site() {
  const [high, setHigh] = useState(30);
  useEffect(() => { document.title = 'sell.yoursellf — sell yourself, literally'; }, []);
  return (
    <ClickSpark fixed sparkColor="#e4002b" sparkSize={11} sparkRadius={20} sparkCount={9} duration={480}>
      <div className="site">
        <Nav />
        <Hero />
        <Drop />
        <Live />
        <How />
        <Breakdown />
        <Portfolio high={high} setHigh={setHigh} />
        <Pricing />
        <Apply high={high} />
        <Footer />
      </div>
    </ClickSpark>
  );
}
