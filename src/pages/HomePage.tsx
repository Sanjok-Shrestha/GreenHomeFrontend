import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

/* --------------------------- CSS --------------------------- */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,700&family=DM+Sans:wght@400;500;700&display=swap');

:root {
  /* Core palette — deep forest to bright lime */
  --gh-bg:          #ffffff; /* changed to white */
  --gh-surface:     #ffffff;
  --gh-surface-2:   #f7faf4;
  --gh-primary:     #2d8c4e;
  --gh-primary-lt:  #3dab62;
  --gh-accent:      #b5e34d;
  --gh-accent-dk:   #8cb820;
  --gh-ink:         #111c14;
  --gh-muted:       #5a6e52;
  --gh-border:      rgba(45,140,78,0.12);

  /* Typography */
  --font-display: 'Fraunces', Georgia, serif;
  --font-body:    'DM Sans', system-ui, sans-serif;

  /* Radii */
  --r-sm: 8px;
  --r-md: 14px;
  --r-lg: 22px;
  --r-xl: 32px;

  /* Shadows */
  --shadow-card:   0 2px 4px rgba(17,28,20,0.04), 0 8px 24px rgba(17,28,20,0.06);
  --shadow-lift:   0 12px 40px rgba(17,28,20,0.12), 0 2px 8px rgba(17,28,20,0.06);
  --shadow-glow:   0 0 0 3px rgba(181,227,77,0.35);

  /* Motion */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
  --t-fast: 160ms;
  --t-med:  280ms;

  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

/* ─── Reset helpers ─── */
*, *::before, *::after { box-sizing: border-box; }
:focus { outline: none; }
:focus-visible { box-shadow: var(--shadow-glow); border-radius: var(--r-sm); }

/* ─── Page shell ─── */
.gh-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--gh-bg);
  color: var(--gh-ink);
}

/* rest of CSS unchanged... */

/* ─── Main container ─── */
.gh-main {
  flex: 1;
  padding: 32px 28px;
  max-width: 1040px;
  margin: 0 auto;
  width: 100%;
}

/* ─── Hero ─── */
.gh-hero {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  align-items: start;
  margin-bottom: 56px;
  position: relative;
}

/* Decorative radial behind hero text */
.gh-hero::before {
  content: '';
  position: absolute;
  top: -24px;
  left: -40px;
  width: 340px;
  height: 340px;
  background: radial-gradient(ellipse at 30% 40%, rgba(181,227,77,0.18) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.gh-hero > * { position: relative; z-index: 1; }

.gh-hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gh-primary);
  background: rgba(45,140,78,0.09);
  padding: 5px 12px;
  border-radius: 100px;
  margin-bottom: 14px;
  border: 1px solid rgba(45,140,78,0.18);
}

.gh-hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 5vw, 3.4rem);
  font-weight: 900;
  line-height: 1.08;
  margin: 0 0 16px;
  color: var(--gh-ink);
  letter-spacing: -0.02em;
}

.gh-hero-title em {
  font-style: italic;
  color: var(--gh-primary);
  font-weight: 700;
}

.gh-hero-subtitle {
  margin: 0;
  font-size: 1.05rem;
  color: var(--gh-muted);
  line-height: 1.7;
  max-width: 480px;
}

/* ─── Row / controls ─── */
.gh-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 24px;
}

/* ─── Buttons ─── */
.gh-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: var(--r-md);
  font-family: var(--font-body);
  font-size: 0.92rem;
  font-weight: 700;
  text-decoration: none;
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition:
    transform var(--t-fast) var(--ease-spring),
    box-shadow var(--t-med) var(--ease-out),
    background var(--t-fast);
  white-space: nowrap;
}

.gh-btn:active { transform: scale(0.97); }

.gh-btn-primary {
  background: var(--gh-primary);
  color: #fff;
  box-shadow: 0 4px 12px rgba(45,140,78,0.30), inset 0 1px 0 rgba(255,255,255,0.15);
}

.gh-btn-primary:hover {
  background: var(--gh-primary-lt);
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(45,140,78,0.28), inset 0 1px 0 rgba(255,255,255,0.15);
}

.gh-btn-primary:focus-visible { box-shadow: var(--shadow-glow); }

.gh-btn-ghost {
  background: transparent;
  color: var(--gh-primary);
  border: 1.5px solid rgba(45,140,78,0.25);
}

