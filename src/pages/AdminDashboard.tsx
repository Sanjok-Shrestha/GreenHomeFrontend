// src/pages/AdminDashboard.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import AdminSidebar from "../components/AdminSidebar";

/* ─────────────────────────── Styles ─────────────────────────── */
/* (unchanged — full CSS as in your original file) */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --bg:           #f0f2f7;
    --surface:      #ffffff;
    --surface-2:    #f6f8fb;
    --surface-3:    #eef1f8;
    --border:       #e3e8f0;
    --border-2:     #cdd4e2;
    --blue:         #2563eb;
    --blue-hover:   #1d4ed8;
    --blue-soft:    #eff6ff;
    --blue-glow:    rgba(37,99,235,.15);
    --green:        #16a34a;
    --green-soft:   #f0fdf4;
    --red:          #dc2626;
    --red-soft:     #fef2f2;
    --amber:        #d97706;
    --amber-soft:   #fffbeb;
    --text-1:       #0f172a;
    --text-2:       #475569;
    --text-3:       #94a3b8;
    --mono:         'Geist Mono', 'IBM Plex Mono', monospace;
    --font:         'Geist', system-ui, sans-serif;
    --ease:         cubic-bezier(.4,0,.2,1);
    --ease-spring:  cubic-bezier(.34,1.26,.64,1);
    --r-sm:         7px;
    --r-md:         11px;
    --r-lg:         15px;
    --r-xl:         19px;
    --sh-sm:        0 1px 3px rgba(0,0,0,.05), 0 1px 2px rgba(0,0,0,.04);
    --sh-md:        0 4px 16px rgba(0,0,0,.07), 0 2px 6px rgba(0,0,0,.04);
    --sh-lg:        0 20px 48px rgba(0,0,0,.1), 0 6px 16px rgba(0,0,0,.05);
  }

  /* ── Page ── */
  .ad-page {
    padding: 32px 28px 56px;
    max-width: 1240px;
    margin: 0 auto;
    font-family: var(--font);
    color: var(--text-1);
    -webkit-font-smoothing: antialiased;
    animation: ad-in 280ms var(--ease) both;
  }

  @keyframes ad-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Header ── */
  .ad-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }

  .ad-header__title {
    margin: 0 0 4px;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--text-1);
  }

  .ad-header__sub {
    font-size: 13.5px;
    color: var(--text-2);
  }

  .ad-search {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .ad-search__input {
    padding: 9px 14px;
    border-radius: var(--r-md);
    border: 1.5px solid var(--border);
    background: var(--surface);
    font-family: var(--font);
    font-size: 13.5px;
    color: var(--text-1);
    min-width: 290px;
    outline: none;
    transition: border-color 140ms, box-shadow 140ms;
  }

  .ad-search__input::placeholder { color: var(--text-3); }

  .ad-search__input:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px var(--blue-soft);
  }

  /* ── Buttons ── */
  .ad-btn {
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
    transition: border-color 130ms, background 130ms, transform 130ms var(--ease), box-shadow 130ms;
    outline: none;
    white-space: nowrap;
  }

  .ad-btn:hover:not(:disabled) {
    border-color: var(--border-2);
    background: var(--surface-2);
    transform: translateY(-1px);
    box-shadow: var(--sh-sm);
  }

  .ad-btn:active:not(:disabled) { transform: translateY(0); }
  .ad-btn:disabled { opacity: .45; cursor: not-allowed; }

  .ad-btn--primary {
    background: var(--blue);
    border-color: var(--blue);
    color: #fff;
  }

  .ad-btn--primary:hover:not(:disabled) {
    background: var(--blue-hover);
    border-color: var(--blue-hover);
    box-shadow: 0 4px 14px var(--blue-glow);
  }

  .ad-btn--danger {
    background: var(--red);
    border-color: var(--red);
    color: #fff;
  }

  .ad-btn--danger:hover:not(:disabled) {
    background: #b91c1c;
    border-color: #b91c1c;
    box-shadow: 0 4px 12px rgba(220,38,38,.2);
  }

  .ad-btn--green {
    background: var(--green);
    border-color: var(--green);
    color: #fff;
  }

  .ad-btn--green:hover:not(:disabled) {
    background: #15803d;
    border-color: #15803d;
  }

  .ad-btn--sm { padding: 5px 10px; font-size: 12px; border-radius: var(--r-sm); }
  .ad-btn--wide { width: 100%; justify-content: flex-start; }

  /* ── KPI strip ── */
  .ad-kpis {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 22px;
  }

  .ad-kpi {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 16px 18px;
    box-shadow: var(--sh-sm);
    position: relative;
    overflow: hidden;
    transition: transform 150ms var(--ease), box-shadow 150ms;
    animation: ad-kpi-in 350ms var(--ease-spring) both;
  }

  .ad-kpi:nth-child(1) { animation-delay:  40ms; }
  .ad-kpi:nth-child(2) { animation-delay:  80ms; }
  .ad-kpi:nth-child(3) { animation-delay: 120ms; }
  .ad-kpi:nth-child(4) { animation-delay: 160ms; }

  @keyframes ad-kpi-in {
    from { opacity: 0; transform: translateY(12px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .ad-kpi:hover { transform: translateY(-2px); box-shadow: var(--sh-md); }

  .ad-kpi::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: linear-gradient(90deg, var(--blue), #60a5fa);
    border-radius: var(--r-xl) var(--r-xl) 0 0;
  }

  .ad-kpi__value {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.8px;
    color: var(--text-1);
    font-family: var(--mono);
    margin-bottom: 6px;
    line-height: 1;
  }

  .ad-kpi__label {
    font-size: 11.5px;
    color: var(--text-3);
    font-weight: 600;
    letter-spacing: .4px;
    text-transform: uppercase;
  }

  /* ── Grid ── */
  .ad-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 14px;
  }

  @media (max-width: 900px) { .ad-grid { grid-template-columns: 1fr; } }

  .ad-col { display: flex; flex-direction: column; gap: 14px; }

  /* ── Card ── */
  .ad-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 18px 20px;
    box-shadow: var(--sh-sm);
    transition: box-shadow 150ms;
  }

  .ad-card:hover { box-shadow: var(--sh-md); }

  .ad-card__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }

  .ad-card__title {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.1px;
    color: var(--text-1);
  }

  .ad-card__meta {
    font-size: 12px;
    color: var(--text-3);
    font-family: var(--mono);
  }

  /* ── Table ── */
  .ad-table-wrap {
    border-radius: var(--r-md);
    border: 1px solid var(--border);
    overflow: hidden;
  }

  .ad-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .ad-table thead tr {
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
  }

  .ad-table th {
    padding: 9px 13px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .5px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .ad-table tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background 110ms;
  }

  .ad-table tbody tr:last-child { border-bottom: none; }
  .ad-table tbody tr:hover { background: var(--surface-2); }

  .ad-table td {
    padding: 10px 13px;
    color: var(--text-2);
    vertical-align: middle;
  }

  .ad-table td:nth-child(2) {
    font-family: var(--mono);
    font-weight: 600;
    color: var(--text-1);
  }

  .ad-table__actions { display: flex; gap: 6px; }

  /* ── Report list ── */
  .ad-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    border-radius: var(--r-md);
    border: 1px solid var(--border);
    overflow: hidden;
  }

  .ad-list__item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    padding: 11px 14px;
    border-bottom: 1px solid var(--border);
    transition: background 110ms;
  }

  .ad-list__item:last-child { border-bottom: none; }
  .ad-list__item:hover { background: var(--surface-2); }

  .ad-list__title {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-1);
    margin-bottom: 3px;
  }

  .ad-list__sub {
    font-size: 12px;
    color: var(--text-3);
    font-family: var(--mono);
  }

  .ad-list__right { text-align: right; flex-shrink: 0; }
  .ad-list__pts {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-1);
    font-family: var(--mono);
  }

  /* ── Badge ── */
  .ad-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: .2px;
    text-transform: capitalize;
    white-space: nowrap;
  }

  /* ── Quick actions ── */  
  .ad-qa {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .ad-qa__btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 14px;
    border-radius: var(--r-md);
    border: 1.5px solid var(--border);
    background: var(--surface-2);
    color: var(--text-1);
    font-family: var(--font);
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 130ms, background 130ms, transform 130ms var(--ease);
    outline: none;
    text-align: left;
  }

  .ad-qa__btn:hover {
    border-color: var(--blue);
    background: var(--blue-soft);
    color: var(--blue);
    transform: translateX(3px);
  }

  .ad-qa__arrow { font-size: 14px; opacity: .5; transition: opacity 130ms, transform 130ms; }
  .ad-qa__btn:hover .ad-qa__arrow { opacity: 1; transform: translateX(2px); }

  /* ── Footer ── */
  .ad-footer {
    margin-top: 24px;
    padding-top: 18px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .ad-footer__label {
    font-size: 13px;
    color: var(--text-3);
    font-family: var(--mono);
  }

  .ad-footer__actions { display: flex; gap: 8px; }

  /* ── Skeleton ── */
  .ad-skeleton {
    background: linear-gradient(90deg, #eaecf1 0%, #f4f6fb 50%, #eaecf1 100%);
    background-size: 200% 100%;
    animation: ad-shimmer 1.3s ease infinite;
    border-radius: var(--r-sm);
  }

  @keyframes ad-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }

  /* ── Status / error ── */
  .ad-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    border-radius: var(--r-md);
    background: var(--red-soft);
    border: 1px solid #fecaca;
    color: var(--red);
    font-size: 13px;
  }

  .ad-empty {
    padding: 20px;
    text-align: center;
    font-size: 13px;
    color: var(--text-3);
  }

  /* ── Toast ── */
  .ad-toast {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 9999;
    animation: ad-toast-in 220ms var(--ease-spring) both;
  }

  @keyframes ad-toast-in {
    from { opacity: 0; transform: translateY(10px) scale(.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .ad-toast__inner {
    padding: 11px 18px;
    border-radius: var(--r-md);
    background: var(--text-1);
    color: #fff;
    font-family: var(--font);
    font-size: 13.5px;
    font-weight: 500;
    box-shadow: var(--sh-md);
  }

  /* ── Divider ── */
  .ad-gap { height: 4px; }
`;

/* ─────────────────────────── Helpers ─────────────────────────── */
function badgeStyle(status?: string): React.CSSProperties {
  const s = (status ?? "").toLowerCase();
  if (s === "open"     || s === "pending")  return { background: "#fef3c7", color: "#b45309" };
  if (s === "approved" || s === "active")   return { background: "#dcfce7", color: "#15803d" };
  if (s === "closed"   || s === "resolved") return { background: "#f1f5f9", color: "#475569" };
  if (s === "disabled" || s === "inactive") return { background: "#fee2e2", color: "#b91c1c" };
  return { background: "#f1f5f9", color: "#475569" };
}

/* ─────────────────────────── Types ─────────────────────────── */
type Overview = {
  collectorsPending?: number; reportsOpen?: number;
  activeUsers?: number;       revenueThisMonth?: number;
};
type CollectorRow = {
  _id: string; name?: string; email?: string; phone?: string;
  earnings?: number; active?: boolean; status?: string; createdAt?: string;
};
type ReportRow = {
  _id: string; title?: string; createdAt?: string;
  status?: string; user?: { name?: string; email?: string };
};
type RedemptionRow = {
  _id: string; user?: { name?: string; email?: string };
  title?: string; cost?: number; status?: string; createdAt?: string;
};

/* ─────────────────────────── Component ─────────────────────────── */
const AdminDashboard: FC = () => {
  const navigate = useNavigate();

  const [overview,           setOverview]           = useState<Overview | null>(null);
  const [loadingOverview,    setLoadingOverview]     = useState(false);
  const [topCollectors,      setTopCollectors]       = useState<CollectorRow[]>([]);
  const [loadingCollectors,  setLoadingCollectors]   = useState(false);
  const [collectorsError,    setCollectorsError]     = useState<string | null>(null);
  const [reports,            setReports]             = useState<ReportRow[]>([]);
  const [loadingReports,     setLoadingReports]      = useState(false);
  const [redemptions,        setRedemptions]         = useState<RedemptionRow[]>([]);
  const [loadingRedemptions, setLoadingRedemptions]  = useState(false);
  const [searchQuery,        setSearchQuery]         = useState("");
  const [toast,              setToast]               = useState<string | null>(null);

  /* fetches */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingOverview(true);
      try {
        // FIXED: remove duplicate '/api' prefix (api baseURL already '/api')
        const res = await api.get("/admin/overview");
        if (mounted) setOverview(res.data ?? null);
      } catch {}
      finally { if (mounted) setLoadingOverview(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const loadTopCollectors = useCallback(async (limit = 6) => {
    setLoadingCollectors(true); setCollectorsError(null);
    try {
      const res = await api.get(`/admin/collectors?limit=${limit}`);
      const arr = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setTopCollectors(arr.slice(0, limit));
    } catch (err: any) {
      setTopCollectors([]);
      setCollectorsError(err?.response?.data?.message || "Failed to load top collectors");
    } finally { setLoadingCollectors(false); }
  }, []);
  useEffect(() => { loadTopCollectors(); }, [loadTopCollectors]);

  const loadReports = useCallback(async (limit = 6) => {
    setLoadingReports(true);
    try {
      const res = await api.get(`/admin/reports?limit=${limit}`);
      setReports(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch { setReports([]); }
    finally { setLoadingReports(false); }
  }, []);
  useEffect(() => { loadReports(); }, [loadReports]);

  const loadRedemptions = useCallback(async (limit = 6) => {
    setLoadingRedemptions(true);
    try {
      const res = await api.get(`/admin/redemptions?limit=${limit}`);
      setRedemptions(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch { setRedemptions([]); }
    finally { setLoadingRedemptions(false); }
  }, []);
  useEffect(() => { loadRedemptions(); }, [loadRedemptions]);

  const showToast = useCallback((msg: string, ttl = 2500) => {
    setToast(msg);
    setTimeout(() => setToast(null), ttl);
  }, []);

  const approveCollector = useCallback(async (id: string) => {
    try {
      // FIXED: no duplicate /api
      const res = await api.post(`/admin/collectors/${id}/approve`);
      const updated = res.data?.collector ?? null;
      if (updated) setTopCollectors((p) => p.map((c) => c._id === id ? { ...c, ...updated } : c));
      else await loadTopCollectors();
      showToast("Collector approved");
    } catch (err: any) { showToast(err?.response?.data?.message || "Failed to approve"); }
  }, [loadTopCollectors, showToast]);

  const toggleActive = useCallback(async (id: string, current?: boolean) => {
    try {
      // FIXED: no duplicate /api
      const res = await api.patch(`/admin/collectors/${id}/active`, { active: !current });
      const updated = res.data?.collector ?? null;
      if (updated) setTopCollectors((p) => p.map((c) => c._id === id ? { ...c, ...updated } : c));
      else await loadTopCollectors();
      showToast("Collector updated");
    } catch (err: any) { showToast(err?.response?.data?.message || "Failed to update collector"); }
  }, [loadTopCollectors, showToast]);

  const onSearch = useCallback(() => {
    if (!searchQuery.trim()) { showToast("Enter a search query"); return; }
    navigate(`/admin/users?query=${encodeURIComponent(searchQuery.trim())}`);
  }, [navigate, searchQuery, showToast]);

  const stats = useMemo(() => [
    { label: "Collectors Pending", value: overview?.collectorsPending ?? "—" },
    { label: "Open Reports",       value: overview?.reportsOpen        ?? "—" },
    { label: "Active Users",       value: overview?.activeUsers        ?? "—" },
    { label: "Revenue (Month)",    value: overview?.revenueThisMonth ? `₹${overview.revenueThisMonth}` : "—" },
  ], [overview]);

  return (
    <>
      <style>{css}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
        <AdminSidebar />

        <div className="ad-page">
          {/* ── Header ── */}
          <header className="ad-header">
            <div>
              <h1 className="ad-header__title">Admin Dashboard</h1>
              <p className="ad-header__sub">Overview of system activity and quick admin actions</p>
            </div>

            <div className="ad-search">
              <input
                className="ad-search__input"
                placeholder="Search users by name or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
              />
              <button className="ad-btn ad-btn--primary" onClick={onSearch}>Search</button>

              <button
                className="ad-btn ad-btn--green"
                onClick={() => navigate("/admin/certificates/create")}
                title="Create a new certificate"
              >
                Create certificate
              </button>
            </div>
          </header>

          {/* ── KPI strip ── */}
          {loadingOverview ? (
            <div className="ad-kpis">
              {[0,1,2,3].map((i) => <div key={i} className="ad-skeleton" style={{ height: 80 }} />)}
            </div>
          ) : (
            <section className="ad-kpis" aria-label="Overview stats">
              {stats.map((s) => (
                <div key={s.label} className="ad-kpi">
                  <div className="ad-kpi__value">{s.value}</div>
                  <div className="ad-kpi__label">{s.label}</div>
                </div>
              ))}
            </section>
          )}

          {/* ── Main grid ── */}
          <section className="ad-grid">

            {/* Left column */}
            <div className="ad-col">

              {/* Top collectors */}
              <div className="ad-card">
                <div className="ad-card__head">
                  <span className="ad-card__title">Top Collectors</span>
                  <span className="ad-card__meta">
                    {loadingCollectors ? "Loading…" : `${topCollectors.length} shown`}
                  </span>
                </div>

                {collectorsError ? (
                  <div className="ad-error">⚠ {collectorsError}</div>
                ) : loadingCollectors ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[0,1,2].map((i) => <div key={i} className="ad-skeleton" style={{ height: 38 }} />)}
                  </div>
                ) : topCollectors.length === 0 ? (
                  <div className="ad-empty">No collectors found.</div>
                ) : (
                  <div className="ad-table-wrap">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Earnings</th>
                          <th>Joined</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCollectors.map((c) => (
                          <tr key={c._id}>
                            <td style={{ fontWeight: 600, color: "var(--text-1)" }}>{c.name ?? c.email ?? "—"}</td>
                            <td>₹{c.earnings ?? 0}</td>
                            <td style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                            </td>
                            <td>
                              <span className="ad-badge" style={badgeStyle(c.status ?? (c.active ? "active" : "pending"))}>
                                {(c.status ?? (c.active ? "active" : "pending")).toLowerCase()}
                              </span>
                            </td>
                            <td>
                              <div className="ad-table__actions">
                                {((c.status ?? "").toLowerCase() === "pending" || !c.active) && (
                                  <button className="ad-btn ad-btn--sm ad-btn--green"
                                    onClick={() => approveCollector(c._id)}>
                                    Approve
                                  </button>
                                )}
                                <button className="ad-btn ad-btn--sm"
                                  onClick={() => toggleActive(c._id, c.active)}>
                                  {c.active ? "Disable" : "Enable"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                  <button className="ad-btn" onClick={() => navigate("/admin/collectors")}>
                    View all collectors →
                  </button>
                </div>
              </div>

              {/* Recent reports */}
              <div className="ad-card">
                <div className="ad-card__head">
                  <span className="ad-card__title">Recent Reports</span>
                  <span className="ad-card__meta">
                    {loadingReports ? "Loading…" : `${reports.length} shown`}
                  </span>
                </div>

                {loadingReports ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[0,1,2].map((i) => <div key={i} className="ad-skeleton" style={{ height: 48 }} />)}
                  </div>
                ) : reports.length === 0 ? (
                  <div className="ad-empty">No reports found.</div>
                ) : (
                  <ul className="ad-list">
                    {reports.map((r) => (
                      <li key={r._id} className="ad-list__item">
                        <div>
                          <div className="ad-list__title">{r.title ?? "Report"}</div>
                          <div className="ad-list__sub">
                            {r.user?.name ?? r.user?.email ?? "—"}
                            {r.createdAt && ` • ${new Date(r.createdAt).toLocaleDateString()}`}
                          </div>
                        </div>
                        <span className="ad-badge" style={badgeStyle(r.status)}>
                          {r.status ?? "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                  <button className="ad-btn" onClick={() => navigate("/admin/reports")}>
                    View all reports →
                  </button>
                </div>
              </div>
            </div>

            {/* Right column */}
            <aside className="ad-col">
              {/* Recent redemptions */}
              <div className="ad-card">
                <div className="ad-card__head">
                  <span className="ad-card__title">Recent Redemptions</span>
                  <span className="ad-card__meta">
                    {loadingRedemptions ? "Loading…" : `${redemptions.length} shown`}
                  </span>
                </div>

                {loadingRedemptions ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[0,1,2].map((i) => <div key={i} className="ad-skeleton" style={{ height: 48 }} />)}
                  </div>
                ) : redemptions.length === 0 ? (
                  <div className="ad-empty">No redemption activity yet.</div>
                ) : (
                  <ul className="ad-list">
                    {redemptions.map((r) => (
                      <li key={r._id} className="ad-list__item">
                        <div>
                          <div className="ad-list__title">{r.title ?? "—"}</div>
                          <div className="ad-list__sub">{r.user?.name ?? r.user?.email ?? "—"}</div>
                        </div>
                        <div className="ad-list__right">
                          <div className="ad-list__pts">{r.cost ?? "—"} pts</div>
                          <span className="ad-badge" style={badgeStyle(r.status)}>
                            {r.status ?? "—"}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                  <button className="ad-btn" onClick={() => navigate("/admin/redemptions")}>
                    Manage →
                  </button>
                </div>
              </div>
            </aside>
          </section>

          {/* ── Footer ── */}
          <footer className="ad-footer">
            <span className="ad-footer__label">signed in as admin</span>
            <div className="ad-footer__actions">
              <button className="ad-btn"
                onClick={() => { localStorage.clear(); showToast("Local cache cleared"); }}>
                Clear cache
              </button>
              <button className="ad-btn ad-btn--danger"
                onClick={() => { localStorage.clear(); navigate("/login", { replace: true }); }}>
                Sign out
              </button>
            </div>
          </footer>

          {/* ── Toast ── */}
          {toast && (
            <div className="ad-toast" role="status" aria-live="polite">
              <div className="ad-toast__inner">{toast}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;