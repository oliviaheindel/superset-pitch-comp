import { useEffect, useMemo, useRef, useState } from 'react';
import Shuffle from '../rb/Shuffle.jsx';
import DecryptedText from '../rb/DecryptedText.jsx';
import CountUp from '../rb/CountUp.jsx';
import DotGrid from '../rb/DotGrid.jsx';
import ClickSpark from '../rb/ClickSpark.jsx';
import { battery, cap, collectDevice, postSignup, useStats } from '../shared.js';
import Wordmark from '../Wordmark.jsx';
import './site.css';

/* Adds .in when the element scrolls into view (once). */
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

/* A number that rolls to its new value. */
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
  const neg = shown < -0.004;
  return <span className="num">{neg ? '−' : ''}{prefix}{Math.abs(shown).toFixed(decimals)}</span>;
}

const TICKER = ['location', 'search history', 'screen time', '3am snack orders', 'that one playlist', 'step count', 'typing speed', 'who you stalk', 'cart you abandoned', 'your mom\'s birthday', 'scroll speed', 'wifi name'];

const PERMS = [
  { id: 'browser', label: 'Browser tracking', note: 'Cookies, pixels, the usual. They already do this.', cut: 0.42, locked: true },
  { id: 'phone', label: 'Give us your phone', note: 'Apps, location, contacts, screen time. The good stuff.', cut: 1.8 },
  { id: 'devices', label: 'Turn it on across every device', note: 'Laptop, tablet, TV, car, smart fridge. We keep everything.', cut: 3.1 },
];
const NEVER = [
  { label: 'Health data', note: 'Never. We have standards.' },
  { label: 'Financial data', note: 'Never. They\'re low, but they\'re there.' },
];
const EXCLUSIVE_PRICE = 9.99;
const EXCLUSIVE_BUMP = 1.2;