.gh-btn-ghost:hover {
  background: rgba(45,140,78,0.06);
  border-color: var(--gh-primary);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(45,140,78,0.10);
}

/* Ripple */
.ripple {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  background: rgba(255,255,255,0.30);
  pointer-events: none;
  animation: ripple-anim 600ms linear forwards;
}

@keyframes ripple-anim {
  to { transform: scale(2.5); opacity: 0; }
}

/* ─── Search ─── */
.gh-search {
  display: flex;
  align-items: center;
  background: var(--gh-surface);
  border-radius: var(--r-md);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  border: 1.5px solid var(--gh-border);
  flex: 1;
  min-width: 220px;
  transition:
    box-shadow var(--t-med) var(--ease-out),
    border-color var(--t-fast),
    transform var(--t-med) var(--ease-out);
}

.gh-search:focus-within {
  box-shadow: var(--shadow-lift);
  border-color: rgba(45,140,78,0.35);
  transform: translateY(-2px);
}

.gh-search input {
  border: none;
  padding: 12px 16px;
  outline: none;
  flex: 1;
  background: transparent;
  font-family: var(--font-body);
  font-size: 0.93rem;
  color: var(--gh-ink);
}

.gh-search input::placeholder { color: #97a893; }

.gh-search button {
  background: var(--gh-ink);
  color: var(--gh-accent);
  border: none;
  padding: 10px 16px;
  cursor: pointer;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  transition: background var(--t-fast), color var(--t-fast);
}

.gh-search button:hover { background: var(--gh-primary); color: #fff; }

/* ─── Suggestions ─── */
.gh-suggestions { position: relative; }

.gh-suggestions-list {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--gh-surface);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-lift);
  border: 1px solid var(--gh-border);
  z-index: 30;
  max-height: 260px;
  overflow: auto;
  animation: dropdown-in var(--t-fast) var(--ease-out);
}

@keyframes dropdown-in {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.gh-suggestion {
  padding: 11px 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(17,28,20,0.05);
  font-size: 0.91rem;
  color: var(--gh-muted);
  transition: background var(--t-fast), color var(--t-fast), padding-left var(--t-fast);
}

.gh-suggestion:last-child { border-bottom: none; }

.gh-suggestion:hover,
.gh-suggestion:focus {
  background: rgba(45,140,78,0.05);
  color: var(--gh-primary);
  padding-left: 20px;
  outline: none;
}

/* ─── Trust pills ─── */
.gh-trust-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 20px 0 0;
}

.gh-trust-list li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--gh-muted);
  background: var(--gh-surface);
  padding: 5px 12px;
  border-radius: 100px;
  border: 1px solid var(--gh-border);
}

.gh-trust-list li::before {
  content: '✓';
  color: var(--gh-primary);
  font-weight: 900;
}

/* ─── Impact card ─── */
.gh-impact-card {
  background: var(--gh-ink);
  color: #fff;
  padding: 22px;
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-lift), 0 0 0 1px rgba(255,255,255,0.06) inset;
  transition: transform var(--t-med) var(--ease-spring), box-shadow var(--t-med);
  position: relative;
  overflow: hidden;
}

.gh-impact-card::before {
  content: '';
  position: absolute;
  bottom: -30px;
  right: -30px;
  width: 120px;
  height: 120px;
  background: var(--gh-accent);
  border-radius: 50%;
  opacity: 0.12;
  pointer-events: none;
}

.gh-impact-card:hover {
  transform: translateY(-6px) rotate(-0.5deg);
  box-shadow: 0 24px 60px rgba(17,28,20,0.22);
}

.gh-impact-title {
  font-weight: 700;
  margin-bottom: 18px;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  letter-spacing: 0.10em;
  font-size: 0.70rem;
}

.gh-impact-grid {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: flex-end;
}

.gh-impact-item { text-align: center; }

.gh-impact-value {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--gh-accent);
  line-height: 1;
  letter-spacing: -0.03em;
}

.gh-impact-label {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.50);
  margin-top: 4px;
  font-weight: 500;
}

.gh-impact-divider {
  width: 1px;
  height: 40px;
  background: rgba(255,255,255,0.10);
  align-self: center;
}

