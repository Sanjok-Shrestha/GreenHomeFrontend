// src/pages/CollectorDashboard.tsx
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type JSX,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import CollectorSidebar from "../components/CollectorSidebar";

/* ─────────────────────────── Styles ─────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --bg:           #f1f4f2;
    --surface:      #ffffff;
    --surface-2:    #f7faf8;
    --surface-3:    #edf6f0;
    --border:       #e3eae5;
    --border-2:     #ccd9d0;
    --green:        #18a34a;
    --green-2:      #22c55e;
    --green-soft:   #e8f5ed;
    --green-glow:   rgba(24,163,74,.18);
    --text-1:       #0d1f15;
    --text-2:       #4b6358;
    --text-3:       #8fa89a;
    --danger:       #dc2626;
    --warn:         #d97706;
    --warn-soft:    #fef9ee;
    --mono:         'IBM Plex Mono', monospace;
    --font:         'Plus Jakarta Sans', system-ui, sans-serif;
    --ease:         cubic-bezier(.4,0,.2,1);
    --ease-spring:  cubic-bezier(.34,1.28,.64,1);
    --r-sm:         8px;
    --r-md:         12px;
    --r-lg:         16px;
    --r-xl:         20px;
    --sh-sm:        0 1px 4px rgba(0,0,0,.05), 0 1px 2px rgba(0,0,0,.04);
    --sh-md:        0 6px 20px rgba(0,0,0,.07), 0 2px 6px rgba(0,0,0,.04);
    --sh-lg:        0 20px 48px rgba(0,0,0,.1), 0 6px 16px rgba(0,0,0,.05);
  }

  .cd-root {
    display: flex;
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--font);
    color: var(--text-1);
    -webkit-font-smoothing: antialiased;
  }

  .cd-main {
    flex: 1;
    padding: 32px 28px 48px;
    max-width: 1200px;
    min-width: 0;
    animation: cd-in 280ms var(--ease) both;
  }

  @keyframes cd-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .cd-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .cd-title {
    margin: 0 0 4px;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.4px;
    color: var(--text-1);
  }

  .cd-sub {
    font-size: 13.5px;
    color: var(--text-2);
  }

  .cd-header__right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .cd-kpis {
    display: flex;
    gap: 8px;
  }

  .cd-kpi {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: 10px 16px;
    text-align: center;
    box-shadow: var(--sh-sm);
    min-width: 100px;
    transition: transform 140ms var(--ease), box-shadow 140ms var(--ease);
    animation: cd-kpi-in 360ms var(--ease-spring) both;
  }

  .cd-kpi:nth-child(1) { animation-delay:  50ms; }
  .cd-kpi:nth-child(2) { animation-delay: 100ms; }
  .cd-kpi:nth-child(3) { animation-delay: 150ms; }

  .cd-kpi:hover { transform: translateY(-2px); box-shadow: var(--sh-md); }

  @keyframes cd-kpi-in {
    from { opacity: 0; transform: translateY(10px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .cd-kpi__value {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--text-1);
    font-family: var(--mono);
  }

  .cd-kpi__label {
    font-size: 11px;
    color: var(--text-3);
    margin-top: 3px;
    font-weight: 600;
    letter-spacing: .3px;
    text-transform: uppercase;
  }

  .cd-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--green), #0f7a35);
    color: #fff;
    border: none;
    font-family: var(--font);
    font-weight: 800;
    font-size: 16px;
    cursor: pointer;
    box-shadow: 0 4px 12px var(--green-glow);
    transition: transform 140ms var(--ease), box-shadow 140ms var(--ease);
    flex-shrink: 0;
  }

  .cd-avatar:hover {
    transform: scale(1.07);
    box-shadow: 0 6px 18px var(--green-glow);
  }

  .cd-grid {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .cd-col-left  { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 14px; }
  .cd-col-right { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; gap: 14px; }

  @media (max-width: 960px) {
    .cd-grid { flex-direction: column; }
    .cd-col-right { width: 100%; }
  }

  .cd-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 18px 20px;
    box-shadow: var(--sh-sm);
    transition: box-shadow 160ms var(--ease);
  }

  .cd-card:hover { box-shadow: var(--sh-md); }

  .cd-card__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }

  .cd-card__title {
    margin: 0;
    font-size: 14.5px;
    font-weight: 700;
    letter-spacing: -0.1px;
    color: var(--text-1);
  }

  .cd-card__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cd-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .cd-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: var(--r-md);
    border: 1px solid var(--border);
    background: var(--surface-2);
    transition: border-color 130ms, background 130ms, transform 130ms var(--ease);
    cursor: pointer;
  }

  .cd-item:hover {
    border-color: var(--border-2);
    background: var(--surface);
    transform: translateX(2px);
  }

  .cd-item__meta { flex: 1; min-width: 0; }

  .cd-item__title {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 3px;
  }

  .cd-item__sub {
    font-size: 12px;
    color: var(--text-2);
    font-family: var(--mono);
  }

  .cd-item__time {
    font-size: 11px;
    color: var(--text-3);
    margin-top: 3px;
  }

  .cd-item__aside {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .cd-item--v {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 14px;
  }

  .cd-item--v:hover { transform: none; }

  .cd-item--v .cd-item__meta { width: 100%; }
  .cd-item--v .cd-item__aside {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .cd-badge {
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

  .cd-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 13px;
    border-radius: var(--r-sm);
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

  .cd-btn:hover:not(:disabled) {
    border-color: var(--border-2);
    background: var(--surface-2);
    transform: translateY(-1px);
    box-shadow: var(--sh-sm);
  }

  .cd-btn:active:not(:disabled) { transform: translateY(0); }
  .cd-btn:disabled { opacity: .45; cursor: not-allowed; }

  .cd-btn--primary {
    background: var(--green);
    border-color: var(--green);
    color: #fff;
  }

  .cd-btn--primary:hover:not(:disabled) {
    background: #15903f;
    border-color: #15903f;
    box-shadow: 0 4px 14px var(--green-glow);
  }

  .cd-btn--sm { padding: 5px 10px; font-size: 12px; }

  .cd-link {
    font-size: 13px;
    font-weight: 600;
    color: var(--green);
    text-decoration: none;
    transition: color 120ms;
  }
  .cd-link:hover { color: #15903f; text-decoration: underline; }

  .cd-tips {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cd-tips li {
    display: flex;
    gap: 9px;
    align-items: flex-start;
    font-size: 13px;
    color: var(--text-2);
    line-height: 1.5;
  }

  .cd-tips li::before {
    content: '✓';
    font-size: 11px;
    font-weight: 700;
    color: var(--green);
    background: var(--green-soft);
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .cd-skeleton {
    background: linear-gradient(90deg, #eaede9 0%, #f4f6f3 50%, #eaede9 100%);
    background-size: 200% 100%;
    animation: cd-shimmer 1.3s ease infinite;
    border-radius: var(--r-sm);
  }

  @keyframes cd-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }

  .cd-skeleton-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .cd-empty {
    font-size: 13px;
    color: var(--text-3);
    padding: 10px 0;
    text-align: center;
  }

  .cd-error {
    font-size: 13px;
    color: var(--danger);
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--r-sm);
    padding: 10px 14px;
    margin-top: 4px;
  }

  .cd-divider {
    height: 1px;
    background: var(--border);
    margin: 14px 0;
  }
`;

function badgeStyle(status?: string): React.CSSProperties {
  const s = (status ?? "").toLowerCase();
  if (s.includes("completed")) return { background: "#dcfce7", color: "#15803d" };
  if (s.includes("picked"))    return { background: "#fef9c3", color: "#854d0e" };
  if (s.includes("progress"))  return { background: "#dbeafe", color: "#1d4ed8" };
  if (s.includes("pending"))   return { background: "#fef3c7", color: "#b45309" };
  return { background: "#f3f4f6", color: "#4b5563" };
}

type User         = { name?: string; email?: string };
type Stat         = { label: string; value: string | number };
type PickupPreview = {
  _id: string; wasteType: string; quantity: number;
  status?: string; createdAt?: string; user?: { name?: string }; image?: string | null;
};

export default function CollectorDashboard(): JSX.Element {
  const navigate = useNavigate();

  const [user, setUser]           = useState<User | null>(null);
  const [stats, setStats]         = useState<Stat[]>([
    { label: "Assigned",          value: "—" },
    { label: "Completed (month)", value: "—" },
    { label: "Kg Collected",      value: "—" },
  ]);
  const [recent, setRecent]               = useState<PickupPreview[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [available, setAvailable]                 = useState<PickupPreview[]>([]);
  const [loadingAvailable, setLoadingAvailable]   = useState(false);
  const [availableError, setAvailableError]       = useState<string | null>(null);
  const [assigningIds, setAssigningIds]           = useState<Record<string, boolean>>({});

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) { try { setUser(JSON.parse(raw)); } catch { setUser(null); } }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingRecent(true);
      try {
        const [statsRes, recentRes] = await Promise.allSettled([
          api.get("/collector/stats").catch(() => null),
          api.get("/waste/collector/assigned?limit=5").catch(() => null),
        ]);
        if (!mounted) return;
        if (statsRes.status === "fulfilled" && statsRes.value?.data) {
          const d = statsRes.value.data;
          setStats([
            { label: "Assigned",          value: d.assigned       ?? 0 },
            { label: "Completed (month)", value: d.completedMonth ?? 0 },
            { label: "Kg Collected",      value: d.kgCollected    ?? 0 },
          ]);
        }
        if (recentRes.status === "fulfilled" && recentRes.value?.data) {
          const arrRaw = Array.isArray(recentRes.value.data)
            ? recentRes.value.data
            : recentRes.value.data?.data ?? [];
          // sort by createdAt (newest first) and keep only 2 latest
          const sorted = [...arrRaw].sort((a: any, b: any) => {
            const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return db - da;
          });
          const limited = sorted.slice(0, 2);
          setRecent(
            limited.map((p: any) => ({
              _id: p._id ?? p.id ?? String(Math.random()).slice(2),
              wasteType: p.wasteType ?? p.type ?? "Unknown",
              quantity:  p.quantity ?? 0,
              status:    p.status ?? "unknown",
              createdAt: p.createdAt ?? p.created_at,
              user:      p.user ?? undefined,
            }))
          );
        } else {
          setRecent([]);
        }
      } catch {
        setRecent([]);
      } finally {
        if (mounted) setLoadingRecent(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const fetchAvailable = useCallback(async () => {
    setLoadingAvailable(true);
    setAvailableError(null);
    try {
      const res = await api.get("/waste/available?limit=6");
      const raw = res?.data;
      let arr: any[] =
        Array.isArray(raw) ? raw :
        Array.isArray(raw?.data) ? raw.data :
        Array.isArray(raw?.items) ? raw.items : [];

      // Sort by createdAt (newest first) and keep only the latest two for dashboard preview
      const sorted = [...arr].sort((a: any, b: any) => {
        const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });

      const latestTwo = sorted.slice(0, 2);

      setAvailable(
        latestTwo.map((p: any) => ({
          _id:       p._id ?? p.id ?? String(Math.random()).slice(2),
          wasteType: p.wasteType ?? p.type ?? "Unknown",
          quantity:  p.quantity ?? 0,
          status:    p.status ?? "pending",
          createdAt: p.createdAt ?? p.created_at,
          user:      p.user ?? p.requester ?? undefined,
          image:     p.image ?? p.imageUrl ?? null,
        }))
      );
    } catch (err: any) {
      setAvailableError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load available pickups"
      );
    } finally {
      setLoadingAvailable(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailable();
    const id = setInterval(fetchAvailable, 30_000);
    return () => clearInterval(id);
  }, [fetchAvailable]);

  const setAssigning = useCallback((id: string, v: boolean) => {
    setAssigningIds((s) => { const c = { ...s }; if (v) c[id] = true; else delete c[id]; return c; });
  }, []);

  const claimPickup = useCallback(async (id: string) => {
    if (!window.confirm("Assign this pickup to yourself?")) return;
    setAssigning(id, true);
    const prev = available;
    setAvailable((cur) => cur.filter((x) => x._id !== id));
    try {
      const res = await api.post(`/waste/${id}/assign`);
      if (res?.data?.error) throw new Error(res.data.error);
      await fetchAvailable();
      window.alert("Pickup assigned! Check Assigned Pickups.");
      navigate("/collector/assigned");
    } catch (err: any) {
      setAvailable(prev);
      setAvailableError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to assign pickup"
      );
      setTimeout(() => setAvailableError(null), 3000);
    } finally { setAssigning(id, false); }
  }, [available, fetchAvailable, navigate, setAssigning]);


  const firstName = useMemo(() => user?.name?.split(" ")?.[0] ?? "Collector", [user]);

  const SkeletonRows = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[0,1,2].map((i) => (
        <div key={i} className="cd-skeleton-row">
          <div className="cd-skeleton" style={{ width: 40, height: 40, borderRadius: 8 }} />
          <div style={{ flex: 1 }}>
            <div className="cd-skeleton" style={{ height: 11, marginBottom: 6 }} />
            <div className="cd-skeleton" style={{ height: 9, width: "55%" }} />
          </div>
          <div className="cd-skeleton" style={{ width: 64, height: 26, borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="cd-root" role="application">
      <style>{css}</style>
      <CollectorSidebar />

      <main className="cd-main" role="main">
        <header className="cd-header">
          <div>
            <h1 className="cd-title">Welcome, {firstName}!</h1>
            <p className="cd-sub">Manage your pickups, view earnings and track performance</p>
          </div>

          <div className="cd-header__right">
            <div className="cd-kpis" role="region" aria-label="Quick stats">
              {stats.map((s) => (
                <div key={s.label} className="cd-kpi" title={String(s.label)}>
                  <div className="cd-kpi__value" aria-live="polite">{s.value}</div>
                  <div className="cd-kpi__label">{s.label}</div>
                </div>
              ))}
            </div>

            <button
              className="cd-avatar"
              onClick={() => navigate("/profile")}
              aria-label={user?.name ?? "Profile"}
              title={user?.name ?? "Profile"}
            >
              {(user?.name?.charAt(0) ?? "C").toUpperCase()}
            </button>
          </div>
        </header>

        <section className="cd-grid">
          <div className="cd-col-left">
            {/* Recent assigned (only 2 latest) */}
            <div className="cd-card">
              <div className="cd-card__head">
                <h3 className="cd-card__title">Recent Assigned Pickups</h3>
                <Link to="/collector/assigned" className="cd-link">See all →</Link>
              </div>

              {loadingRecent ? (
                <SkeletonRows />
              ) : recent.length === 0 ? (
                <div className="cd-empty">No recent pickups assigned.</div>
              ) : (
                <ul className="cd-list" aria-live="polite">
                  {recent.map((p) => (
                    <li
                      key={p._id}
                      className="cd-item"
                      onClick={() => navigate(`/collector/history/${p._id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && navigate(`/collector/history/${p._id}`)}
                    >
                      <div className="cd-item__meta">
                        <div className="cd-item__title">{p.wasteType}</div>
                        <div className="cd-item__sub">{p.quantity} kg</div>
                        {p.createdAt && (
                          <div className="cd-item__time">
                            {new Date(p.createdAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="cd-item__aside">
                        <span className="cd-badge" style={badgeStyle(p.status)}>
                          {p.status ?? "unknown"}
                        </span>
                        <Link
                          to={`/collector/history/${p._id}`}
                          className="cd-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Available pickups (show only latest two on dashboard) */}
            <div className="cd-card">
              <div className="cd-card__head">
                <h3 className="cd-card__title">Available Pickups</h3>
                <div className="cd-card__actions">
                  <button
                    className="cd-btn cd-btn--sm"
                    onClick={fetchAvailable}
                    disabled={loadingAvailable}
                  >
                    {loadingAvailable ? "Refreshing…" : "↻ Refresh"}
                  </button>
                  <Link to="/collector/available" className="cd-link">
                    See all →
                  </Link>
                </div>
              </div>

              {loadingAvailable ? (
                <div className="cd-skeleton" style={{ height: 40, borderRadius: 8 }} />
              ) : availableError ? (
                <div className="cd-error">{availableError}</div>
              ) : available.length === 0 ? (
                <div className="cd-empty">No unassigned pickups right now.</div>
              ) : (
                <ul className="cd-list" aria-live="polite">
                  {available.map((p) => (
                    <li key={p._id} className="cd-item cd-item--v">
                      <div
                        className="cd-item__meta"
                        onClick={() => navigate(`/collector/history/${p._id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) =>
                          e.key === "Enter" && navigate(`/collector/history/${p._id}`)
                        }
                      >
                        <div className="cd-item__title">{p.wasteType}</div>
                        <div className="cd-item__sub">
                          {p.quantity} kg • {p.user?.name ?? "User"}
                        </div>
                        {p.createdAt && (
                          <div className="cd-item__time">
                            {new Date(p.createdAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="cd-item__aside">
                        <span className="cd-badge" style={badgeStyle(p.status)}>
                          {p.status ?? "pending"}
                        </span>
                        <button
                          className="cd-btn cd-btn--primary cd-btn--sm"
                          onClick={() => claimPickup(p._id)}
                          disabled={!!assigningIds[p._id]}
                        >
                          {assigningIds[p._id] ? "Assigning…" : "Assign to me"}
                        </button>
                        <Link
                          to={`/collector/history/${p._id}`}
                          className="cd-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <aside className="cd-col-right">
            <div className="cd-card">
              <h3 className="cd-card__title" style={{ marginBottom: 12 }}>
                Tips
              </h3>
              <ul className="cd-tips">
                <li>Communicate with users for timely pickups</li>
                <li>Confirm weights on pickup for accurate payouts</li>
                <li>Maintain safe handling &amp; hygiene</li>
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}