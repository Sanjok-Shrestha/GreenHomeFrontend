import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import NavBar from "../components/NavBar";
import "./Explore.css";
import type { JSX } from "react/jsx-runtime";

/* =========================
   Types & helpers
   ========================= */
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
  distanceKm?: number;
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
  return `${Math.floor(hrs / 24)}d`;
}

function useDebounce<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

const BOOKMARK_KEY = "gh_saved_posts";
function loadBookmarks(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveBookmarks(bm: Record<string, boolean>) {
  try {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bm));
  } catch {}
}

/* ============================================================
   Tip carousel + FAQ (unchanged)
   ============================================================ */
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
    const id = setInterval(() => setIndex((i) => (i + 1) % TIP_LIST.length), 4200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transform = `translateX(-${index * (320 + 12)}px)`;
  }, [index]);

  return (
    <div className="tips-wrap">
      <div className="carousel" role="region" aria-label="Quick recycling tips">
        <div className="carousel__header">
          <div className="carousel__heading">Quick Tips</div>
          <div className="carousel__subheading">Short, actionable tips to get better pickups</div>
        </div>

        <div className="carousel__body">
          <div className="carousel-controls" aria-hidden>
            <button className="ctrl" onClick={() => setIndex((i) => Math.max(0, i - 1))} aria-label="Previous tip">◀</button>
            <button className="ctrl" onClick={() => setIndex((i) => (i + 1) % TIP_LIST.length)} aria-label="Next tip">▶</button>
          </div>

          <div className="carousel__overflow">
            <div className="tip-track" ref={trackRef} role="list" aria-live="polite">
              {TIP_LIST.map((t) => (
                <div key={t.id} className="tip-card" role="listitem">
                  <div className="tip-emoji" aria-hidden>{t.emoji}</div>
                  <div className="tip-body">
                    <div className="tip-title">{t.title}</div>
                    <div className="tip-desc">{t.text}</div>
                    <div className="tip-actions">
                      <button className="tip-btn-learn" onClick={() => alert(`${t.title}: ${t.text}`)}>Learn more</button>
                      <button className="tip-btn-copy" onClick={() => navigator.clipboard?.writeText(t.text).then(() => alert("Copied tip"))}>Copy tip</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dots" role="tablist" aria-label="Tip pages">
            {TIP_LIST.map((_, i) => (
              <div key={i} className={`dot${i === index ? " active" : ""}`} onClick={() => setIndex(i)} role="tab" aria-selected={i === index} />
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

  useEffect(() => { setOpen(0); }, []);

  function toggle(i: number) {
    setOpen((cur) => (cur === i ? null : i));
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
            <div id={`ans-${i}`} className={`ac-answer${isOpen ? " open" : ""}`} style={{ maxHeight: isOpen ? "240px" : "0px" }} ref={(el) => { refs.current[i] = el; }} role="region" aria-hidden={!isOpen}>
              {f.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Explore page
   ============================================================ */
export default function Explore(): JSX.Element {
  const [posts, setPosts] = useState<WastePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<string>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "closest" | "price-desc" | "price-asc">("newest");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const suggestionPool = ["recycling centers", "how to recycle plastic", "cardboard", "roof panels", "glass bottles"];
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [selected, setSelected] = useState<WastePreview | null>(null);
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(() => loadBookmarks());
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const sentinel = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Build request query
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (filter !== "all") params.set("type", filter);
    if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
    return params.toString();
  }, [page, filter, debouncedSearch]);

  useEffect(() => {
    let mounted = true;
    setError(null);
    if (page === 1) setLoading(true); else setLoadingMore(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function fetchData() {
      const endpoint = `/posts/recent?${queryParams}`;
      try {
        console.debug("Explore: requesting", endpoint);
        // Ask server for fresh JSON explicitly to avoid 304 from caches
        const res = await api.get(endpoint, {
          signal: controller.signal,
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          // accept 200 and 304 just in case; we'll handle 304 by retrying with cache-bust
          validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
        });

        console.debug("Explore: response status =", res?.status);
        // If server returned 304 unexpectedly, retry with cache-buster param
        if (res && res.status === 304) {
          console.warn("Explore: received 304, retrying with cache-bust");
          const res2 = await api.get(`${endpoint}&_cb=${Date.now()}`, {
            signal: controller.signal,
            headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          });
          console.debug("Explore: retry response status =", res2?.status);
          return handleResponse(res2);
        }

        return handleResponse(res);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        console.error("Explore fetch error:", err);
        const status = err?.response?.status;
        if (status === 404) {
          setError("Server returned 404 for /api/posts/recent. Confirm backend route and mount path.");
          if (page === 1) setPosts(MOCK_POSTS);
          setHasMore(false);
        } else {
          setError("Unable to load posts. Try again later.");
          if (page === 1) setPosts(MOCK_POSTS);
          setHasMore(false);
        }
      } finally {
        if (!mounted) return;
        setLoading(false);
        setLoadingMore(false);
      }
    }

    function handleResponse(res: any) {
      let incoming: WastePreview[] = [];
      if (res?.data) {
        if (Array.isArray(res.data.posts)) incoming = res.data.posts;
        else if (Array.isArray(res.data)) incoming = res.data;
        else if (Array.isArray(res.data.items)) incoming = res.data.items;
        else if (Array.isArray(res.data.data)) incoming = res.data.data;
      }

      if ((!incoming || incoming.length === 0) && page === 1) {
        incoming = MOCK_POSTS;
      }

      if (!mounted) return;
      setPosts((prev) => (page === 1 ? incoming : [...prev, ...incoming]));
      console.debug("Explore: incoming posts count:", incoming.length, "page:", page);
      setHasMore(incoming.length > 0);
    }

    fetchData();
    return () => { mounted = false; controller.abort(); };
  }, [page, queryParams, filter, debouncedSearch]);

  useEffect(() => {
    if (!sentinel.current) return;
    const el = sentinel.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !loadingMore && !loading) setPage((p) => p + 1);
        });
      },
      { rootMargin: "220px", threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loading]);

  const processed = useMemo(() => {
    let list = [...posts];
    if (showSavedOnly) list = list.filter((p) => !!bookmarks[p._id]);
    if (filter !== "all") list = list.filter((p) => p.wasteType === filter);
    if (verifiedOnly) list = list.filter((p) => p.user?.verified);
    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const fields = [p.description, p.wasteType, p.location, p.user?.name, ...(p.tags || [])].filter(Boolean);
        return fields.some((f) => String(f).toLowerCase().includes(q));
      });
    }
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
        list.sort((a, b) => (new Date(b.createdAt ?? "").getTime() || 0) - (new Date(a.createdAt ?? "").getTime() || 0));
    }
    return list;
  }, [posts, filter, debouncedSearch, verifiedOnly, sortBy, bookmarks, showSavedOnly]);

  // debug: log processed length so you can see why UI might be empty
  useEffect(() => {
    console.debug("Explore: processed.length =", processed.length, "posts.length =", posts.length, "page =", page, "loading=", loading);
  }, [processed.length, posts.length, page, loading]);

  const suggestions = useMemo(() => {
    if (!search.trim()) return suggestionPool;
    const q = search.toLowerCase();
    return suggestionPool.filter((s) => s.toLowerCase().includes(q)).slice(0, 6);
  }, [search]);

  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveBookmarks(next);
      return next;
    });
  }

  function openDetails(p: WastePreview) {
    setSelected(p);
  }
  function closeModal() {
    setSelected(null);
  }

  function contactCollector(p: WastePreview) {
    alert(`Contacting ${p.user?.name || "collector"} (demo). Implement real contact/booking flow in your app.`);
  }

  function onImgError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
    const img = e.currentTarget;
    img.style.display = "none";
    (img.parentElement as HTMLElement).innerText = (img.alt?.slice(0, 1) || "O").toUpperCase();
  }

  /* =========================
     Render
     ========================= */
  return (
    <div className="ex-page">
      <NavBar />

      <main className="ex-main" role="main">
        {/* Controls */}
        <section className="controls" aria-label="Filters and tools">
          <div className="controls-left">
            <div>
              <label className="label" htmlFor="type">Filter</label>
              <select id="type" className="input" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} aria-label="Filter by type">
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
              <label className="label" htmlFor="sort">Sort</label>
              <select id="sort" className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} aria-label="Sort posts">
                <option value="newest">Newest</option>
                <option value="closest">Closest</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="price-asc">Price: Low → High</option>
              </select>
            </div>

            <div className="controls-search-wrap">
              <label className="label" htmlFor="search">Search</label>
              <div className="search suggestions">
                <input id="search" value={search} placeholder="Search location, item, or tag" aria-label="Search posts" onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 180)} />
                <button className="search-btn" onClick={() => setPage(1)} aria-label="Run search">Search</button>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="suggestions-list" role="listbox" aria-label="Search suggestions">
                    {suggestions.map((s) => (
                      <div key={s} tabIndex={0} className="suggestion" onMouseDown={(ev) => { ev.preventDefault(); setSearch(s); setShowSuggestions(false); setPage(1); }}>{s}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="toolbar" role="toolbar" aria-label="Toolbar">
            <label className="switch" title="Show only saved posts">
              <input type="checkbox" checked={showSavedOnly} onChange={(e) => setShowSavedOnly(e.target.checked)} aria-label="Show saved posts only" />{" "}Saved
            </label>
            <label className="switch" title="Show only verified collectors">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} aria-label="Show only verified collectors" />{" "}Verified
            </label>
            <Link to="/register" className="btn-primary" aria-label="Create account">Create account</Link>
          </div>
        </section>

        {/* Post grid */}
        <section aria-live="polite">
          {loading && posts.length === 0 ? (
            <div className="grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <article key={i} className="card skeleton" aria-hidden>
                  <div className="card-media skeleton" />
                  <div className="card-body">
                    <div className="skeleton skeleton-line" style={{ height: 14, width: "40%", marginBottom: 8 }} />
                    <div className="skeleton skeleton-line" style={{ height: 14, width: "60%", marginBottom: 8 }} />
                    <div className="skeleton skeleton-line" style={{ height: 12, width: "30%", marginBottom: 8 }} />
                    <div className="skeleton skeleton-line" style={{ height: 12, width: "80%", marginTop: 12 }} />
                  </div>
                </article>
              ))}
            </div>
          ) : error && posts.length === 0 ? (
            <div className="state-center">{error}</div>
          ) : processed.length === 0 ? (
            <div className="state-center state-center--lg">
              <p className="state-center__note">No posts match your filters.</p>
              <Link to="/register" className="btn-primary">Create an account to post</Link>
            </div>
          ) : (
            <div className="grid" role="list">
              {processed.map((p) => {
                const imgSrc = typeof p.image === "string" ? p.image : p.image?.url;
                return (
                  <article key={p._id} className="card" aria-labelledby={`title-${p._id}`}>
                    <div className="card-media" role="button" tabIndex={0} onClick={() => openDetails(p)} onKeyDown={(e) => e.key === "Enter" && openDetails(p)}>
                      {imgSrc ? <img src={imgSrc} alt={p.description || p.wasteType || "item"} loading="lazy" onError={onImgError} /> : <div className="card-media__fallback">{(p.wasteType || "O").slice(0, 1).toUpperCase()}</div>}
                    </div>

                    <div className="card-body">
                      <div className="card-row">
                        <div className="card-row__left">
                          <div className="tag">{p.wasteType ?? "Other"}</div>
                          {p.user?.verified && <div className="badge">Verified</div>}
                        </div>
                        <div className="card-row__right">
                          <div className="distance">{p.distanceKm != null ? `${p.distanceKm} km` : "—"}</div>
                          <button aria-label={bookmarks[p._id] ? "Remove saved" : "Save post"} className={`save-btn${bookmarks[p._id] ? " saved" : ""}`} onClick={() => toggleBookmark(p._id)} title={bookmarks[p._id] ? "Saved" : "Save"}>
                            {bookmarks[p._id] ? "★" : "☆"}
                          </button>
                        </div>
                      </div>

                      <h3 id={`title-${p._id}`} className="title">{truncate(p.description ?? p.wasteType, 120)}</h3>

                      <div className="meta">
                        <span>{p.location ?? "Unknown location"}</span><span>•</span><span>{timeAgo(p.createdAt)}</span>
                        {p.user?.name && <><span>•</span><span className="meta__author">{p.user.name}</span></>}
                        {p.comments != null && <><span>•</span><span>{p.comments} comments</span></>}
                      </div>

                      <div className="card-tags">{(p.tags || []).slice(0, 3).map((t) => <span key={t} className="badge">#{t}</span>)}</div>

                      <div className="card-footer">
                        <Link to={`/track/${p._id}`} className="small-link" aria-label="View details">View details</Link>
                        <div className="card-footer__right">
                          <div className="price">Rs {p.price ?? "N/A"}</div>
                          <button className="btn" onClick={() => contactCollector(p)} aria-label="Contact collector">Contact</button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Load more */}
        <div className="load-more-wrap">
          {hasMore && !loadingMore && !loading && processed.length > 0 && <button className="load-btn" onClick={() => setPage((p) => p + 1)} aria-label="Load more posts">Load more</button>}
          {loadingMore && <div className="loading-more">Loading more…</div>}
        </div>

        <div ref={sentinel} className="scroll-sentinel" />

        {/* Tips & FAQ */}
        <section className="tips-section" aria-labelledby="tips"><TipCarousel /></section>
        <section className="faq-section" aria-labelledby="faq"><h3 id="faq" className="faq-heading">Frequently asked (guest)</h3><FAQAccordion /></section>
      </main>

      {/* Details modal */}
      {selected && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="post-details-title" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <div>
              {typeof selected.image === "string" || selected.image?.url ? (
                <img src={(typeof selected.image === "string" ? selected.image : selected.image?.url) || ""} alt={selected.description || selected.wasteType} onError={(ev) => onImgError(ev as any)} />
              ) : (
                <div className="modal__img-fallback">{(selected.wasteType || "O").slice(0, 1).toUpperCase()}</div>
              )}
            </div>

            <div>
              <h3 id="post-details-title">{truncate(selected.description || selected.wasteType, 200)}</h3>
              <div className="modal__meta">{selected.location} • {timeAgo(selected.createdAt)} • {selected.user?.name ?? "Unknown"}{selected.user?.verified && <span className="modal__meta-verified"> • Verified</span>}</div>
              <div className="modal__tags">{(selected.tags || []).map((t) => <span key={t} className="badge">#{t}</span>)}</div>
              <div className="modal__qty"><strong>Quantity:</strong> {selected.quantity ?? "—"} kg • <strong>Price:</strong> Rs {selected.price ?? "N/A"}</div>
              <p className="modal__desc">{selected.description}</p>

              <div className="modal__map-wrap"><div className="map" role="img" aria-label="Map preview">Map preview (placeholder)</div></div>

              <div className="modal__actions">
                <button className="btn" onClick={() => contactCollector(selected)} aria-label="Contact collector">Contact</button>
                <button className="btn" onClick={() => toggleBookmark(selected._id)}>{bookmarks[selected._id] ? "Saved" : "Save"}</button>
                <button className="btn" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}