import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import CollectorSidebar from "../components/CollectorSidebar";

/* ─────────────────────────── Styles ─────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --bg:          #f1f4f2;
    --surface:     #ffffff;
    --surface-2:   #f7faf8;
    --border:      #e2e8e4;
    --border-2:    #c8d5cc;
    --green:       #18a349;
    --green-hover: #138038;
    --green-soft:  #e8f5ed;
    --green-glow:  rgba(24,163,73,.18);
    --blue:        #2563eb;
    --blue-soft:   #eff6ff;
    --text-1:      #0c1f13;
    --text-2:      #445c4e;
    --text-3:      #8aaa94;
    --danger:      #dc2626;
    --danger-soft: #fef2f2;
    --mono:        'JetBrains Mono', monospace;
    --font:        'Plus Jakarta Sans', system-ui, sans-serif;
    --ease:        cubic-bezier(.4,0,.2,1);
    --ease-spring: cubic-bezier(.34,1.26,.64,1);
    --r-sm:        8px;
    --r-md:        12px;
    --r-lg:        16px;
    --r-xl:        20px;
    --sh-sm:       0 1px 4px rgba(0,0,0,.05), 0 1px 2px rgba(0,0,0,.04);
    --sh-md:       0 6px 20px rgba(0,0,0,.07), 0 2px 6px rgba(0,0,0,.04);
  }

  /* ── Root ── */
  .ch-root {
    display: flex;
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--font);
    color: var(--text-1);
    -webkit-font-smoothing: antialiased;
  }

  /* ── Main ── */
  .ch-main {
    flex: 1;
    padding: 32px 28px 56px;
    min-width: 0;
  }

  .ch-inner {
    max-width: 1100px;
    margin: 0 auto;
    animation: ch-in 280ms var(--ease) both;
  }

  @keyframes ch-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Header ── */
  .ch-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .ch-title {
    margin: 0 0 4px;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.4px;
    color: var(--text-1);
  }

  .ch-sub {
    font-size: 13.5px;
    color: var(--text-2);
  }

  .ch-count {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 999px;
    background: var(--green-soft);
    border: 1px solid rgba(24,163,73,.2);
    font-size: 12.5px;
    font-weight: 700;
    color: var(--green);
    font-family: var(--mono);
    align-self: center;
  }

  /* ── Buttons ── */
  .ch-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 15px;
    border-radius: var(--r-md);
    border: 1.5px solid var(--border);
    background: var(--surface);
    color: var(--text-1);
    font-family: var(--font);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 130ms var(--ease), background 130ms, transform 130ms var(--ease), box-shadow 130ms;
    outline: none;
    white-space: nowrap;
    text-decoration: none;
  }

  .ch-btn:hover:not(:disabled) {
    border-color: var(--border-2);
    background: var(--surface-2);
    transform: translateY(-1px);
    box-shadow: var(--sh-sm);
  }

  .ch-btn:active:not(:disabled) { transform: translateY(0); }

  .ch-btn--primary {
    background: var(--blue);
    border-color: var(--blue);
    color: #fff;
  }

  .ch-btn--primary:hover:not(:disabled) {
    background: #1d4ed8;
    border-color: #1d4ed8;
    box-shadow: 0 4px 14px rgba(37,99,235,.25);
  }

  .ch-btn--sm { padding: 5px 11px; font-size: 12px; border-radius: var(--r-sm); }

  /* ── List ── */
  .ch-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
  }

  /* ── History card ── */
  .ch-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 16px 18px;
    box-shadow: var(--sh-sm);
    transition: border-color 150ms, box-shadow 150ms, transform 150ms var(--ease);
    animation: ch-card-in 320ms var(--ease-spring) both;
  }

  .ch-card:hover {
    border-color: var(--border-2);
    box-shadow: var(--sh-md);
    transform: translateY(-1px);
  }

  @keyframes ch-card-in {
    from { opacity: 0; transform: translateY(10px) scale(.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .ch-card__top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .ch-card__left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  /* ── Waste image / icon ── */
  .ch-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--r-md);
    background: var(--green-soft);
    border: 1px solid rgba(24,163,73,.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
    overflow: hidden;
  }

  .ch-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .ch-card__meta { flex: 1; min-width: 0; }

  .ch-card__type {
    font-size: 14.5px;
    font-weight: 700;
    letter-spacing: -0.1px;
    color: var(--text-1);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ch-card__info {
    font-size: 12.5px;
    color: var(--text-2);
    font-family: var(--mono);
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .ch-card__info-sep { color: var(--text-3); }

  .ch-card__right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    flex-shrink: 0;
  }

  /* ── Status badge ── */
  .ch-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: .2px;
    text-transform: capitalize;
    white-space: nowrap;
  }

  .ch-card__time {
    font-size: 11.5px;
    color: var(--text-3);
    font-family: var(--mono);
  }

  /* ── Card footer ── */
  .ch-card__footer {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
  }

  .ch-card__user {
    margin-left: auto;
    font-size: 12.5px;
    color: var(--text-3);
    font-weight: 500;
  }

  /* ── Track link ── */
  .ch-link {
    font-size: 13px;
    font-weight: 600;
    color: var(--green);
    text-decoration: none;
    transition: color 120ms;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .ch-link:hover { color: var(--green-hover); text-decoration: underline; }

  /* ── Empty ── */
  .ch-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 72px 20px;
    text-align: center;
    gap: 10px;
  }

  .ch-empty__icon  { font-size: 48px; opacity: .45; line-height: 1; }
  .ch-empty__title { font-size: 16px; font-weight: 700; color: var(--text-2); }
  .ch-empty__sub   { font-size: 13.5px; color: var(--text-3); }

  /* ── Error ── */
  .ch-error {
    background: var(--danger-soft);
    border: 1px solid #fecaca;
    border-radius: var(--r-lg);
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ch-error__msg   { font-size: 14px; font-weight: 600; color: var(--danger); }
  .ch-error__code  { font-size: 12px; color: var(--text-3); font-family: var(--mono); }

  .ch-error__actions { display: flex; gap: 8px; flex-wrap: wrap; }

  .ch-error__raw {
    margin-top: 4px;
    max-height: 200px;
    overflow: auto;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: 12px;
    font-family: var(--mono);
    font-size: 11.5px;
    color: var(--text-2);
    line-height: 1.6;
    white-space: pre-wrap;
  }

  /* ── Skeleton ── */
  .ch-skeleton {
    background: linear-gradient(90deg, #eaeeed 0%, #f5f8f6 50%, #eaeeed 100%);
    background-size: 200% 100%;
    animation: ch-shimmer 1.3s ease infinite;
    border-radius: var(--r-sm);
  }

  @keyframes ch-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }

  .ch-skeleton-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 16px 18px;
  }

  .ch-skeleton-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

/* ─────────────────────────── Helpers ─────────────────────────── */
function badgeStyle(status?: string): React.CSSProperties {
  const s = (status ?? "").toLowerCase();
  if (s === "collected" || s === "completed") return { background: "#dcfce7", color: "#15803d" };
  if (s === "pending") return { background: "#fef9c3", color: "#854d0e" };
  if (s === "scheduled" || s === "assigned") return { background: "#dbeafe", color: "#1d4ed8" };
  if (s === "cancelled" || s === "failed") return { background: "#fee2e2", color: "#b91c1c" };
  return { background: "#f1f5f9", color: "#475569" };
}

/* ── Icon components (replace emoji) ── */
const smallIconStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  display: "inline-block",
  verticalAlign: "middle",
  marginRight: 8,
  flexShrink: 0,
};

const RefreshIcon: React.FC<{ spin?: boolean }> = ({ spin }) => (
  <svg style={{ ...smallIconStyle, transform: spin ? "rotate(90deg)" : undefined }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 12a8 8 0 1 0-2.3 5.3" />
    <polyline points="20 12 20 6 14 6" />
  </svg>
);

const WarningIcon: React.FC = () => (
  <svg style={smallIconStyle} viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12" y2="17" />
  </svg>
);

const InboxIcon: React.FC = () => (
  <svg style={{ width: 44, height: 44, display: "block" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6" />
    <polyline points="7 10 12 15 17 10" />
    <path d="M22 7H2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
  </svg>
);

const PinIcon: React.FC = () => (
  <svg style={smallIconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 10c0 6-9 11-9 11S3 16 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const UserIcon: React.FC = () => (
  <svg style={smallIconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const TrashIcon: React.FC = () => (
  <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

/* ── Waste-type icon (replaces wasteEmoji) ── */
function wasteIcon(type?: string): React.ReactNode {
  const t = (type ?? "").toLowerCase();
  if (t.includes("plastic")) {
    return (
      <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 15v4h-4" />
        <path d="M3 9v-4h4" />
        <path d="M14 3l-2 4" />
        <path d="M10 21l2-4" />
      </svg>
    );
  }
  if (t.includes("paper")) {
    return (
      <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    );
  }
  if (t.includes("metal")) {
    return (
      <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    );
  }
  if (t.includes("glass")) {
    return (
      <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M7 21h10" />
        <path d="M9 21V7a3 3 0 0 1 6 0v14" />
        <path d="M9 7h6" />
      </svg>
    );
  }
  if (t.includes("organic") || t.includes("food")) {
    return (
      <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 7c0 7-9 13-9 13S3 13 3 6a9 9 0 0 1 18 1z" />
        <path d="M8.5 10.5c2.2-1.8 4.2-2.1 6.5-2.4" />
      </svg>
    );
  }
  if (t.includes("e-waste") || t.includes("electronic") || t.includes("laptop") || t.includes("phone")) {
    return (
      <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path d="M2 18h20" />
      </svg>
    );
  }
  return <TrashIcon />;
}

/* Resolve media URLs — prefer api.defaults.baseURL when provided */
function resolveUrl(src?: string | null): string | null {
  if (!src) return null;
  const s = String(src).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return window.location.protocol + s;
  const base = (api.defaults && (api.defaults.baseURL as string)) || "";
  if (base) {
    try {
      const b = base.endsWith("/") ? base.slice(0, -1) : base;
      if (s.startsWith("/")) return `${b}${s}`;
      return `${b}/${s}`;
    } catch {
      // fallback
    }
  }
  if (s.startsWith("/")) return window.location.origin + s;
  return window.location.origin + "/" + s;
}

/* ─────────────────────────── Types ─────────────────────────── */
type Pickup = {
  _id: string;
  wasteType?: string;
  quantity?: number;
  status?: string;
  createdAt?: string;
  location?: string;
  user?: { name?: string; phone?: string; address?: string };
  image?: string | null;
  imageUrl?: string | null;
  [k: string]: any;
};

/* ─────────────────────────── Thumbnail component ─────────────────────────── */
function Thumbnail({ src, alt, fallbackIcon }: { src?: string | null; alt?: string; fallbackIcon?: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveUrl(src ?? "") ?? src ?? "";

  if (!resolved || failed) {
    return <div className="ch-icon" aria-hidden>{fallbackIcon ?? wasteIcon(alt)}</div>;
  }

  return (
    <div className="ch-icon" aria-hidden>
      <img src={resolved} alt={alt ?? "image"} onError={() => setFailed(true)} />
    </div>
  );
}

/* ─────────────────────────── Status helpers (UPDATED) ─────────────────────────── */
const normalizeStatus = (status?: string) => String(status ?? "").trim().toLowerCase();

const isCompletedStatus = (status?: string) => {
  const s = normalizeStatus(status);
  return s === "completed" || s === "collected";
};

const isPendingStatus = (status?: string) => {
  const s = normalizeStatus(status);
  return s === "pending";
};

// Only keep items that are completed/collected OR pending
const filterItems = (items: Pickup[]) => {
  return items.filter((p) => {
    const s = normalizeStatus(p.status);
    return s === "completed" || s === "collected" || s === "pending";
  });
};

/* ─────────────────────────── Component ─────────────────────────── */
export default function CollectorHistory(): React.ReactElement {
  const [items, setItems] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [rawError, setRawError] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true); setError(null); setStatusCode(null); setRawError(null);
    try {
      const res = await api.get("/collector/history");
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      const normalized: Pickup[] = data.map((d: any) => ({
        _id: d._id ?? d.id ?? String(Math.random()).slice(2),
        wasteType: d.wasteType ?? d.type ?? d.category,
        quantity: d.quantity ?? d.qty ?? 0,
        status: d.status ?? "pending",
        createdAt: d.createdAt ?? d.created_at,
        location: d.location ?? d.address ?? d.place,
        user: d.user ?? d.requester,
        image: d.image ?? d.imageUrl ?? d.photo ?? null,
        imageUrl: d.imageUrl ?? d.image ?? d.photo ?? null,
        ...d,
      }));
      setItems(normalized);
    } catch (err: any) {
      if (!err?.response) {
        setError("Unable to reach server. Is the backend running?");
        setRawError(err?.message ?? err);
      } else {
        const code = err.response.status;
        setStatusCode(code);
        if (code === 401) {
          setError("Not authenticated. Please login again.");
          try { ["token", "accessToken", "user", "role"].forEach((k) => localStorage.removeItem(k)); } catch {}
          setTimeout(() => navigate("/login"), 900);
        } else if (code === 403) {
          setError("Forbidden. Your account does not have permission to view this history.");
        } else if (code === 404) {
          setError("History endpoint not found on server (404). Check backend routes.");
        } else {
          setError(err.response?.data?.message ?? JSON.stringify(err.response?.data) ?? err.message ?? "Failed to load history");
        }
        setRawError(err.response?.data ?? err.response);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Skeletons = () => (
    <div style={{ display: "grid", gap: 10 }}>
      {[0,1,2,3,4].map((i) => (
        <div key={i} className="ch-skeleton-card">
          <div className="ch-skeleton-row">
            <div className="ch-skeleton" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="ch-skeleton" style={{ height: 13, marginBottom: 8, width: "42%" }} />
              <div className="ch-skeleton" style={{ height: 11, width: "62%" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <div className="ch-skeleton" style={{ width: 72, height: 22, borderRadius: 999 }} />
              <div className="ch-skeleton" style={{ width: 80, height: 11 }} />
            </div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
            <div className="ch-skeleton" style={{ width: 96, height: 30, borderRadius: 8 }} />
            <div className="ch-skeleton" style={{ width: 56, height: 30, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );

  // Filter items to show ONLY completed/collected OR pending
  const filteredItems = filterItems(items);
  const completedItems = filteredItems.filter((p) => isCompletedStatus(p.status));
  const pendingItems = filteredItems.filter((p) => isPendingStatus(p.status));

  return (
    <>
      <style>{css}</style>
      <div className="ch-root">
        <CollectorSidebar />

        <main className="ch-main">
          <div className="ch-inner">

            <div className="ch-header">
              <div>
                <h2 className="ch-title">Pickup History</h2>
                <p className="ch-sub">All your past and current pickup assignments</p>
              </div>
              {!loading && !error && filteredItems.length > 0 && (
                <span className="ch-count">{filteredItems.length} records</span>
              )}
            </div>

            {loading && <Skeletons />}

            {!loading && error && (
              <div className="ch-error">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <WarningIcon />
                  <div className="ch-error__msg">{error}</div>
                </div>

                {statusCode && <div className="ch-error__code">HTTP {statusCode}</div>}

                <div className="ch-error__actions">
                  <button className="ch-btn ch-btn--primary" onClick={load}><RefreshIcon /> Retry</button>
                  <button className="ch-btn" onClick={() => window.open(`${(window as any).__API_BASE__ || ""}/collector/history`, "_blank")}>
                    Open endpoint ↗
                  </button>
                  <button className="ch-btn" onClick={() => setShowDetails((s) => !s)}>
                    {showDetails ? "Hide details" : "Show details"}
                  </button>
                </div>

                {showDetails && (
                  <pre className="ch-error__raw">
                    <strong>HTTP status:</strong> {statusCode ?? "N/A"}{"\n\n"}
                    <strong>Raw response:</strong>{"\n"}
                    {typeof rawError === "string" ? rawError : JSON.stringify(rawError, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {!loading && !error && filteredItems.length === 0 && (
              <div className="ch-empty">
                <div className="ch-empty__icon" aria-hidden>
                  <InboxIcon />
                </div>
                <div className="ch-empty__title">No pickup history yet</div>
                <div className="ch-empty__sub">Completed and pending pickups will appear here</div>
              </div>
            )}

            {!loading && !error && completedItems.length > 0 && (
              <>
                <h3 style={{ marginTop: 12 }}>Completed / Collected</h3>
                <ul className="ch-list" aria-label="Completed pickups">
                  {completedItems.map((p, idx) => (
                    <li key={p._id} className="ch-card" style={{ animationDelay: `${Math.min(idx * 40, 280)}ms` }}>
                      <div className="ch-card__top">
                        <div className="ch-card__left">
                          <Thumbnail src={p.imageUrl ?? p.image ?? null} alt={p.wasteType} fallbackIcon={wasteIcon(p.wasteType)} />

                          <div className="ch-card__meta">
                            <div className="ch-card__type">{p.wasteType ?? "Unknown"}</div>
                            <div className="ch-card__info">
                              <span>{p.quantity ?? 0} kg</span>
                              {p.location && (
                                <>
                                  <span className="ch-card__info-sep">·</span>
                                  <span><PinIcon />{p.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="ch-card__right">
                          <span className="ch-badge" style={badgeStyle(p.status)}>
                            {p.status ?? "unknown"}
                          </span>
                          <span className="ch-card__time">
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                          </span>
                        </div>
                      </div>

                      <div className="ch-card__footer">
                        <button className="ch-btn ch-btn--primary ch-btn--sm" onClick={() => navigate(`/collector/history/${p._id}`)}>
                          View details
                        </button>

                        <Link to={`/track/${p._id}`} className="ch-link">
                          ↗ Track
                        </Link>

                        {p.user?.name && (
                          <span className="ch-card__user"><UserIcon />{p.user.name}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {!loading && !error && pendingItems.length > 0 && (
              <>
                <h3 style={{ marginTop: 20 }}>Pending</h3>
                <ul className="ch-list" aria-label="Pending pickups">
                  {pendingItems.map((p, idx) => (
                    <li key={p._id} className="ch-card" style={{ animationDelay: `${Math.min(idx * 40, 280)}ms` }}>
                      <div className="ch-card__top">
                        <div className="ch-card__left">
                          <Thumbnail src={p.imageUrl ?? p.image ?? null} alt={p.wasteType} fallbackIcon={wasteIcon(p.wasteType)} />

                          <div className="ch-card__meta">
                            <div className="ch-card__type">{p.wasteType ?? "Unknown"}</div>
                            <div className="ch-card__info">
                              <span>{p.quantity ?? 0} kg</span>
                              {p.location && (
                                <>
                                  <span className="ch-card__info-sep">·</span>
                                  <span><PinIcon />{p.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="ch-card__right">
                          <span className="ch-badge" style={badgeStyle(p.status)}>{p.status ?? "unknown"}</span>
                          <span className="ch-card__time">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</span>
                        </div>
                      </div>

                      <div className="ch-card__footer">
                        <button className="ch-btn ch-btn--primary ch-btn--sm" onClick={() => navigate(`/collector/history/${p._id}`)}>
                          View details
                        </button>

                        <Link to={`/track/${p._id}`} className="ch-link">
                          ↗ Track
                        </Link>

                        {p.user?.name && (
                          <span className="ch-card__user"><UserIcon />{p.user.name}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

          </div>
        </main>
      </div>
    </>
  );
}