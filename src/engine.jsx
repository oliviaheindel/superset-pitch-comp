import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

/*
 * The deck engine.
 *
 * One slide on screen at a time. Every slide is a list of beats: each click (→, space, a clicker,
 * or the button on the slide) shows the next beat, and ← walks back through them one at a time.
 * Slides say how many beats they have (`beats` in slides/index.js) and draw themselves from the
 * `beat` prop, so going back always lands on the right picture.
 *
 * Moving to another slide plays that slide's entrance (`enter`), one of the transitions below.
 * Most come from Olivia's reference recordings: the ERA arch window, the instories push,
 * the Rolodex flip, the planet zoom, the HABCH swap, the ERA dome, the instories arc sweep.
 *
 * Links: #slide-id opens a slide, #slide-id/3 opens it at beat 3 (for rehearsing and thumbnails).
 * G or Esc opens the overview of every slide.
 */
export const DeckCtx = createContext(null);
export const useDeck = () => useContext(DeckCtx);
export const reduceMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const beatsOf = (s) => s?.beats || 0;


/* The "next" button on a slide: the same as pressing →. */
export function Unlock({ as: Tag = 'button', delay = 1400, gate = true, className = '', children, onClick, innerRef, via, ...rest }) {
  const deck = useDeck();
  const ref = useRef(null);
  const setRef = (el) => { ref.current = el; if (innerRef) innerRef.current = el; };
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!gate) { setArmed(false); return undefined; }
    const t = setTimeout(() => setArmed(true), reduceMotion ? 0 : delay);
    return () => clearTimeout(t);
  }, [gate, delay]);
  const handle = (e) => {
    onClick?.(e);
    if (e.defaultPrevented || !gate) return;
    e.stopPropagation();
    deck.advance(ref.current, via ? { via } : undefined);
  };
  return (
    <Tag ref={setRef} type={Tag === 'button' ? 'button' : undefined} className={`unlock ${armed ? 'armed' : ''} ${className}`}
      data-unlock="" onClick={handle} {...rest}>
      {children}
    </Tag>
  );
}

const pointOf = (el) => {
  if (!el?.getBoundingClientRect) return null;
  const b = el.getBoundingClientRect();
  if (!b.width && !b.height) return null;
  // Only an arch-shaped picture (a card on the builder's home screen) gives the arch and grow transitions their starting shape.
  const a = el.closest?.('[data-arch]') || el.querySelector?.('[data-arch]');
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, rect: a ? a.getBoundingClientRect() : null };
};

/* ---------------- transitions ---------------- */
const IN_OUT = 'cubic-bezier(.65,0,.35,1)';
const done = (a) => (a ? a.finished.catch(() => {}) : Promise.resolve());
const all = (...a) => Promise.all(a.map(done));

