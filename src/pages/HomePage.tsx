import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

/* --------------------------- CSS --------------------------- */
const css = `
:root{
  --gh-bg: #f3f7f4;
  --gh-surface: #fff;
  --gh-primary: #1db954;
  --gh-primary-600: #0ea158;
  --gh-accent: #0b6efd;
  --gh-text: #0b2a1a;
  --gh-muted: #577960;
  --radius-lg: 12px;
  --radius-md: 10px;
  --space-lg: 28px;
  /* reduced container width to give more room for content and reduce empty side space */
  --container-width: 1000px;
  --transition-fast: 180ms;
  --focus-ring: 3px solid rgba(29,185,84,0.16);
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
}

/* Page */
.gh-page { min-height:100vh; display:flex; flex-direction:column; background:var(--gh-bg); color:var(--gh-text); }
.gh-main { flex:1; padding:var(--space-lg); max-width:var(--container-width); margin:0 auto; width:100%; }

/* Hero */
/* reduced aside width from 320px -> 260px and tightened gap */
.gh-hero { display:grid; grid-template-columns: 1fr 260px; gap:16px; align-items:start; padding:18px; margin-bottom:24px; }
.gh-hero-title { font-size:2.25rem; margin:0 0 8px; color:#0a3b20; }
.gh-hero-subtitle { margin:0; color:#3b4f3a; line-height:1.6; }

/* Row/controls */
.gh-row { display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:16px; }
.gh-btn { display:inline-flex; align-items:center; gap:10px; padding:10px 16px; border-radius:10px; font-weight:700; text-decoration:none; border:none; cursor:pointer; transition:transform var(--transition-fast), box-shadow var(--transition-fast); position:relative; overflow:hidden; }
.gh-btn:active{ transform:translateY(1px); }
.gh-btn-primary { background:linear-gradient(90deg,var(--gh-primary),var(--gh-primary-600)); color:#fff; box-shadow: 0 6px 14px rgba(13,139,79,0.12); }
.gh-btn-primary:hover{ transform:translateY(-3px); box-shadow:0 18px 36px rgba(13,139,79,0.12); }
.gh-btn-primary:focus{ outline:none; box-shadow:var(--focus-ring); }
.gh-btn-ghost { background:transparent; color:var(--gh-primary); border:1px solid rgba(29,185,84,0.12); }
.gh-btn-ghost:hover{ background:rgba(29,185,84,0.04); transform:translateY(-2px); }

/* Ripple */
.ripple { position:absolute; border-radius:50%; transform:scale(0); background:rgba(255,255,255,0.35); pointer-events:none; }

/* Search */
.gh-search { display:flex; align-items:center; background:var(--gh-surface); border-radius:var(--radius-md); overflow:hidden; box-shadow:0 6px 18px rgba(14,40,18,0.03); flex:1; min-width:220px; transition:box-shadow var(--transition-fast), transform var(--transition-fast); }
.gh-search:focus-within { box-shadow:0 20px 60px rgba(11,107,58,0.06); transform:translateY(-2px); }
.gh-search input { border:none; padding:12px 14px; outline:none; flex:1; background:transparent; font-size:0.97rem; }
.gh-search input::placeholder { color:#8f9a89; }
.gh-search button { background:var(--gh-accent); color:#fff; border:none; padding:10px 14px; cursor:pointer; }

/* Suggestions */
.gh-suggestions { position:relative; }
.gh-suggestions-list { position:absolute; top:calc(100% + 8px); left:0; right:0; background:var(--gh-surface); border-radius:8px; box-shadow:0 10px 30px rgba(14,40,18,0.08); z-index:30; max-height:260px; overflow:auto; }
.gh-suggestion { padding:10px 12px; cursor:pointer; border-bottom:1px solid rgba(11,40,18,0.04); }
.gh-suggestion:last-child { border-bottom: none; }
.gh-suggestion:hover, .gh-suggestion:focus { background:rgba(11,40,18,0.02); outline:none; }

/* Trust list */
.gh-trust-list { margin-top:14px; list-style:disc; padding-left:20px; color:var(--gh-muted); line-height:1.6; }

/* Impact card */
.gh-impact-card { width:100%; background:linear-gradient(180deg,#ffffff,#f7fff7); padding:18px; border-radius:var(--radius-lg); box-shadow:0 10px 30px rgba(14,40,18,0.06); transition:transform var(--transition-fast), box-shadow var(--transition-fast); }
.gh-impact-card:hover{ transform:translateY(-6px); box-shadow:0 30px 60px rgba(14,40,18,0.10); }
.gh-impact-title{ font-weight:800; margin-bottom:12px; color:#0b3e23; }
.gh-impact-grid{ display:flex; gap:10px; justify-content:space-between; align-items:center; }
.gh-impact-item{ text-align:center; min-width:80px; }
.gh-impact-value{ font-size:1.125rem; font-weight:800; color:#0b3e23; }
.gh-impact-label{ font-size:0.85rem; color:var(--gh-muted); }
.gh-small-link{ color:var(--gh-accent); text-decoration:none; font-weight:700; }

/* Categories */
.gh-section-title{ font-size:1.125rem; margin:24px 0 8px; color:#0b3e23; }
.gh-cat-grid{ display:grid; grid-template-columns: repeat(4,1fr); gap:12px; }
.gh-cat { background:var(--gh-surface); padding:14px; border-radius:var(--radius-lg); display:flex; flex-direction:column; gap:8px; align-items:flex-start; box-shadow:0 6px 18px rgba(14,40,18,0.03); transition: transform var(--transition-fast), box-shadow var(--transition-fast), opacity var(--transition-fast); text-decoration:none; color:inherit; opacity:0; transform:translateY(10px); }
.gh-cat.in-view { opacity:1; transform:none; }
.gh-cat:hover, .gh-cat:focus{ transform: translateY(-8px); box-shadow:0 24px 48px rgba(14,40,18,0.06); outline:none; box-shadow:var(--focus-ring); }
.gh-cat-emoji{ font-size:24px; }
.gh-cat-label{ font-weight:700; }
.gh-cat-action{ margin-top:auto; color:var(--gh-accent); font-weight:700; }

/* Steps */
.gh-steps{ display:grid; grid-template-columns: repeat(4,1fr); gap:12px; margin-top:12px; }
.gh-step{ background:var(--gh-surface); padding:18px; border-radius:var(--radius-lg); text-align:center; box-shadow:0 6px 18px rgba(14,40,18,0.03); transition: transform var(--transition-fast), box-shadow var(--transition-fast), opacity var(--transition-fast); opacity:0; transform:translateY(12px); }
.gh-step.in-view{ opacity:1; transform:none; }
.gh-step:hover, .gh-step:focus{ transform: translateY(-6px); box-shadow:0 24px 48px rgba(14,40,18,0.06); outline:none; }
.gh-step-icon{ font-size:28px; margin-bottom:8px; }
.gh-step-title{ margin:8px 0 6px; font-weight:700; }
.gh-step-text{ margin:0; font-size:13px; color:var(--gh-muted); }

/* CTA */
.gh-get-started{ margin-top:22px; padding:18px; background:linear-gradient(180deg,#e9f9ee,#f3fbf6); border-radius:var(--radius-lg); display:flex; justify-content:space-between; align-items:center; gap:12px; box-shadow:0 6px 18px rgba(14,40,18,0.03); }
.gh-cta{ display:flex; gap:12px; align-items:center; }

/* Modal */
.gh-modal-overlay{ position:fixed; inset:0; background:rgba(7,11,7,0.45); display:flex; align-items:center; justify-content:center; z-index:60; }
.gh-modal{ background:var(--gh-surface); border-radius:12px; padding:18px; width:min(680px, 92%); box-shadow:0 30px 80px rgba(7,11,7,0.6); max-height:90vh; overflow:auto; }
.gh-modal h3{ margin:0 0 8px; }
.gh-modal .row{ display:flex; gap:10px; margin-top:12px; }
.gh-modal input, .gh-modal textarea, .gh-modal select{ width:100%; padding:10px; border-radius:8px; border:1px solid rgba(11,40,18,0.06); outline:none; font-size:0.95rem; }
.gh-modal textarea{ min-height:90px; resize:vertical; }

/* Responsive */
@media (max-width:980px){ .gh-hero { grid-template-columns:1fr; } .gh-cat-grid{ grid-template-columns:repeat(2,1fr); } .gh-steps{ grid-template-columns:repeat(2,1fr); } }
@media (max-width:640px){ .gh-main{ padding:16px; } .gh-cat-grid{ grid-template-columns:1fr; } .gh-steps{ grid-template-columns:1fr; } }

/* Focus */
:focus { outline:none; }
:focus-visible { box-shadow:var(--focus-ring); border-radius:8px; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce){ *{ transition:none!important; animation:none!important; } }
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
      const elapsed = t - startRef.current;
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
  requestAnimationFrame(() => {
    span.style.transform = "scale(2)";
    span.style.opacity = "0";
  });
  setTimeout(() => {
    span.remove();
  }, 600);
}

/* --------------------------- Data --------------------------- */

const CATEGORIES = [
  { key: "plastic", label: "Plastic Bottles", emoji: "🧴" },
  { key: "paper", label: "Paper & Cardboard", emoji: "📦" },
  { key: "metal", label: "Metal Cans", emoji: "🥫" },
  { key: "glass", label: "Glass Bottles", emoji: "🍾" },
];

const STEPS = [
  { icon: "📝", title: "Post an item", text: "Tell us what you're disposing of and upload a photo." },
  { icon: "🧑‍🔧", title: "Collector accepts", text: "A nearby verified collector accepts the job." },
  { icon: "🚚", title: "Track pickup", text: "Follow the collector on the map until collection is complete." },
  { icon: "🏅", title: "Earn rewards", text: "Get points and certificates for recycling responsibly." },
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
      "points & rewards",
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    if (modalOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const onSelectSuggestion = (s: string) => {
    setQuery(s);
    setShowSuggestions(false);
    window.location.assign(`/rewards?q=${encodeURIComponent(s)}`);
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
        <section className="gh-hero" aria-labelledby="hero-heading">
          <div>
            <h2 id="hero-heading" className="gh-hero-title">Give waste a new life</h2>
            <p className="gh-hero-subtitle">
              Post recyclable items, schedule a pickup, and earn rewards — all in a few taps. Help your neighborhood become cleaner and greener.
            </p>

            <div className="gh-row">
              <button
                className="gh-btn gh-btn-primary"
                onClick={(e) => {
                  createRipple(e);
                  openPostModal();
                }}
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
                    window.location.assign(`/rewards?q=${encodeURIComponent(query.trim())}`);
                  }}
                  role="search"
                  aria-label="Search recycling"
                >
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search recycling tips, locations, or items"
                    aria-label="Search recycling"
                    onFocus={() => debouncedQuery && setShowSuggestions(true)}
                  />
                  <button
                    type="submit"
                    onClick={(e) => {
                      createRipple(e);
                    }}
                  >
                    Search
                  </button>
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onSelectSuggestion(s);
                        }}
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
              <li>Earn points & certificates</li>
            </ul>
          </div>

          <aside aria-hidden>
            <div className="gh-impact-card" aria-hidden>
              <div className="gh-impact-title">Community Impact</div>

              <div className="gh-impact-grid" role="list" aria-label="Community statistics">
                <div className="gh-impact-item">
                  <div className="gh-impact-value">{users.toLocaleString()}</div>
                  <div className="gh-impact-label">Members</div>
                </div>
                <div className="gh-impact-item">
                  <div className="gh-impact-value">{pickups.toLocaleString()}</div>
                  <div className="gh-impact-label">Pickups</div>
                </div>
                <div className="gh-impact-item">
                  <div className="gh-impact-value">{kg.toLocaleString()}</div>
                  <div className="gh-impact-label">Kg Collected</div>
                </div>
              </div>

              <div style={{ marginTop: 12, textAlign: "center" }}>
                <Link to="/explore" className="gh-small-link">Explore as guest →</Link>
              </div>
            </div>
          </aside>
        </section>

        <section aria-labelledby="categories-heading">
          <h3 id="categories-heading" className="gh-section-title">Common recyclable items</h3>

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
                <div className="gh-cat-action">Post now →</div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="how-heading">
          <h3 id="how-heading" className="gh-section-title">How it works</h3>

          <div className="gh-steps">
            {STEPS.map((s) => (
              <article key={s.title} className="gh-step" tabIndex={0} aria-label={s.title}>
                <div className="gh-step-icon" aria-hidden>{s.icon}</div>
                <h4 className="gh-step-title">{s.title}</h4>
                <p className="gh-step-text">{s.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="gh-get-started" aria-label="Get started">
          <div>
            <h3 style={{ margin: 0 }}>Ready to make an impact?</h3>
            <p style={{ marginTop: 8 }}>Create an account and schedule your first pickup in minutes.</p>
          </div>
          <div className="gh-cta">
            <Link to="/register" className="gh-btn gh-btn-primary" onClick={(e) => createRipple(e as any)}>Register</Link>
            <button
              className="gh-btn gh-btn-ghost"
              onClick={(e) => {
                createRipple(e);
                openPostModal();
              }}
            >
              Post Waste
            </button>
          </div>
        </section>
      </main>

      <Footer />

      {modalOpen && (
        <div
          className="gh-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="post-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="gh-modal" id="post-modal">
            <h3 id="post-modal-title">Post recyclable item</h3>
            <p style={{ marginTop: 6, color: "var(--gh-muted)" }}>
              Fill out a few details to request a pickup. This is a demo modal — integrate with your API to persist.
            </p>

            <form onSubmit={handlePostSubmit} style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Item type</label>
              <select name="type" defaultValue={prefillCategory || ""} aria-label="Item type">
                <option value="">Select type</option>
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>

              <label style={{ display: "block", fontSize: 13, marginTop: 12, marginBottom: 6 }}>Notes (optional)</label>
              <textarea name="desc" placeholder="Add any notes for collectors (e.g., quantity, location, fragile)"></textarea>

              <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="gh-btn gh-btn-ghost"
                  onClick={() => {
                    // @ts-ignore event usage for ripple demo
                    createRipple(event as any);
                    closeModal();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gh-btn gh-btn-primary"
                  onClick={(e) => { createRipple(e); }}
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