.gh-small-link {
  color: var(--gh-accent);
  text-decoration: none;
  font-size: 0.83rem;
  font-weight: 700;
  transition: opacity var(--t-fast);
}

.gh-small-link:hover { opacity: 0.75; }

/* ─── Section headers ─── */
.gh-section-header {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin: 0 0 16px;
}

.gh-section-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--gh-ink);
  margin: 0;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.gh-section-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--gh-border) 0%, transparent 100%);
}

/* ─── Category grid ─── */
.gh-cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 48px;
}

.gh-cat {
  background: var(--gh-surface);
  padding: 20px;
  border-radius: var(--r-lg);
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  box-shadow: var(--shadow-card);
  border: 1.5px solid transparent;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  opacity: 0;
  translate: 0 16px;
  transition:
    transform var(--t-med) var(--ease-spring),
    box-shadow var(--t-med) var(--ease-out),
    border-color var(--t-fast),
    opacity 400ms var(--ease-out),
    translate 400ms var(--ease-out);
}

.gh-cat.in-view { opacity: 1; translate: 0 0; }

.gh-cat:nth-child(1) { transition-delay: 0ms; }
.gh-cat:nth-child(2) { transition-delay: 60ms; }
.gh-cat:nth-child(3) { transition-delay: 120ms; }
.gh-cat:nth-child(4) { transition-delay: 180ms; }

.gh-cat:hover,
.gh-cat:focus {
  transform: translateY(-7px);
  box-shadow: var(--shadow-lift);
  border-color: rgba(45,140,78,0.22);
  outline: none;
}

/* Modified: center the emoji horizontally while keeping label/action alignment */
.gh-cat-emoji {
  display: block;
  font-size: 32px;
  line-height: 1;
  margin: 0 auto 12px; /* centers the emoji horizontally and gives bottom spacing */
}

.gh-cat-label {
  font-weight: 700;
  font-size: 0.93rem;
  color: var(--gh-ink);
}

/* gh-cat-action styles left in case you re-add actions later */
.gh-cat-action {
  margin-top: 8px;
  font-size: 0.80rem;
  font-weight: 700;
  color: var(--gh-primary);
  display: flex;
  align-items: center;
  gap: 4px;
  transition: gap var(--t-fast);
}

.gh-cat:hover .gh-cat-action,
.gh-cat:focus .gh-cat-action { gap: 8px; }

/* ─── Steps ─── */
.gh-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 48px;
  position: relative;
}

.gh-steps::before {
  content: '';
  position: absolute;
  top: 38px;
  left: calc(12.5% + 12px);
  right: calc(12.5% + 12px);
  height: 2px;
  background: linear-gradient(90deg, var(--gh-accent), rgba(181,227,77,0.10));
  z-index: 0;
  pointer-events: none;
}

.gh-step {
  background: var(--gh-surface);
  padding: 22px 16px;
  border-radius: var(--r-lg);
  text-align: center;
  box-shadow: var(--shadow-card);
  position: relative;
  z-index: 1;
  opacity: 0;
  translate: 0 14px;
  transition:
    transform var(--t-med) var(--ease-spring),
    box-shadow var(--t-med) var(--ease-out),
    opacity 400ms var(--ease-out),
    translate 400ms var(--ease-out);
}

.gh-step.in-view { opacity: 1; translate: 0 0; }

.gh-step:nth-child(1) { transition-delay: 0ms; }
.gh-step:nth-child(2) { transition-delay: 80ms; }
.gh-step:nth-child(3) { transition-delay: 160ms; }
.gh-step:nth-child(4) { transition-delay: 240ms; }

.gh-step:hover,
.gh-step:focus {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lift);
  outline: none;
}

.gh-step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--gh-accent);
  color: var(--gh-ink);
  font-size: 0.72rem;
  font-weight: 900;
  margin: 0 auto 10px;
}

.gh-step-icon {
  font-size: 28px;
  line-height: 1;
  margin-bottom: 10px;
  display: block;
}

.gh-step-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 6px;
  color: var(--gh-ink);
}

.gh-step-text {
  margin: 0;
  font-size: 0.82rem;
  color: var(--gh-muted);
  line-height: 1.55;
}

