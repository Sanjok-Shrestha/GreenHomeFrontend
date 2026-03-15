import React, { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { Link } from "react-router-dom";
import api from "../api";

/**
 * Explore — Latest Posts (interactive bottom sections)
 *
 * This file is your Explore page with improved interactive bottom sections:
 * - TipCarousel: animated, auto-advancing tip cards with manual controls
 * - FAQAccordion: accessible accordion with animated open/close
 *
 * Drop this file in place of your existing src/pages/Explore.tsx
 */

/* ---------------------- Styles (single-file) ---------------------- */
const css = `
:root{
  --bg: #f6fbf6;
  --surface: #fff;
  --muted: #6b8069;
  --text: #0b2a1a;
  --primary: #1db954;
  --accent: #0b6efd;
  --card-shadow: 0 10px 40px rgba(14,40,18,0.06);
  --soft-shadow: 0 6px 18px rgba(14,40,18,0.03);
  --radius: 12px;
  --glass: rgba(255,255,255,0.7);
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
  -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
}

/* page */
.ex-page { min-height:100vh; background:var(--bg); color:var(--text); }
.ex-header { display:flex; justify-content:space-between; align-items:center; padding:18px 24px; background:var(--surface); box-shadow:0 2px 8px rgba(16,40,20,0.04); position:sticky; top:0; z-index:20; }
.ex-brand { display:flex; gap:12px; align-items:center; }
.ex-brand .logo { font-size:22px; }
.ex-title { margin:0; font-size:18px; }
.ex-sub { margin:0; color:var(--muted); font-size:13px; }

/* container */
.ex-main { max-width:1100px; margin:20px auto; padding:0 18px 48px; }

/* controls */
.controls { display:flex; justify-content:space-between; gap:12px; align-items:center; margin-bottom:18px; flex-wrap:wrap; }
.controls-left { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.label { font-size:13px; color:var(--muted); margin-bottom:6px; display:block; }
.input, select { background:var(--surface); border:1px solid rgba(11,40,18,0.06); padding:8px 10px; border-radius:10px; }
.search { display:flex; align-items:center; gap:8px; min-width:260px; box-shadow:var(--soft-shadow); }
.search input { border:none; outline:none; padding:6px 8px; min-width:160px; background:transparent; }
.switch { display:inline-flex; align-items:center; gap:8px; font-size:13px; color:var(--muted); }

/* quick toolbar */
.toolbar { display:flex; gap:8px; align-items:center; }

/* grid */
.grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:16px; }

/* card */
.card { display:flex; gap:12px; align-items:stretch; background:var(--surface); border-radius:10px; box-shadow:var(--soft-shadow); overflow:hidden; padding:0; transition: transform 160ms ease, box-shadow 160ms ease; border:1px solid rgba(11,40,18,0.02); }
.card:hover { transform: translateY(-6px); box-shadow:var(--card-shadow); }
.card-media { width:120px; min-height:120px; display:flex; align-items:center; justify-content:center; background:linear-gradient(90deg, rgba(237,250,237,1), rgba(247,253,247,1)); }
.card-media img { width:100%; height:100%; object-fit:cover; display:block; }
.card-body { padding:12px; display:flex; flex-direction:column; flex:1; min-width:0; }
.card-row { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px; }
.tag { font-size:12px; background:#e9f9ee; color:#0b6b2f; padding:6px 8px; border-radius:999px; font-weight:700; display:inline-block; text-transform:capitalize; }
.qty { color:var(--muted); font-size:13px; }
.title { margin:0 0 8px; font-size:15px; line-height:1.25; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.meta { font-size:12px; color:var(--muted); display:flex; gap:8px; align-items:center; margin-bottom:8px; }
.card-footer { margin-top:auto; display:flex; justify-content:space-between; align-items:center; gap:12px; }
.small-link { color:var(--accent); text-decoration:none; font-weight:700; }
.price { font-weight:800; color:var(--text); }

/* badges & extras */
.badges { display:flex; gap:6px; align-items:center; }
.badge { font-size:11px; padding:6px 8px; border-radius:8px; background:rgba(11,40,18,0.04); color:var(--muted); }

/* saved state */
.save-btn { cursor:pointer; background:transparent; border:none; font-size:18px; color:var(--muted); }
.save-btn.saved { color:var(--primary); }

/* suggestions */
.suggestions { position:relative; }
.suggestions-list { position:absolute; top:calc(100% + 8px); left:0; right:0; background:var(--surface); border-radius:8px; box-shadow:0 10px 30px rgba(14,40,18,0.08); z-index:30; max-height:260px; overflow:auto; }
.suggestion { padding:10px 12px; cursor:pointer; border-bottom:1px solid rgba(11,40,18,0.04); }
.suggestion:last-child { border-bottom:none; }
.suggestion:hover { background:rgba(11,40,18,0.02); }

/* modal */
.modal-overlay{ position:fixed; inset:0; background:rgba(7,11,7,0.45); display:flex; align-items:center; justify-content:center; z-index:60; padding:24px; }
.modal { background:var(--surface); border-radius:12px; padding:16px; width:min(900px, 96%); max-height:90vh; overflow:auto; box-shadow:0 30px 80px rgba(7,11,7,0.6); display:grid; grid-template-columns: 320px 1fr; gap:12px; }
.modal img{ width:100%; height:100%; object-fit:cover; border-radius:8px; }
.modal .map { height:240px; background:linear-gradient(90deg,#eef8ee,#f7fbf7); border-radius:8px; display:flex; align-items:center; justify-content:center; color:var(--muted); }

/* skeleton */
.skeleton { background: linear-gradient(90deg, #f3f8f3 0%, #eaf6ea 50%, #f3f8f3 100%); background-size: 200% 100%; animation: shimmer 1.2s linear infinite; }
@keyframes shimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }

/* panels */
.panel { background:var(--surface); border-radius:10px; padding:16px; box-shadow:var(--soft-shadow); margin-top:14px; }

/* ---------- Interactive tips carousel styles ---------- */
.tips-wrap { display:flex; gap:12px; align-items:center; margin-top:18px; }
.carousel { flex:1; position:relative; overflow:hidden; border-radius:12px; background:linear-gradient(180deg,#fff,#f7fff7); padding:14px; box-shadow:var(--soft-shadow); }
.tip-track { display:flex; transition:transform 420ms cubic-bezier(.2,.9,.25,1); gap:12px; will-change:transform; }
.tip-card { min-width:260px; max-width:420px; flex:0 0 320px; background:var(--surface); border-radius:10px; padding:14px; box-shadow:0 8px 24px rgba(12,34,12,0.06); display:flex; gap:12px; align-items:flex-start; }
.tip-emoji { font-size:28px; width:48px; height:48px; display:flex; align-items:center; justify-content:center; border-radius:10px; background:#f0fff6; color:var(--primary); font-weight:800; }
.tip-body { flex:1; }
.tip-title { font-weight:800; margin-bottom:6px; }
.tip-desc { color:var(--muted); font-size:13px; margin-bottom:8px; }
.carousel-controls { display:flex; gap:8px; position:absolute; right:12px; top:12px; z-index:10; }
.ctrl { background:var(--surface); border-radius:8px; padding:6px 8px; cursor:pointer; box-shadow:0 6px 18px rgba(11,40,18,0.04); border:1px solid rgba(11,40,18,0.04); }

/* progress dots */
.dots { display:flex; gap:6px; justify-content:center; margin-top:10px; }
.dot { width:8px; height:8px; border-radius:50%; background:rgba(11,40,18,0.06); transition:transform 180ms ease, background 180ms ease; }
.dot.active { background:var(--primary); transform:scale(1.25); }

/* ---------- FAQ accordion ---------- */
.accordion { margin-top:18px; display:grid; gap:8px; }
.ac-item { background:var(--surface); padding:12px; border-radius:10px; box-shadow:var(--soft-shadow); display:block; overflow:hidden; border:1px solid rgba(11,40,18,0.03); }
.ac-question { display:flex; justify-content:space-between; align-items:center; gap:12px; cursor:pointer; }
.ac-q-text { font-weight:800; }
.ac-toggle { transform-origin:center; transition: transform 200ms ease; color:var(--muted); }
.ac-answer { color:var(--muted); margin-top:8px; line-height:1.45; max-height:0; overflow:hidden; transition: max-height 340ms cubic-bezier(.2,.9,.25,1), opacity 240ms ease; opacity:0; }
.ac-answer.open { opacity:1; }

/* responsive tweaks */
@media (max-width:920px) { .modal { grid-template-columns: 1fr; } .card-media{ width:100px } .tip-card{ min-width:240px } }
@media (max-width:720px){ .controls { flex-direction:column; align-items:flex-start; } .grid { gap:12px; } }
`;

/* -------------------------- Types & Helpers -------------------------- */

type WastePreview = {
  _id: string;
  wasteType?: string;
  quantity?: number;
  price?: number;
  location?: string;
  description?: string;
  image?: { url?: string } | string | null;
  createdAt?: string;
  user?: { name?: string; verified?: boolean };
  tags?: string[];
  comments?: number;
  distanceKm?: number; // approximate distance for sorting demo
};

const MOCK_POSTS: WastePreview[] = [
  {
    _id: "m1",
    wasteType: "plastic",
    quantity: 3.2,
    price: 120,
    location: "Kathmandu",
    description: "Assorted plastic bottles, cleaned and bundled. Mostly PET bottles.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    user: { name: "Sita", verified: true },
    tags: ["bottles", "clean"],
    comments: 2,
    distanceKm: 1.2,
  },
  {
    _id: "m2",
    wasteType: "paper",
    quantity: 8,
    price: 80,
    location: "Lalitpur",
    description: "Cardboard boxes and old newspapers, flattened and dry.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    user: { name: "Ram", verified: false },
    tags: ["cardboard", "newspaper"],
    comments: 0,
    distanceKm: 3.6,
  },
  {
    _id: "m3",
    wasteType: "metal",
    quantity: 5,
    price: 250,
    location: "Bhaktapur",
    description: "Aluminum cans collected from event; packed in sacks.",
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    user: { name: "Collector Joe", verified: true },
    tags: ["cans"],
    comments: 5,
    distanceKm: 0.5,
  },
];

/* small helpers */
function truncate(text?: string, n = 120) {
  if (!text) return "";
  return text.length > n ? text.slice(0, n - 1) + "…" : text;
}
function timeAgo(iso?: string) {
  if (!iso) return "recent";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

/* debounce hook */
function useDebounce<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

/* localStorage bookmarks */
const BOOKMARK_KEY = "gh_saved_posts";
function loadBookmarks(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function saveBookmarks(bm: Record<string, boolean>) {
  try {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bm));
  } catch {}
}

/* ------------------ Interactive bottom components ------------------ */

const TIP_LIST = [
  { id: "t1", emoji: "🧼", title: "Rinse & Dry", text: "Rinse containers and allow to air-dry — clean items fetch better prices and are easier to handle." },
  { id: "t2", emoji: "📦", title: "Bundle Cardboard", text: "Flatten and tie cardboard — bundles save time for collectors and reduce transport space." },
  { id: "t3", emoji: "📸", title: "Photo Tips", text: "Use plain backgrounds and natural light. Include a common object for scale (e.g., a bottle)." },
  { id: "t4", emoji: "🏷️", title: "Label Mixed Loads", text: "If materials are mixed, label them clearly (PET, HDPE, mixed plastics) to avoid rejection." },
];

function TipCarousel() {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % TIP_LIST.length);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const shift = index * (320 + 12); // card width + gap
    el.style.transform = `translateX(-${shift}px)`;
  }, [index]);

  return (
    <div className="tips-wrap" aria-hidden={false}>
      <div className="carousel" role="region" aria-label="Quick recycling tips">
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ fontWeight: 800, marginRight: 12 }}>Quick Tips</div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>Short, actionable tips to get better pickups</div>
        </div>

        <div style={{ position: "relative", marginTop: 12 }}>
          <div className="carousel-controls" aria-hidden>
            <button className="ctrl" onClick={() => setIndex((i) => Math.max(0, i - 1))} aria-label="Previous tip">◀</button>
            <button className="ctrl" onClick={() => setIndex((i) => (i + 1) % TIP_LIST.length)} aria-label="Next tip">▶</button>
          </div>

          <div style={{ overflow: "hidden", paddingTop: 8 }}>
            <div className="tip-track" ref={trackRef} role="list" aria-live="polite">
              {TIP_LIST.map((t) => (
                <div key={t.id} className="tip-card" role="listitem">
                  <div className="tip-emoji" aria-hidden>{t.emoji}</div>
                  <div className="tip-body">
                    <div className="tip-title">{t.title}</div>
                    <div className="tip-desc">{t.text}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => alert(`${t.title}: ${t.text}`)}
                        style={{ background: "transparent", border: "none", color: "var(--accent)", fontWeight: 700, cursor: "pointer" }}
                      >
                        Learn more
                      </button>
                      <button
                        onClick={() => navigator.clipboard?.writeText(t.text).then(()=>alert("Copied tip"))}
                        style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }}
                      >
                        Copy tip
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dots" role="tablist" aria-label="Tip pages">
            {TIP_LIST.map((_, i) => (
              <div key={i} className={`dot ${i === index ? "active" : ""}`} onClick={() => setIndex(i)} role="tab" aria-selected={i === index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  { q: "Can I post without an account?", a: "No — posting requires an account so collectors can coordinate pickups. Create one in minutes." },
  { q: "How are collectors verified?", a: "Collectors submit identity and business documents which admins review; verified collectors receive a badge." },
  { q: "Is pickup always free?", a: "Many pickups are free, but some items or long-distance pickups may incur fees (shown during booking)." },
  { q: "What if my posted item is rejected?", a: "Collectors can mark posts unavailable; you'll be notified and can relist with clearer photos or info." },
];

function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  const refs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    // open first by default for better "fun" experience
    setOpen(0);
  }, []);

  function toggle(i: number) {
    setOpen((cur) => (cur === i ? null : i));
    // optional: focus answer after open
    setTimeout(() => refs.current[i]?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 260);
  }

  return (
    <div className="accordion" role="list" aria-label="Frequently asked questions">
      {FAQ_ITEMS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="ac-item" role="listitem">
            <div className="ac-question" onClick={() => toggle(i)} aria-expanded={isOpen} aria-controls={`ans-${i}`}>
              <div className="ac-q-text">{f.q}</div>
              <div className="ac-toggle" style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}>{isOpen ? "−" : "+"}</div>
            </div>
            <div
              id={`ans-${i}`}
              className={`ac-answer ${isOpen ? "open" : ""}`}
              style={{ maxHeight: isOpen ? "240px" : "0px" }}
              ref={(el) => { refs.current[i] = el; }} // <-- fixed: block-bodied callback returns void
              role="region"
              aria-hidden={!isOpen}
            >
              {f.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------- Component -------------------------- */

export default function Explore(): JSX.Element {
  const [posts, setPosts] = useState<WastePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filters & sort & search
  const [filter, setFilter] = useState<string>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "closest" | "price-desc" | "price-asc">("newest");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // pagination / infinite scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // suggestions (small static pool)
  const suggestionPool = ["recycling centers", "how to recycle plastic", "cardboard", "roof panels", "glass bottles"];
  const [showSuggestions, setShowSuggestions] = useState(false);

  // post details modal
  const [selected, setSelected] = useState<WastePreview | null>(null);

  // saved bookmarks
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(() => loadBookmarks());

  // saved view toggle
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // refs
  const sentinel = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // construct request (if backend supports params)
  const requestUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (filter !== "all") params.set("type", filter);
    if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
    return `/waste/recent?${params.toString()}`;
  }, [page, filter, debouncedSearch]);

  // load posts (supports AbortController); falls back to mock data
  useEffect(() => {
    let mounted = true;
    setError(null);

    // reset when first page
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function fetchData() {
      try {
        const res = await api.get(requestUrl, { signal: controller.signal }).catch(() => null);
        let incoming: WastePreview[] = [];

        if (res && res.data) {
          if (Array.isArray(res.data.posts)) incoming = res.data.posts;
          else if (Array.isArray(res.data)) incoming = res.data;
          else if (Array.isArray(res.data.items)) incoming = res.data.items;
        }

        // fallback to mock for first page if backend not working
        if (incoming.length === 0 && page === 1) incoming = MOCK_POSTS;

        if (!mounted) return;
        setPosts((prev) => (page === 1 ? incoming : [...prev, ...incoming]));
        setHasMore(incoming.length > 0);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        console.error("Explore fetch error:", err);
        if (!mounted) return;
        setError("Unable to load posts. Try again later.");
        if (page === 1) setPosts(MOCK_POSTS);
        setHasMore(false);
      } finally {
        if (!mounted) return;
        setLoading(false);
        setLoadingMore(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [requestUrl, page]);

  // infinite scroll sentinel
  useEffect(() => {
    if (!sentinel.current) return;
    const el = sentinel.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
            setPage((p) => p + 1);
          }
        });
      },
      { rootMargin: "220px", threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loading]);

  // derived & client-side filtering/sorting
  const processed = useMemo(() => {
    let list = [...posts];

    // show only saved if toggled
    if (showSavedOnly) {
      list = list.filter((p) => !!bookmarks[p._id]);
    }

    // client-side filter
    if (filter !== "all") list = list.filter((p) => p.wasteType === filter);

    // verified only
    if (verifiedOnly) list = list.filter((p) => p.user?.verified);

    // search fallback filter
    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const fields = [p.description, p.wasteType, p.location, p.user?.name, ...(p.tags || [])].filter(Boolean);
        return fields.some((f) => String(f).toLowerCase().includes(q));
      });
    }

    // sorting
    switch (sortBy) {
      case "closest":
        list.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
        break;
      case "price-desc":
        list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "price-asc":
        list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      default:
        // newest: by createdAt desc
        list.sort((a, b) => (new Date(b.createdAt ?? "").getTime() || 0) - (new Date(a.createdAt ?? "").getTime() || 0));
    }

    return list;
  }, [posts, filter, debouncedSearch, verifiedOnly, sortBy, bookmarks, showSavedOnly]);

  // suggestions for search
  const suggestions = useMemo(() => {
    if (!search.trim()) return suggestionPool;
    const q = search.toLowerCase();
    return suggestionPool.filter((s) => s.toLowerCase().includes(q)).slice(0, 6);
  }, [search]);

  // bookmarks handlers
  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveBookmarks(next);
      return next;
    });
  }

  // open modal
  function openDetails(p: WastePreview) {
    setSelected(p);
  }
  function closeModal() {
    setSelected(null);
  }

  // contact action (placeholder)
  function contactCollector(p: WastePreview) {
    const who = p.user?.name || "collector";
    alert(`Contacting ${who} (demo). Implement real contact/booking flow in your app.`);
  }

  // image error fallback
  function onImgError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
    const img = e.currentTarget;
    img.style.display = "none";
    (img.parentElement as HTMLElement).innerText = (img.alt?.slice(0, 1) || "O").toUpperCase();
  }

  return (
    <div className="ex-page">
      <style>{css}</style>

      <header className="ex-header" role="banner">
        <div className="ex-brand">
          <div className="logo" aria-hidden>
            ♻️
          </div>
          <div>
            <h1 className="ex-title">Explore — Latest Posts</h1>
            <div className="ex-sub">Browse recent recyclable items posted by the community</div>
          </div>
        </div>

        <nav aria-label="primary" style={{ display: "flex", gap: 12 }}>
          <Link to="/" style={{ textDecoration: "none", color: "var(--text)" }}>
            Home
          </Link>
          <Link to="/login" style={{ textDecoration: "none", color: "var(--text)" }}>
            Login / Post
          </Link>
        </nav>
      </header>

      <main className="ex-main" role="main">
        <section className="controls" aria-label="Filters and tools">
          <div className="controls-left">
            <div>
              <label className="label" htmlFor="type">
                Filter
              </label>
              <select
                id="type"
                className="input"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by type"
              >
                <option value="all">All</option>
                <option value="plastic">Plastic</option>
                <option value="paper">Paper</option>
                <option value="metal">Metal</option>
                <option value="glass">Glass</option>
                <option value="organic">Organic</option>
                <option value="electronic">Electronic</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="sort">
                Sort
              </label>
              <select
                id="sort"
                className="input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort posts"
              >
                <option value="newest">Newest</option>
                <option value="closest">Closest</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="price-asc">Price: Low → High</option>
              </select>
            </div>

            <div style={{ alignSelf: "flex-end" }}>
              <label className="label" htmlFor="search">
                Search
              </label>
              <div className="search suggestions" style={{ position: "relative" }}>
                <input
                  id="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder="Search location, item, or tag"
                  aria-label="Search posts"
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                />
                <button
                  className="btn"
                  onClick={() => {
                    setPage(1);
                  }}
                  aria-label="Run search"
                  style={{ border: "1px solid rgba(11,40,18,0.06)", borderRadius: 8 }}
                >
                  Search
                </button>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="suggestions-list" role="listbox" aria-label="Search suggestions">
                    {suggestions.map((s) => (
                      <div
                        key={s}
                        tabIndex={0}
                        className="suggestion"
                        onMouseDown={(ev) => {
                          ev.preventDefault();
                          setSearch(s);
                          setShowSuggestions(false);
                          setPage(1);
                        }}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="toolbar" role="toolbar" aria-label="Toolbar">
            <label className="switch" title="Show only saved posts">
              <input
                type="checkbox"
                checked={showSavedOnly}
                onChange={(e) => setShowSavedOnly(e.target.checked)}
                aria-label="Show saved posts only"
              />{" "}
              Saved
            </label>

            <label className="switch" title="Show only verified collectors">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                aria-label="Show only verified collectors"
              />{" "}
              Verified
            </label>

            <Link to="/register" className="btn-primary btn" style={{ textDecoration: "none" }} aria-label="Create account">
              Create account
            </Link>
          </div>
        </section>

        <section aria-live="polite">
          {loading && posts.length === 0 ? (
            <div className="grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <article key={i} className="card skeleton" aria-hidden>
                  <div className="card-media skeleton" />
                  <div className="card-body">
                    <div style={{ height: 14, width: "40%", marginBottom: 8 }} className="skeleton" />
                    <div style={{ height: 14, width: "60%", marginBottom: 8 }} className="skeleton" />
                    <div style={{ height: 12, width: "30%", marginBottom: 8 }} className="skeleton" />
                    <div style={{ height: 12, width: "80%", marginTop: 12 }} className="skeleton" />
                  </div>
                </article>
              ))}
            </div>
          ) : error && posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30, color: "var(--muted)" }}>{error}</div>
          ) : processed.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <p style={{ marginBottom: 12, color: "var(--muted)" }}>No posts match your filters.</p>
              <Link to="/register" className="btn-primary btn" style={{ textDecoration: "none" }}>
                Create an account to post
              </Link>
            </div>
          ) : (
            <div className="grid" role="list">
              {processed.map((p) => {
                const imgSrc = typeof p.image === "string" ? p.image : p.image?.url;
                return (
                  <article key={p._id} className="card" aria-labelledby={`title-${p._id}`}>
                    <div
                      className="card-media"
                      role="button"
                      tabIndex={0}
                      onClick={() => openDetails(p)}
                      onKeyDown={(e) => (e.key === "Enter" ? openDetails(p) : null)}
                    >
                      {imgSrc ? (
                        <img src={imgSrc} alt={p.description || p.wasteType || "item"} loading="lazy" onError={onImgError} />
                      ) : (
                        <div style={{ fontSize: 28, color: "#2f5a3f", fontWeight: 800 }}>
                          {(p.wasteType || "O").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="card-body">
                      <div className="card-row">
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div className="tag">{p.wasteType ?? "Other"}</div>
                          {p.user?.verified && <div className="badge">Verified</div>}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div style={{ textAlign: "right", color: "var(--muted)", fontSize: 13 }}>
                            {p.distanceKm != null ? `${p.distanceKm} km` : "—"}
                          </div>
                          <button
                            aria-label={bookmarks[p._id] ? "Remove saved" : "Save post"}
                            className={`save-btn ${bookmarks[p._id] ? "saved" : ""}`}
                            onClick={() => toggleBookmark(p._id)}
                            title={bookmarks[p._id] ? "Saved" : "Save"}
                          >
                            {bookmarks[p._id] ? "★" : "☆"}
                          </button>
                        </div>
                      </div>

                      <h3 id={`title-${p._id}`} className="title">
                        {truncate(p.description ?? p.wasteType, 120)}
                      </h3>

                      <div className="meta">
                        <span>{p.location ?? "Unknown location"}</span>
                        <span>•</span>
                        <span>{timeAgo(p.createdAt)}</span>
                        {p.user?.name && (
                          <>
                            <span>•</span>
                            <span style={{ fontWeight: 700 }}>{p.user.name}</span>
                          </>
                        )}
                        {p.comments != null && (
                          <>
                            <span>•</span>
                            <span>{p.comments} comments</span>
                          </>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                        {(p.tags || []).slice(0, 3).map((t) => (
                          <span key={t} className="badge">
                            #{t}
                          </span>
                        ))}
                      </div>

                      <div className="card-footer">
                        <div>
                          <Link to={`/track/${p._id}`} className="small-link" aria-label="View details">
                            View details
                          </Link>
                        </div>

                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div className="price">Rs {p.price ?? "N/A"}</div>
                          <button
                            className="btn"
                            onClick={() => contactCollector(p)}
                            aria-label="Contact collector"
                            style={{ border: "1px solid rgba(11,40,18,0.06)", borderRadius: 8 }}
                          >
                            Contact
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
          {hasMore && !loadingMore && !loading && processed.length > 0 && (
            <button
              className="load-btn"
              onClick={() => {
                setPage((p) => p + 1);
              }}
              aria-label="Load more posts"
            >
              Load more
            </button>
          )}
          {loadingMore && <div style={{ color: "var(--muted)" }}>Loading more…</div>}
        </div>

        {/* sentinel for infinite scroll */}
        <div ref={sentinel} style={{ height: 1 }} />

        {/* Interactive Tips Carousel */}
        <section aria-labelledby="tips" style={{ marginTop: 18 }}>
          <TipCarousel />
        </section>

        {/* FAQ Accordion */}
        <section aria-labelledby="faq" style={{ marginTop: 12 }}>
          <h3 id="faq" style={{ marginBottom: 8 }}>Frequently asked (guest)</h3>
          <FAQAccordion />
        </section>
      </main>

      {/* details modal */}
      {selected && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="post-details-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal">
            <div>
              {typeof selected.image === "string" || selected.image?.url ? (
                <img src={(typeof selected.image === "string" ? selected.image : selected.image?.url) || ""} alt={selected.description || selected.wasteType} onError={(ev) => onImgError(ev as any)} />
              ) : (
                <div style={{ padding: 20, fontSize: 32, fontWeight: 800 }}>{(selected.wasteType || "O").slice(0, 1).toUpperCase()}</div>
              )}
            </div>

            <div>
              <h3 id="post-details-title">{truncate(selected.description || selected.wasteType, 200)}</h3>
              <div style={{ color: "var(--muted)", marginBottom: 8 }}>
                {selected.location} • {timeAgo(selected.createdAt)} • {selected.user?.name ?? "Unknown"}
                {selected.user?.verified && <span style={{ marginLeft: 8, color: "var(--primary)", fontWeight: 700 }}> • Verified</span>}
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {(selected.tags || []).map((t) => (
                  <span key={t} className="badge">
                    #{t}
                  </span>
                ))}
              </div>

              <div style={{ marginBottom: 12 }}>
                <strong>Quantity:</strong> {selected.quantity ?? "—"} kg • <strong>Price:</strong> Rs {selected.price ?? "N/A"}
              </div>

              <p style={{ color: "var(--muted)" }}>{selected.description}</p>

              <div style={{ marginTop: 12 }}>
                <div className="map" role="img" aria-label="Map preview">
                  Map preview (implement with a maps SDK — placeholder)
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                <button className="btn" onClick={() => { contactCollector(selected); }} aria-label="Contact collector">
                  Contact
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    toggleBookmark(selected._id);
                  }}
                >
                  {bookmarks[selected._id] ? "Saved" : "Save"}
                </button>
                <button className="btn" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}