function Nav() {
  return (
    <header className="nav">
      <a href="#top" className="logo" aria-label="sell.yoursellf home"><Wordmark /></a>
      <span className="rec"><i /><span className="rec-t">collecting</span></span>
      <a href="#join" className="btn btn-red btn-sm">Sell me</a>
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
        <p className="eyebrow">The first data broker that pays you</p>
        <h1 className="hero-h">
          <Shuffle text="Sell" tag="span" className="h-line" textAlign="left" duration={0.4} shuffleTimes={2} stagger={0.04} triggerOnHover rootMargin="0px" />
          <Shuffle text="yourself." tag="span" className="h-line red" textAlign="left" duration={0.4} shuffleTimes={3} stagger={0.04} triggerOnHover rootMargin="0px" />
        </h1>
        <p className="hero-acc">literally.</p>
        <p className="hero-body">Your data is already for sale. You're just not getting paid for it. sell.yoursellf sells it to the exact same companies and gives <b>you 50%</b>.</p>
        <div className="hero-cta">
          <a href="#join" className="btn btn-red">Start selling me →</a>
          <a href="#how" className="btn btn-ghost">How it works</a>
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

function Live() {
  const { count, names, loaded } = useStats(5000);
  return (
    <section className="live">
      <Reveal className="live-in">
        <p className="eyebrow light">Live from the marketplace</p>
        <div className="live-n"><CountUp to={count} from={0} duration={1.2} separator="," /></div>
        <p className="live-l">{count === 1 ? 'person has' : 'people have'} already sold themselves{loaded ? '.' : '…'}</p>
        {names.length > 0 && (
          <ul className="live-names" aria-label="Recently sold">
            {names.slice(0, 14).map((n, i) => <li key={n + i} style={{ '--i': i }}>{cap(n)}</li>)}
          </ul>
        )}
      </Reveal>
    </section>
  );
}

function How() {
  const steps = [
    ['01', 'We use the same trackers they use.', 'Cookies, pixels, SDKs, ad IDs. Nothing new. We\'re not inventing surveillance, we\'re just finally invoicing for it.'],
    ['02', 'Turn it on across your devices.', 'Phone, laptop, tablet, TV. Once it\'s on, we keep everything. Everything everything.'],
    ['03', 'We sell it to the exact same companies.', 'Same buyers. Same data. Same experience for you. The only difference is a Venmo notification.'],
  ];
  return (
    <section className="how" id="how">
      <Reveal className="sec-head">
        <p className="eyebrow">How it works</p>
        <h2 className="h2">Nothing changes.<br /><span className="blue">That's the feature.</span></h2>
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
      <div className="ba">
        {['Before sell.yoursellf', 'After sell.yoursellf'].map((label, i) => (
          <Reveal key={label} className={`ba-card ${i ? 'after' : ''}`} style={{ '--d': `${i * 160}ms` }}>
            <p className="ba-label">{label}</p>
            <div className="flow">
              <span className="node you">You</span>
              <span className="arrow" />
              <span className="node">📱 your data</span>
              <span className="arrow" />
              <span className="node buyers">Meta · Google · TikTok · ???</span>
            </div>
            <p className="ba-foot">{i ? <>+ <b>$$$</b> to you</> : 'You get: $0.00'}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Split() {
  const parts = [['You', 50, 'red'], ['Us', 25, 'blue'], ['Our investors', 25, 'ink']];
  return (
    <section className="split-sec">
      <Reveal className="sec-head">
        <p className="eyebrow light">The split</p>
        <h2 className="h2">50% of something<br />beats 100% of nothing.</h2>
      </Reveal>
      <Reveal className="bars">
        {parts.map(([who, pct, c], i) => (
          <div key={who} className="bar-row" style={{ '--w': `${pct}%`, '--d': `${200 + i * 180}ms` }}>
            <span className="bar-who">{who}</span>
            <span className={`bar bar-${c}`}><b>{pct}%</b></span>
          </div>
        ))}
      </Reveal>
      <Reveal as="p" className="split-note">Is that a lot of people taking a cut of you? Yes. But now you're one of them.</Reveal>
    </section>
  );
}

function Earn({ perms, setPerms, exclusive, setExclusive }) {
  const monthly = PERMS.reduce((s, p) => s + (perms[p.id] ? p.cut : 0), 0) + (exclusive ? EXCLUSIVE_BUMP : 0);
  const net = monthly - (exclusive ? EXCLUSIVE_PRICE : 0);
  return (
    <section className="earn" id="earn">
      <Reveal className="sec-head">
        <p className="eyebrow">Earnings calculator</p>
        <h2 className="h2">The more you give,<br /><span className="red">the more you make.</span></h2>
      </Reveal>
      <div className="earn-grid">
        <Reveal className="toggles">
          {PERMS.map((p) => (
            <label key={p.id} className={`tg ${perms[p.id] ? 'on' : ''} ${p.locked ? 'locked' : ''}`}>
              <input type="checkbox" checked={!!perms[p.id]} disabled={p.locked} onChange={(e) => setPerms((s) => ({ ...s, [p.id]: e.target.checked }))} />
              <span className="sw" aria-hidden="true" />
              <span className="tg-t"><b>{p.label}</b><small>{p.note}</small></span>
              <span className="tg-v">+${p.cut.toFixed(2)}</span>
            </label>
          ))}
          {NEVER.map((p) => (
            <div key={p.label} className="tg never">
              <span className="sw" aria-hidden="true" />
              <span className="tg-t"><b>{p.label}</b><small>{p.note}</small></span>
              <span className="tg-v">🔒</span>
            </div>
          ))}
          <label className={`tg tg-ex ${exclusive ? 'on' : ''}`}>
            <input type="checkbox" checked={exclusive} onChange={(e) => setExclusive(e.target.checked)} />
            <span className="sw" aria-hidden="true" />
            <span className="tg-t"><b>Exclusive™ · ${EXCLUSIVE_PRICE}/mo</b><small>We block every other company from keeping your data, so we're the only ones who can sell it to them.</small></span>
            <span className="tg-v">+${EXCLUSIVE_BUMP.toFixed(2)}</span>
          </label>
        </Reveal>
        <Reveal className="payout">
          <p className="pay-l">You keep (per month)</p>
          <p className="pay-n"><Num value={monthly} /></p>
          {exclusive && (
            <div className="pay-net">
              <p><span>Exclusive™</span><span>−${EXCLUSIVE_PRICE.toFixed(2)}</span></p>
              <p className="net"><span>Net</span><span className={net < 0 ? 'neg' : ''}><Num value={net} /></span></p>
              <p className="pay-joke">For the first time, you're losing money on your own terms.</p>
            </div>
          )}
          {!exclusive && <p className="pay-joke">That's {monthly > 4 ? 'basically a latte' : monthly > 2 ? 'almost a latte' : 'a latte foam'}. Every month. Forever.*</p>}
          <a href="#join" className="btn btn-white">Lock in this rate →</a>
        </Reveal>
      </div>
    </section>
  );
}

function Join({ perms, exclusive }) {
  const [device, setDevice] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', err: '' });
  const [lot, setLot] = useState(null);
  const typedAt = useRef(null);

  useEffect(() => {
    const d = collectDevice();
    setDevice(d);
    battery().then((b) => b && setDevice((x) => ({ ...x, battery: b })));
  }, []);

  const monthly = PERMS.reduce((s, p) => s + (perms[p.id] ? p.cut : 0), 0) + (exclusive ? EXCLUSIVE_BUMP : 0);

  const submit = async (e) => {
    e.preventDefault();
    if (state.status === 'sending') return;
    setState({ status: 'sending', err: '' });
    try {
      const secs = typedAt.current ? Math.round((Date.now() - typedAt.current) / 1000) : 0;
      await postSignup({ source: 'site', name, email, plan: exclusive ? 'exclusive' : 'free', perms, device: { ...device, secondsToSellOut: String(secs) } });
      setLot({ n: String(Math.floor(1000 + Math.random() * 8999)), name: name.trim().split(/\s+/)[0], monthly, secs });
      setState({ status: 'done', err: '' });
    } catch (err) {
      setState({ status: 'idle', err: err.message });
    }
  };

  const facts = device ? [
    ['Device', device.device], ['OS', device.os], ['Browser', device.browser], ['Screen', device.screen],
    ['Time zone', device.timezone], ['Language', device.language], ['Local time', device.localTime],
    ['Battery', device.battery], ['CPU cores', device.cores], ['Dark mode', device.darkMode], ['Vibe', device.vibe],
  ].filter(([, v]) => v) : [];

  return (
    <section className="join" id="join">
      <div className="join-grid">
        <Reveal className="join-form-wrap">
          {state.status !== 'done' ? (
            <form className="join-form" onSubmit={submit}>
              <p className="eyebrow light">Sign up · takes 10 seconds · lasts forever</p>
              <h2 className="h2">Put yourself<br />on the market.</h2>
              <label className="fld">
                <span>First name</span>
                <input required maxLength={60} value={name} autoComplete="given-name" placeholder="Your name (worth $0.02)"
                  onChange={(e) => { setName(e.target.value); if (!typedAt.current) typedAt.current = Date.now(); }} />
              </label>
              <label className="fld">
                <span>Email <em>optional, but it's worth $0.04</em></span>
                <input type="email" maxLength={120} value={email} autoComplete="email" placeholder="you@literally.anything" onChange={(e) => setEmail(e.target.value)} />
              </label>
              <p className="join-plan">Plan: <b>{exclusive ? 'Exclusive™' : 'Free'}</b> · Giving us: <b>{PERMS.filter((p) => perms[p.id]).map((p) => p.label.replace('Give us your ', '').replace('Turn it on across every ', 'every ')).join(', ')}</b> · <a href="#earn">change</a></p>
              {state.err && <p className="err" role="alert">{state.err}</p>}
              <button className="btn btn-red btn-big" disabled={state.status === 'sending'}>{state.status === 'sending' ? 'Listing you…' : 'Sell me'}</button>
              <p className="fine">By clicking "Sell me" you agree to absolutely nothing. sell.yoursellf is a parody built for a pitch competition. We don't sell, share or track anything. Your first name may show up on the big screen.</p>
            </form>
          ) : (
            <div className="lot" role="status">
              <p className="lot-top"><span>LOT #{lot.n}</span><span>sell.yoursellf marketplace</span></p>
              <h2 className="lot-name">{cap(lot.name)}</h2>
              <p className="lot-desc">1 human · gently used · {device?.device?.toLowerCase()} included</p>
              <dl className="lot-dl">
                <div><dt>Your cut</dt><dd>${lot.monthly.toFixed(2)}/mo</dd></div>
                <div><dt>Time to sell out</dt><dd>{lot.secs || 1}s</dd></div>
                <div><dt>Status</dt><dd className="red">For sale</dd></div>
              </dl>
              <span className="stamp" aria-hidden="true">SOLD</span>
              <p className="lot-foot">Congrats. You're officially a product. Look up at the screen, you might be on it.</p>
            </div>
          )}
        </Reveal>
        <Reveal className="dossier">
          <p className="dos-h"><span className="rec"><i />Already collected</span><small>while you were reading</small></p>
          <ul>
            {facts.map(([k, v], i) => (
              <li key={k} style={{ '--i': i }}>
                <span>{k}</span>
                <DecryptedText text={v} animateOn="view" sequential speed={35} revealDirection="start" className="dv" encryptedClassName="dv enc" />
              </li>
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
      <p className="foot-acc">you were already the product. now you're the shareholder.</p>
      <p className="foot-fine">*Not forever. Not real. sell.yoursellf is a parody startup made in 30 minutes for a pitch competition. We don't take health or financial information. We don't take anything, actually.</p>
    </footer>
  );
}

export default function Site() {
  const [perms, setPerms] = useState({ browser: true, phone: true, devices: false });
  const [exclusive, setExclusive] = useState(false);
  useMemo(() => { document.title = 'sell.yoursellf — sell yourself, literally'; }, []);
  return (
    <ClickSpark fixed sparkColor="#e4002b" sparkSize={11} sparkRadius={20} sparkCount={9} duration={480}>
      <div className="site">
        <Nav />
        <Hero />
        <Live />
        <How />
        <Split />
        <Earn perms={perms} setPerms={setPerms} exclusive={exclusive} setExclusive={setExclusive} />
        <Join perms={perms} exclusive={exclusive} />
        <Footer />
      </div>
    </ClickSpark>
  );
}