/* ─── CTA banner ─── */
.gh-get-started {
  padding: 28px 32px;
  background: linear-gradient(135deg, var(--gh-primary) 0%, #1a6e38 100%);
  border-radius: var(--r-xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 32px rgba(45,140,78,0.28);
}

.gh-get-started::after {
  content: '♻';
  position: absolute;
  right: 140px;
  top: 50%;
  transform: translateY(-50%) rotate(15deg);
  font-size: 120px;
  opacity: 0.06;
  pointer-events: none;
  color: #fff;
}

.gh-get-started h3 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin: 0;
  color: #fff;
}

.gh-get-started p {
  margin: 6px 0 0;
  color: rgba(255,255,255,0.70);
  font-size: 0.93rem;
}

.gh-cta { display: flex; gap: 12px; align-items: center; position: relative; z-index: 1; }

.gh-btn-cta-light {
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: 1.5px solid rgba(255,255,255,0.30);
  backdrop-filter: blur(8px);
}

.gh-btn-cta-light:hover {
  background: rgba(255,255,255,0.22);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}

.gh-btn-cta-accent {
  background: var(--gh-accent);
  color: var(--gh-ink);
  border: none;
  box-shadow: 0 4px 14px rgba(181,227,77,0.35);
}

.gh-btn-cta-accent:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(181,227,77,0.45);
  background: #c3ef5a;
}

/* ─── Modal ─── */
.gh-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10,18,11,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  backdrop-filter: blur(4px);
  animation: overlay-in 200ms var(--ease-out);
}

@keyframes overlay-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.gh-modal {
  background: var(--gh-surface);
  border-radius: var(--r-xl);
  padding: 28px;
  width: min(600px, 92%);
  box-shadow: 0 40px 100px rgba(10,18,11,0.40);
  max-height: 90vh;
  overflow: auto;
  animation: modal-in 280ms var(--ease-spring);
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.93) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.gh-modal h3 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 900;
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}

.gh-modal label {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gh-muted);
  margin-bottom: 6px;
  margin-top: 16px;
}

.gh-modal input,
.gh-modal textarea,
.gh-modal select {
  width: 100%;
  padding: 11px 14px;
  border-radius: var(--r-md);
  border: 1.5px solid var(--gh-border);
  outline: none;
  font-family: var(--font-body);
  font-size: 0.93rem;
  color: var(--gh-ink);
  background: var(--gh-surface-2);
  transition: border-color var(--t-fast), box-shadow var(--t-fast);
}

.gh-modal input:focus,
.gh-modal textarea:focus,
.gh-modal select:focus {
  border-color: var(--gh-primary);
  box-shadow: 0 0 0 3px rgba(45,140,78,0.14);
}

.gh-modal textarea { min-height: 100px; resize: vertical; }

.gh-modal-footer {
  display: flex;
  gap: 8px;
  margin-top: 20px;
  justify-content: flex-end;
}

/* ─── Responsive ─── */
@media (max-width: 900px) {
  .gh-hero { grid-template-columns: 1fr; }
  .gh-cat-grid { grid-template-columns: repeat(2, 1fr); }
  .gh-steps { grid-template-columns: repeat(2, 1fr); }
  .gh-steps::before { display: none; }
  .gh-get-started { flex-direction: column; text-align: center; }
  .gh-cta { justify-content: center; }
}

