// src/pages/HistoryPage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";

type Waste = {
  _id: string;
  wasteType?: string;
  quantity?: number;
  price?: number;
  status?: string;
  pickupDate?: string | null;
  completedAt?: string | null;
  imageUrl?: string;
  createdAt?: string;
  [k: string]: any;
};

export default function HistoryPage(): React.JSX.Element {
  const [items, setItems] = useState<Waste[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/waste/my-posts");
      const data = res.data?.data ?? res.data ?? [];
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const visible = items
    .filter((w) => {
      const s = (w.status ?? "").toString().toLowerCase();
      return s === "collected" || s === "completed";
    })
    .sort((a, b) => {
      const ta = a.completedAt ? new Date(a.completedAt).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.completedAt ? new Date(b.completedAt).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

  const copyLink = (id: string) => {
    const link = window.location.origin + `/track/${id}`;
    navigator.clipboard?.writeText(link);
    const n = document.createElement("div");
    n.textContent = "Link copied";
    Object.assign(n.style, {
      position: "fixed", right: "18px", bottom: "22px",
      background: "#1a6b45", color: "#fff",
      padding: "9px 14px", borderRadius: "9px",
      fontSize: "13px", fontWeight: "500", zIndex: "9999",
      boxShadow: "0 4px 16px rgba(26,107,69,0.25)",
    });
    document.body.appendChild(n);
    setTimeout(() => { try { document.body.removeChild(n); } catch {} }, 1200);
  };

  return (
    <>
      <style>{css}</style>
      <div className="hp-root">
        <Sidebar />
        <main className="hp-main">
          <div className="hp-inner">

            {/* Header */}
            <div className="hp-header">
              <div>
                <h2 className="hp-title">Pickup History</h2>
                <p className="hp-sub">Your completed and collected pickups</p>
              </div>
              <button onClick={fetchItems} className="hp-btn" disabled={loading}>
                {loading ? "Loading…" : "↻ Refresh"}
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="hp-list">
                {[0,1,2,3].map(i => (
                  <div key={i} className="hp-skeleton-card" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="hp-skel" style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="hp-skel" style={{ height: 13, width: "35%", marginBottom: 8 }} />
                      <div className="hp-skel" style={{ height: 11, width: "55%" }} />
                    </div>
                    <div className="hp-skel" style={{ width: 52, height: 20, borderRadius: 6 }} />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="hp-error">
                <span>⚠ {error}</span>
                <button className="hp-btn hp-btn--primary" onClick={fetchItems}>Retry</button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && visible.length === 0 && (
              <div className="hp-empty">
                <div className="hp-empty__icon">📭</div>
                <div className="hp-empty__title">No completed pickups yet</div>
                <div className="hp-empty__sub">Completed pickups will appear here</div>
              </div>
            )}

            {/* List */}
            {!loading && !error && visible.length > 0 && (
              <div className="hp-list">
                {visible.map((w, idx) => (
                  <div key={w._id} className="hp-card" style={{ animationDelay: `${Math.min(idx * 35, 280)}ms` }}>

                    {/* Thumbnail */}
                    <div className="hp-thumb">
                      {w.imageUrl
                        ? <Thumbnail imageUrl={w.imageUrl} />
                        : <span className="hp-thumb__fallback">🗑️</span>
                      }
                    </div>

                    {/* Meta */}
                    <div className="hp-card__meta">
                      <div className="hp-card__type">
                        {(w.wasteType ?? "Unknown").toString()}
                      </div>
                      <div className="hp-card__details">
                        <span className="hp-pill">{w.quantity ?? "—"} kg</span>
                        <span className="hp-pill hp-pill--date">
                          {w.completedAt
                            ? new Date(w.completedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
                            : w.createdAt
                              ? new Date(w.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
                              : "—"
                          }
                        </span>
                        <span className="hp-badge">
                          {w.status ?? "—"}
                        </span>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="hp-card__right">
                      <div className="hp-price">
                        Rs {w.price != null ? Number(w.price).toLocaleString() : "—"}
                      </div>
                      <div className="hp-card__actions">
                        <Link to={`/track/${w._id}`} className="hp-action-btn">View</Link>
                        <button className="hp-action-btn" onClick={() => copyLink(w._id)}>Copy</button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}

/* ── Thumbnail ── */
function Thumbnail({ imageUrl }: { imageUrl?: string | null }) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;
    let mounted = true;
    let objectUrl: string | null = null;

    const apiBase = (api.defaults?.baseURL as string) || "";
    const raw = String(imageUrl).trim();
    const candidates: string[] = [];

    if (/^https?:\/\//i.test(raw)) {
      candidates.push(raw);
    } else {
      const path = raw.startsWith("/") ? raw : "/" + raw;
      if (apiBase) candidates.push(apiBase + path);
      candidates.push(path);
      const filename = path.split("/").pop() || "";
      if (filename) {
        candidates.push(`/uploads/${filename}`);
        candidates.push(`/uploads/images/${filename}`);
        candidates.push(`/${filename}`);
      }
    }

    const seen = new Set<string>();
    const uniq = candidates.filter(c => { const k = c.replace(/\/+/g, "/"); return seen.has(k) ? false : (seen.add(k), true); });

    async function tryCandidates() {
      for (const cand of uniq) {
        if (!mounted) return;
        try {
          if (/^https?:\/\//i.test(cand)) {
            let apiOrigin = window.location.origin;
            try { if (typeof api.defaults.baseURL === "string") apiOrigin = new URL(api.defaults.baseURL).origin; } catch {}
            const candUrl = new URL(cand);
            if (candUrl.origin === apiOrigin) {
              const resp = await api.get(candUrl.pathname + (candUrl.search || ""), { responseType: "blob" });
              objectUrl = URL.createObjectURL(resp.data);
              if (mounted) { setSrc(objectUrl); return; }
            } else {
              if (mounted) { setSrc(cand); return; }
            }
          } else {
            const resp = await api.get(cand.startsWith("/") ? cand : "/" + cand, { responseType: "blob" });
            objectUrl = URL.createObjectURL(resp.data);
            if (mounted) { setSrc(objectUrl); return; }
          }
        } catch { continue; }
      }
      if (mounted) setErr(true);
    }

    tryCandidates();
    return () => { mounted = false; if (objectUrl) try { URL.revokeObjectURL(objectUrl); } catch {} };
  }, [imageUrl]);

  if (err || !src) return <span className="hp-thumb__fallback">🗑️</span>;
  return <img src={src} alt="waste thumbnail" className="hp-thumb__img" onError={() => setErr(true)} />;
}

/* ── CSS ── */
const css = `
  .hp-root {
    display: flex;
    min-height: 100vh;
    background: #f4faf6;
    font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }

  .hp-main {
    flex: 1;
    min-width: 0;
    padding: 32px 28px;
    box-sizing: border-box;
  }

  .hp-inner {
    max-width: 860px;
    margin: 0 auto;
  }

  /* Header */
  .hp-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .hp-title {
    font-size: 20px;
    font-weight: 500;
    color: #0f1f16;
    letter-spacing: -0.3px;
    margin: 0 0 4px;
  }

  .hp-sub {
    font-size: 13.5px;
    color: #6b7f73;
    margin: 0;
  }

  /* Button */
  .hp-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 14px;
    border-radius: 8px;
    border: 1px solid #dde8e2;
    background: #ffffff;
    color: #2a3d31;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
    transition: background 0.12s, border-color 0.12s;
  }

  .hp-btn:hover:not(:disabled) {
    background: #f0f7f3;
    border-color: #c4d9cc;
  }

  .hp-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .hp-btn--primary {
    background: #2c9e6a;
    border-color: #2c9e6a;
    color: #fff;
  }

  .hp-btn--primary:hover:not(:disabled) {
    background: #249060;
  }

  /* List */
  .hp-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* Card */
  .hp-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #ffffff;
    border: 1px solid #dde8e2;
    border-radius: 12px;
    padding: 14px 16px;
    box-sizing: border-box;
    animation: hp-fade-in 0.22s ease both;
    transition: border-color 0.15s;
  }

  .hp-card:hover {
    border-color: #b8d4c4;
  }

  /* Thumbnail */
  .hp-thumb {
    width: 52px;
    height: 52px;
    border-radius: 10px;
    background: #f0f7f3;
    border: 1px solid #dde8e2;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    font-size: 20px;
  }

  .hp-thumb__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 9px;
    display: block;
  }

  .hp-thumb__fallback {
    font-size: 20px;
    line-height: 1;
  }

  /* Meta */
  .hp-card__meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .hp-card__type {
    font-size: 14px;
    font-weight: 500;
    color: #0f1f16;
    text-transform: capitalize;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  .hp-card__details {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
  }

  /* Pills */
  .hp-pill {
    font-size: 11.5px;
    color: #4a6b56;
    background: #f0f7f3;
    border: 1px solid #dde8e2;
    border-radius: 20px;
    padding: 2px 8px;
    white-space: nowrap;
    line-height: 1.5;
  }

  .hp-pill--date {
    background: #f5f8f6;
    color: #5a7364;
  }

  /* Badge */
  .hp-badge {
    font-size: 11px;
    font-weight: 500;
    text-transform: capitalize;
    letter-spacing: 0.3px;
    padding: 2px 9px;
    border-radius: 20px;
    background: #e6f4ec;
    color: #1a6b45;
    border: 1px solid #c3e0d0;
    white-space: nowrap;
    line-height: 1.5;
  }

  /* Right */
  .hp-card__right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    flex-shrink: 0;
  }

  .hp-price {
    font-size: 14px;
    font-weight: 500;
    color: #0f1f16;
    white-space: nowrap;
  }

  .hp-card__actions {
    display: flex;
    gap: 6px;
  }

  .hp-action-btn {
    padding: 5px 11px;
    border-radius: 7px;
    border: 1px solid #dde8e2;
    background: #f7fbf8;
    color: #2a3d31;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    transition: background 0.12s, border-color 0.12s;
    white-space: nowrap;
  }

  .hp-action-btn:hover {
    background: #eaf4ef;
    border-color: #c4d9cc;
    color: #1a6b45;
  }

  /* Error */
  .hp-error {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff8f7;
    border: 1px solid #f5c4b3;
    border-radius: 12px;
    padding: 14px 18px;
    font-size: 13.5px;
    font-weight: 500;
    color: #712b13;
    flex-wrap: wrap;
  }

  /* Empty */
  .hp-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    gap: 8px;
    text-align: center;
  }

  .hp-empty__icon { font-size: 34px; margin-bottom: 4px; line-height: 1; }
  .hp-empty__title { font-size: 15px; font-weight: 500; color: #1a3326; }
  .hp-empty__sub { font-size: 13px; color: #6b7f73; }

  /* Skeleton */
  .hp-skeleton-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #ffffff;
    border: 1px solid #dde8e2;
    border-radius: 12px;
    padding: 14px 16px;
    animation: hp-fade-in 0.2s ease both;
  }

  .hp-skel {
    background: linear-gradient(90deg, #edf3ef 25%, #e0ece5 50%, #edf3ef 75%);
    background-size: 200% 100%;
    border-radius: 6px;
    animation: hp-shimmer 1.4s infinite;
    flex-shrink: 0;
  }

  @keyframes hp-fade-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes hp-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (max-width: 560px) {
    .hp-main { padding: 20px 16px; }
    .hp-card { flex-wrap: wrap; }
    .hp-card__right { flex-direction: row; align-items: center; width: 100%; justify-content: space-between; }
    .hp-header { flex-direction: column; gap: 10px; }
  }
`;