const TRANSITIONS = {
  cut: () => Promise.resolve(),

  fade: (n) => done(n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: 'ease' })),

  quick: (n) => done(n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' })),

  /* Grows out of the spot you clicked (kept for my site → the plan). */
  circle: (n, o, { x, y }) => {
    const b = n.getBoundingClientRect();
    const cx = x - b.left, cy = y - b.top;
    const r = Math.hypot(Math.max(cx, b.width - cx), Math.max(cy, b.height - cy));
    return done(n.animate([{ clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${r}px at ${cx}px ${cy}px)` }], { duration: 950, easing: IN_OUT }));
  },

  /* ERA Residence: an arched doorway opens at the bottom of the old slide (or out of the arch you clicked)
     and keeps its arch shape as it grows, until its curved top clears the corners of the screen. */
  arch: (n, o, { rect }) => {
    const b = n.getBoundingClientRect();
    const W = b.width, H = b.height;
    const w0 = rect ? rect.width : Math.min(W * 0.22, H * 0.34);
    const l0 = rect ? rect.left - b.left : (W - w0) / 2;
    const t0 = rect ? rect.top - b.top : H * 0.44;
    const b0 = rect ? Math.max(0, b.bottom - rect.bottom) : 0;
    // The final doorway is twice the screen wide; its top sits high enough that the curve covers both corners.
    const from = `inset(${t0}px ${W - l0 - w0}px ${b0}px ${l0}px round ${w0 / 2}px ${w0 / 2}px 0px 0px)`;
    const to = `inset(${-0.2 * W}px ${-W / 2}px 0px ${-W / 2}px round ${W}px ${W}px 0px 0px)`;
    const inner = n.querySelector(':scope > .slide-in');
    const ease = 'cubic-bezier(.7,0,.25,1)';
    // The old slide steps back and fades, so the doorway opens in a clean wall instead of cutting through its words.
    if (o) o.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.97)', opacity: 0, offset: 0.26 }, { transform: 'scale(.94)', opacity: 0 }], { duration: 1500, easing: ease, fill: 'forwards' });
    return all(
      n.animate([{ clipPath: from, offset: 0 }, { clipPath: from, offset: 0.12 }, { clipPath: to }], { duration: 1500, easing: ease }),
      inner?.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(1.18)', offset: 0.12 }, { transform: 'scale(1)' }], { duration: 1500, easing: ease }),
    );
  },

  /* The picture you clicked (or a small arch at the bottom of the screen) flies to where that picture sits on the
     next slide ([data-hero]), growing and losing its arch as it goes, while the rest of the slide fades in around it.
     A slide without a hero picture opens through the arch instead. */
  grow: (n, o, at) => {
    const hero = n.querySelector('[data-hero]');
    const img = hero?.querySelector('img');
    if (!img) return TRANSITIONS.arch(n, o, at);
    const b = n.getBoundingClientRect(), h = hero.getBoundingClientRect();
    const w0 = Math.min(b.width * 0.16, b.height * 0.26), h0 = w0 * 1.45;
    const f = at.rect || { left: b.left + (b.width - w0) / 2, top: b.bottom - h0, width: w0, height: h0 };
    const fly = document.createElement('div');
    fly.className = 'grow-fly';
    const pic = document.createElement('img');
    pic.src = img.currentSrc || img.src; pic.alt = '';
    pic.style.objectPosition = getComputedStyle(img).objectPosition;
    fly.appendChild(pic);
    document.body.appendChild(fly);
    hero.style.visibility = 'hidden';
    const ease = 'cubic-bezier(.65,0,.25,1)', duration = 1150;
    return all(
      fly.animate([
        { left: `${f.left}px`, top: `${f.top}px`, width: `${f.width}px`, height: `${f.height}px`, borderRadius: `${f.width / 2}px ${f.width / 2}px 0 0` },
        { left: `${h.left}px`, top: `${h.top}px`, width: `${h.width}px`, height: `${h.height}px`, borderRadius: '0px' },
      ], { duration, easing: ease, fill: 'forwards' }),
      n.animate([{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 1 }], { duration, easing: 'ease' }),
      o?.animate([{ opacity: 1 }, { opacity: 0, offset: 0.4 }, { opacity: 0 }], { duration, fill: 'forwards' }),
    ).then(() => { hero.style.visibility = ''; fly.remove(); });
  },

  /* instories: the new slide pushes in from the right with a motion blur. */
  push: (n, o) => all(
    n.animate([{ transform: 'translateX(100%)', filter: 'blur(16px)' }, { transform: 'translateX(0)', filter: 'blur(0px)' }], { duration: 850, easing: 'cubic-bezier(.75,0,.2,1)' }),
    o?.animate([{ transform: 'translateX(0)', filter: 'blur(0px)' }, { transform: 'translateX(-38%)', filter: 'blur(10px)' }], { duration: 850, easing: 'cubic-bezier(.75,0,.2,1)', fill: 'forwards' }),
  ),

  /* The Rolodex: the old slide falls flat on its face and the next one moves forward. */
  flip: (n, o) => {
    if (o) { o.style.zIndex = 5; o.style.transformOrigin = '50% 100%'; }
    return all(
      o?.animate([
        { transform: 'perspective(2200px) rotateX(0deg)' },
        { transform: 'perspective(2200px) rotateX(-88deg)' },
      ], { duration: 900, easing: 'cubic-bezier(.55,0,.8,.3)', fill: 'forwards' }),
      n.animate([{ transform: 'scale(.9) translateY(2%)' }, { transform: 'none' }], { duration: 1000, easing: 'cubic-bezier(.3,.6,.2,1)' }),
    );
  },

  /* The planets: the camera flies into the thing you clicked and comes out on the next slide. */
  zoom: (n, o, { x, y }) => {
    if (o) {
      const b = o.getBoundingClientRect();
      o.style.transformOrigin = `${x - b.left}px ${y - b.top}px`;
    }
    return all(
      o?.animate([
        { transform: 'scale(1)', filter: 'blur(0px)', opacity: 1 },
        { transform: 'scale(4)', filter: 'blur(4px)', opacity: 1, offset: 0.55 },
        { transform: 'scale(9)', filter: 'blur(14px)', opacity: 0 },
      ], { duration: 1150, easing: 'cubic-bezier(.55,0,.45,1)', fill: 'forwards' }),
      n.animate([
        { opacity: 0, transform: 'scale(1.35)', filter: 'blur(18px)' },
        { opacity: 0, transform: 'scale(1.35)', filter: 'blur(18px)', offset: 0.42 },
        { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
      ], { duration: 1150, easing: 'cubic-bezier(.3,.6,.25,1)' }),
    );
  },

  /* HABCH: the old slide slides out left, the new one slides in from the right, colors cross. */
  swap: (n, o) => all(
    o?.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(-42%)', opacity: 0 }], { duration: 800, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' }),
    n.animate([{ transform: 'translateX(42%)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 800, easing: 'cubic-bezier(.6,0,.3,1)' }),
  ),

  /* ERA's dome (and the planet horizon): the next slide rises like a sunrise. */
  dome: (n) => {
    const b = n.getBoundingClientRect();
    const R = Math.max(b.width, b.height) * 1.7;
    return done(n.animate([
      { clipPath: `circle(${R}px at 50% ${b.height + R}px)` },
      { clipPath: `circle(${R}px at 50% ${b.height / 2}px)` },
    ], { duration: 1300, easing: 'cubic-bezier(.5,0,.2,1)' }));
  },

  /* instories' ending: an arc sweeps across from the bottom-left corner, painting in the next slide. */
  sweep: (n) => {
    const stage = n.parentElement;
    const band = document.createElement('div');
    band.className = 'sweep-band';
    stage.appendChild(band);
    n.classList.add('sweeping');
    const opts = { duration: 1200, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' };
    return all(
      n.animate([{ '--sweep': '0deg' }, { '--sweep': '92deg' }], opts),
      band.animate([{ '--sweep': '0deg', opacity: 1 }, { '--sweep': '92deg', opacity: 1, offset: 0.9 }, { '--sweep': '96deg', opacity: 0 }], opts),
    ).then(() => { band.remove(); n.classList.remove('sweeping'); });
  },
};
export const TRANSITION_NAMES = Object.keys(TRANSITIONS);

/* ---------------- the deck ---------------- */
export function Deck({ slides, chrome }) {
  const find = useCallback((id) => slides.findIndex(s => s.id === id), [slides]);
  const fromHash = () => {
    const [id, b] = decodeURIComponent(location.hash.slice(1)).split('/');
    const i = find(id);
    if (i < 0) return { idx: 0, beat: 0 };
    const max = beatsOf(slides[i]);
    return { idx: i, beat: b === 'end' ? max : Math.min(max, Math.max(0, parseInt(b, 10) || 0)) };
  };
  const [st, setSt] = useState(() => ({ ...fromHash(), prev: null, prevBeat: 0, dir: 0, via: 'cut', at: null }));
  const { idx, beat, prev } = st;
  const stRef = useRef(st);
  stRef.current = st;
  const hist = useRef([]);
  const refs = useRef({});
  const busy = useRef(false);
  const marks = useRef(new Set());
  const [, bump] = useState(0);
  const [secrets, setSecrets] = useState(() => new Set());

  /* Go to another slide. */
  const go = useCallback((target, { beat: b = 0, via, from, back = false } = {}) => {
    const cur = stRef.current;
    const to = typeof target === 'number' ? target : find(target);
    if (to < 0 || busy.current) return;
    if (to === cur.idx) { if (b !== cur.beat) setSt(s => ({ ...s, beat: b, dir: b > s.beat ? 1 : -1 })); return; }
    if (!back) hist.current.push({ idx: cur.idx, beat: cur.beat });
    const pt = pointOf(from) || (from && 'x' in from ? from : null) || { x: innerWidth / 2, y: innerHeight / 2 };
    let name = via || (back ? 'quick' : slides[to].enter || 'cut');
    if (reduceMotion) name = 'cut';
    const beatTo = b === 'end' ? beatsOf(slides[to]) : b;
    // Shared-element morphs (the VERA jar / Nike shoe): the browser's View Transitions.
    if (name === 'shared') {
      if (document.startViewTransition) {
        busy.current = true;
        const vt = document.startViewTransition(() => flushSync(() => setSt({ idx: to, beat: beatTo, prev: null, prevBeat: 0, dir: back ? -1 : 1, via: 'cut', at: pt })));
        vt.finished.finally(() => { busy.current = false; });
        return;
      }
      name = 'fade';
    }
    busy.current = name !== 'cut';
    setSt({ idx: to, beat: beatTo, prev: name === 'cut' ? null : cur.idx, prevBeat: cur.beat, dir: back ? -1 : 1, via: name, at: pt });
  }, [find, slides]);

  const nextOf = useCallback((i) => {
    const s = slides[i];
    if (typeof s.next === 'function') return find(s.next({ marks: marks.current }));
    if (s.next) return find(s.next);
    return Math.min(i + 1, slides.length - 1);
  }, [find, slides]);

  /* → : the next beat, or the next slide. */
  const advance = useCallback((el, opts = {}) => {
    const cur = stRef.current;
    if (busy.current) return;
    const s = slides[cur.idx];
    if (cur.beat < beatsOf(s)) { setSt(v => ({ ...v, beat: v.beat + 1, dir: 1 })); return; }
    const to = nextOf(cur.idx);
    if (to === cur.idx) return;
    const u = el || refs.current[s.id]?.querySelector('[data-unlock].armed, [data-unlock]');
    go(to, { via: opts.via || s.exit, from: u });
  }, [go, nextOf, slides]);

  /* ← : the previous beat, or back where you came from. */
  const retreat = useCallback(() => {
    const cur = stRef.current;
    if (busy.current) return;
    if (cur.beat > 0) { setSt(v => ({ ...v, beat: v.beat - 1, dir: -1 })); return; }
    const h = hist.current.pop();
    if (h) go(h.idx, { beat: h.beat, back: true });
    else if (cur.idx > 0) go(cur.idx - 1, { beat: 'end', back: true });
  }, [go]);

  const setBeat = useCallback((b) => setSt(v => ({ ...v, beat: Math.max(0, Math.min(beatsOf(slides[v.idx]), typeof b === 'function' ? b(v.beat) : b)), dir: 1 })), [slides]);
  const mark = useCallback((k) => { if (!marks.current.has(k)) { marks.current.add(k); bump(n => n + 1); } }, []);

  // Play the entrance.
  useLayoutEffect(() => {
    if (prev === null) return;
    const n = refs.current[slides[idx].id], o = refs.current[slides[prev].id];
    const finish = () => {
      busy.current = false;
      setSt(s => (s.prev === null ? s : { ...s, prev: null }));
    };
    if (!n) { finish(); return; }
    (TRANSITIONS[st.via] || TRANSITIONS.fade)(n, o, st.at || {}).then(finish, finish);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Remember every slide that has been on screen (a slide can pass `next` a function of these marks).
  useEffect(() => { mark(slides[idx].id); }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const s = slides[idx];
    try { window.history.replaceState(null, '', '#' + s.id + (beat ? '/' + beat : '')); } catch { /* sandboxed */ }
    document.body.dataset.theme = s.theme || 'light';
  }, [idx, beat, slides]);

  // Keys: → / PageDown / space next, ← / PageUp / Backspace back, G or Esc the overview, Home the start.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !e.target.closest?.('button, a'))) { e.preventDefault(); advance(); }
      else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); retreat(); }
      else if (k === 'g' || k === 'G' || k === 'Escape') {
        const ov = find('overview');
        if (ov < 0) return;
        e.preventDefault();
        if (stRef.current.idx === ov) retreat(); else go(ov, { via: 'fade' });
      } else if (k === 'Home') { e.preventDefault(); go(0, { via: 'quick' }); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [advance, retreat, go, find]);

  // Swipes on touch screens (not when the swipe starts on something draggable).
  useEffect(() => {
    let s = null;
    const down = (e) => {
      if (e.pointerType === 'mouse' || e.target.closest?.('[data-drag], canvas, input, textarea')) { s = null; return; }
      s = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const up = (e) => {
      if (!s) return;
      const dx = e.clientX - s.x, dy = e.clientY - s.y, fast = performance.now() - s.t < 700;
      s = null;
      if (!fast || Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
      if (dx < 0) advance(null, {}); else retreat();
    };
    const cancel = () => { s = null; };
    addEventListener('pointerdown', down); addEventListener('pointerup', up); addEventListener('pointercancel', cancel);
    return () => { removeEventListener('pointerdown', down); removeEventListener('pointerup', up); removeEventListener('pointercancel', cancel); };
  }, [advance, retreat]);

  // A click anywhere on a slide is the next click, like a clicker, unless it lands on something you can use
  // (a button, a link, a draggable, the preview window) or you were selecting text.
  const onStageClick = useCallback((e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.target.closest?.('a, button, input, textarea, select, label, summary, [role="button"], [data-unlock], [data-drag], [data-noclick], .pp-veil')) return;
    if (String(window.getSelection?.() || '')) return;
    advance();
  }, [advance]);

  // Ripples on every click.
  useEffect(() => {
    if (reduceMotion) return undefined;
    const down = (e) => {
      if (e.target.closest?.('[data-noripple]')) return;
      const r = document.createElement('div');
      r.className = 'ripple';
      r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
      r.innerHTML = '<i></i><i></i><i></i>';
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 1400);
    };
    addEventListener('pointerdown', down);
    return () => removeEventListener('pointerdown', down);
  }, []);

  const found = useCallback((k) => setSecrets(s => (s.has(k) ? s : new Set([...s, k]))), []);
  const ctx = useMemo(() => ({
    idx, beat, slide: slides[idx], slides, advance, retreat, go, setBeat, mark, marks: marks.current, found, secrets, busy,
    next: advance, back: retreat,
  }), [idx, beat, slides, advance, retreat, go, setBeat, mark, found, secrets]);

  return (
    <DeckCtx.Provider value={ctx}>
      <div className="stage" onClick={onStageClick}>
        {slides.map((s, i) => {
          if (i !== idx && i !== prev) return null;
          const C = s.Component;
          const here = i === idx;
          return (
            <section key={s.id} id={s.id} ref={el => { refs.current[s.id] = el; }}
              className={`slide theme-${s.theme || 'light'} ${s.className || ''} ${here ? 'current' : 'leaving'}`}
              aria-label={s.label} aria-hidden={!here}>
              <div className="slide-in">
                {/* The slide coming in starts once it has fully arrived; the one going out stays as it was until it's gone. */}
                <C active={(here && prev === null) || i === prev} entering={here} beat={here ? beat : st.prevBeat} dir={st.dir} />
              </div>
            </section>
          );
        })}
      </div>
      {chrome?.(ctx)}
    </DeckCtx.Provider>
  );
}