@media (max-width: 560px) {
  .gh-main { padding: 20px 16px; }
  .gh-cat-grid { grid-template-columns: 1fr; }
  .gh-steps { grid-template-columns: 1fr; }
  .gh-hero-title { font-size: 2rem; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
`;

/* --------------------------- Helpers --------------------------- */

function useCountUp(end: number, duration = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = performance.now();
    const step = (t: number) => {
      if (!startRef.current) startRef.current = t;
      const elapsed = t - startRef.current!;
      const progress = Math.min(1, elapsed / duration);
      setValue(Math.round(progress * end));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration]);

  return value;
}

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function useInView(selector: string, options?: IntersectionObserverInit) {
  useEffect(() => {
    const elList = Array.from(document.querySelectorAll(selector));
    if (!elList.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    }, options || { threshold: 0.15 });
    elList.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [selector, options]);
}

function createRipple(e: React.MouseEvent<HTMLElement>) {
  const target = e.currentTarget;
  const rect = target.getBoundingClientRect();
  const d = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - d / 2;
  const y = e.clientY - rect.top - d / 2;
  const span = document.createElement("span");
  span.className = "ripple";
  span.style.width = span.style.height = `${d}px`;
  span.style.left = `${x}px`;
  span.style.top = `${y}px`;
  target.appendChild(span);
  setTimeout(() => span.remove(), 700);
}

/* --------------------------- Data --------------------------- */

const CATEGORIES = [
  { key: "plastic", label: "Plastic Bottles", emoji: "🧴" },
  { key: "paper",   label: "Paper & Cardboard", emoji: "📦" },
  { key: "metal",   label: "Metal Cans", emoji: "🥫" },
  { key: "glass",   label: "Glass Bottles", emoji: "🍾" },
];

const STEPS = [
  { icon: "📝", num: 1, title: "Post an item", text: "Tell us what you're disposing of and upload a photo." },
  { icon: "🧑‍🔧", num: 2, title: "Collector accepts", text: "A nearby verified collector accepts the job." },
  { icon: "🚚", num: 3, title: "Track pickup", text: "Follow the collector on the map until collection is complete." },
  { icon: "🏅", num: 4, title: "Earn rewards", text: "Get points and certificates for recycling responsibly." },
];

const MockStats = { users: 1284, pickups: 3420, kgCollected: 78450 };

/* --------------------------- Page --------------------------- */

const HomePage: React.FC = () => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 200);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [prefillCategory, setPrefillCategory] = useState<string | null>(null);

  const users = useCountUp(MockStats.users, 900);
  const pickups = useCountUp(MockStats.pickups, 1000);
  const kg = useCountUp(MockStats.kgCollected, 1200);

  useInView(".gh-cat");
  useInView(".gh-step");

  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = debouncedQuery.toLowerCase();
    const pool = [
      ...CATEGORIES.map((c) => c.label),
      ...STEPS.map((s) => s.title),
      "recycling centers",
      "how to recycle plastic",
      "points & certificates",
      "schedule pickup",
    ];
    const filtered = pool.filter((p) => p.toLowerCase().includes(q)).slice(0, 6);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [debouncedQuery]);

  const openPostModal = (categoryKey?: string | null) => {
    setPrefillCategory(categoryKey || null);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setPrefillCategory(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    if (modalOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const onSelectSuggestion = (s: string) => {
    setQuery(s);
    setShowSuggestions(false);
    window.location.assign(`/explore?q=${encodeURIComponent(s)}`);
  };

  const handlePostSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const type = fd.get("type") as string;
    const desc = fd.get("desc") as string;
    console.log("Posting item:", { type, desc });
    closeModal();
    alert("Thanks! Your post was submitted (demo).");
  };

  const onCardKey = (e: React.KeyboardEvent, key: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPostModal(key);
    }
  };

  return (
    <div className="gh-page">
      <style>{css}</style>
      <NavBar />

      <main className="gh-main" role="main">

        {/* ── Hero ── */}
        <section className="gh-hero" aria-labelledby="hero-heading">
          <div>
            <div className="gh-hero-eyebrow">🌿 Community Recycling Network</div>
            <h2 id="hero-heading" className="gh-hero-title">
              Give waste<br />a <em>new life</em>
            </h2>
            <p className="gh-hero-subtitle">
              Post recyclable items, schedule a pickup, and earn rewards — all in a few taps.
              Help your neighborhood become cleaner and greener.
            </p>

            <div className="gh-row">
              <button
                className="gh-btn gh-btn-primary"
                onClick={(e) => { createRipple(e); openPostModal(); }}
                aria-haspopup="dialog"
                aria-controls="post-modal"
              >
                ♻️ Post Waste
              </button>

              <div className="gh-suggestions" style={{ flex: 1 }}>
                <form
                  className="gh-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!query.trim()) return;
                    window.location.assign(`/explore?q=${encodeURIComponent(query.trim())}`);
                  }}
                  role="search"
                  aria-label="Search recycling"
                >
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tips, locations, or items…"
                    aria-label="Search recycling"
                    onFocus={() => debouncedQuery && setShowSuggestions(true)}
                  />
                  <button type="submit" onClick={(e) => createRipple(e)}>Search</button>
                </form>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="gh-suggestions-list" role="listbox" aria-label="Search suggestions">
                    {suggestions.map((s) => (
                      <div
                        key={s}
                        tabIndex={0}
                        role="option"
                        className="gh-suggestion"
                        onClick={() => onSelectSuggestion(s)}
                        onKeyDown={(e) => { if (e.key === "Enter") onSelectSuggestion(s); }}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <ul className="gh-trust-list">
              <li>Free local pickup</li>
              <li>Verified collectors</li>
              <li>Earn points &amp; certificates</li>
            </ul>
          </div>

          {/* Impact card */}
          <aside aria-label="Community statistics">
            <div className="gh-impact-card">
              <div className="gh-impact-title">Community Impact</div>
              <div className="gh-impact-grid">
                <div className="gh-impact-item">
                  <div className="gh-impact-value">{users.toLocaleString()}</div>
                  <div className="gh-impact-label">Members</div>
                </div>
                <div className="gh-impact-divider" aria-hidden />
                <div className="gh-impact-item">
                  <div className="gh-impact-value">{pickups.toLocaleString()}</div>
                  <div className="gh-impact-label">Pickups</div>
                </div>
                <div className="gh-impact-divider" aria-hidden />
                <div className="gh-impact-item">
                  <div className="gh-impact-value">{(kg / 1000).toFixed(1)}k</div>
                  <div className="gh-impact-label">Kg Collected</div>
                </div>
              </div>
              <div style={{ marginTop: 18, textAlign: "center" }}>
                <Link to="/explore" className="gh-small-link">Explore as guest →</Link>
              </div>
            </div>
          </aside>
        </section>

        {/* ── Categories ── */}
        <section aria-labelledby="categories-heading">
          <div className="gh-section-header">
            <h3 id="categories-heading" className="gh-section-title">Common recyclables</h3>
            <div className="gh-section-line" aria-hidden />
          </div>
          <div className="gh-cat-grid" role="list">
            {CATEGORIES.map((c) => (
              <div
                key={c.key}
                className="gh-cat"
                role="button"
                tabIndex={0}
                onClick={() => openPostModal(c.key)}
                onKeyDown={(e) => onCardKey(e, c.key)}
                aria-label={`Post ${c.label}`}
              >
                <div className="gh-cat-emoji" aria-hidden>{c.emoji}</div>
                <div className="gh-cat-label">{c.label}</div>
                {/* "Post now" removed as requested */}
              </div>
            ))}
          </div>
        </section>

        {/* ── Steps ── */}
        <section aria-labelledby="how-heading">
          <div className="gh-section-header">
            <h3 id="how-heading" className="gh-section-title">How it works</h3>
            <div className="gh-section-line" aria-hidden />
          </div>
          <div className="gh-steps">
            {STEPS.map((s) => (
              <article key={s.title} className="gh-step" tabIndex={0} aria-label={s.title}>
                <div className="gh-step-num" aria-hidden>{s.num}</div>
                <div className="gh-step-icon" aria-hidden>{s.icon}</div>
                <h4 className="gh-step-title">{s.title}</h4>
                <p className="gh-step-text">{s.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="gh-get-started" aria-label="Get started">
          <div style={{ position: "relative", zIndex: 1 }}>
            <h3>Ready to make an impact?</h3>
            <p>Create an account and schedule your first pickup in minutes.</p>
          </div>
          <div className="gh-cta">
            <Link
              to="/register"
              className="gh-btn gh-btn-cta-accent"
              onClick={(e) => createRipple(e as any)}
            >
              Register free
            </Link>
            {/* Post Waste button removed from CTA as requested */}
          </div>
        </section>
      </main>

      <Footer />

      {/* ── Modal ── */}
      {modalOpen && (
        <div
          className="gh-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="post-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="gh-modal" id="post-modal">
            <h3 id="post-modal-title">Post a recyclable item</h3>
            <p style={{ marginTop: 6, color: "var(--gh-muted)", fontSize: "0.91rem" }}>
              Fill out a few details to request a pickup. Integrate with your API to persist.
            </p>

            <form onSubmit={handlePostSubmit}>
              <label>Item type</label>
              <select name="type" defaultValue={prefillCategory || ""} aria-label="Item type">
                <option value="">Select type…</option>
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>

              <label>Notes (optional)</label>
              <textarea name="desc" placeholder="Quantity, location, any special handling…" />

              <div className="gh-modal-footer">
                <button type="button" className="gh-btn gh-btn-ghost" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gh-btn gh-btn-primary"
                  onClick={(e) => createRipple(e)}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;