import { useCallback, useContext, useEffect, useMemo, useState, type JSX } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../App";

type User = { name?: string; email?: string };
type Stat = { label: string; value: string | number };
type PickupPreview = {
  _id: string;
  wasteType: string;
  quantity: number;
  status?: string;
  createdAt?: string;
  user?: { name?: string };
  image?: string | null;
};

const NAV_LINKS = [
  { to: "/collector", label: "Overview", key: "overview" },
  { to: "/collector/assigned", label: "Assigned Pickups", key: "assigned" },
  { to: "/collector/earnings", label: "Earnings", key: "earnings" },
  { to: "/collector/history", label: "Pickup History", key: "history" },
  { to: "/collector/analytics", label: "Performance / Analytics", key: "analytics" },
  { to: "/profile", label: "Profile", key: "profile" },
];

/**
 * CollectorDashboard (refined)
 *
 * Note: changed "View" links for pickups to point to the collector history/detail route:
 *   /collector/history/:pickupId
 *
 * Ensure your router defines a route that accepts that path and shows the pickup history/details.
 */

/* ---------------------- scoped styles (in-file) ---------------------- */
const css = `
:root{
  --bg: #f5faf6;
  --card: #fff;
  --muted: #6b7a72;
  --text: #0b2a1a;
  --accent: #1db954;
  --accent-600: #0ea158;
  --accent-700: #0a8a3f;
  --danger: #e23b3b;
  --glass: rgba(255,255,255,0.6);
  --radius: 12px;
  --shadow-sm: 0 6px 18px rgba(14,40,18,0.06);
  --shadow-md: 0 18px 48px rgba(11,36,18,0.08);
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
}

/* layout */
.collector-root { display:flex; min-height:100vh; background: linear-gradient(180deg,var(--bg), #eef9ee 140%); color:var(--text); }
.collector-sidebar {
  width: 260px;
  background: linear-gradient(180deg,#16382f,#123023);
  color: #fff;
  padding: 20px;
  box-shadow: 2px 0 12px rgba(0,0,0,0.06);
  display:flex; flex-direction:column;
  gap: 12px;
  position: sticky; top:0; height:100vh;
}
.collector-brand { display:flex; align-items:center; gap:12px; }
.collector-brand .icon { font-size:22px; }
.collector-brand .title { font-weight:700; font-size:18px; letter-spacing:0.2px; }
.collector-toggle { margin-left:auto; background:transparent; border:none; color:rgba(255,255,255,0.9); cursor:pointer; }

.collector-nav { display:flex; flex-direction:column; gap:6px; margin-top:6px; }
.collector-nav a {
  display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; color: #e6eef0; text-decoration:none;
  transition: background .14s, transform .12s;
}
.collector-nav a:hover { background: rgba(255,255,255,0.03); transform: translateY(-1px); }
.collector-nav a.active { background: rgba(255,255,255,0.06); color:#fff; font-weight:700; }

.collector-footer { margin-top:auto; display:flex; flex-direction:column; gap:8px; border-top:1px solid rgba(255,255,255,0.04); padding-top:12px; }

.collector-main { flex:1; padding: 28px; box-sizing:border-box; max-width:1200px; margin:0 auto; }
.collector-header { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:18px; }
.collector-title { margin:0; font-size:28px; font-weight:800; color:var(--text); }
.collector-sub { margin:4px 0 0; color:var(--muted); font-size:13px; }

/* stats row */
.stats-row { display:flex; gap:12px; align-items:center; }
.stat { background:var(--card); padding:8px 12px; border-radius:10px; box-shadow:var(--shadow-sm); text-align:center; min-width:120px; }
.stat .value { font-weight:800; font-size:18px; }
.stat .label { font-size:12px; color:var(--muted); }

/* grid */
.grid { display:flex; gap:18px; align-items:flex-start; flex-wrap:wrap; }
.col-left { flex:1; min-width:320px; }
.col-right { width:340px; }

/* card */
.card { background:var(--card); padding:16px; border-radius:var(--radius); box-shadow:var(--shadow-sm); transition: transform .12s, box-shadow .12s; }
.card:hover { transform: translateY(-4px); box-shadow:var(--shadow-md); }
.card-title { margin:0 0 10px 0; font-size:16px; font-weight:700; }

/* quick actions */
.actions { display:flex; gap:12px; flex-wrap:wrap; }
.action { display:flex; gap:12px; padding:10px 12px; border-radius:10px; background:#f7fff7; text-decoration:none; color:var(--text); min-width:170px; align-items:center; }
.action .icon { width:44px; height:44px; display:flex; align-items:center; justify-content:center; border-radius:10px; background: #eafaf0; font-size:20px; }

/* lists */
.list { display:flex; flex-direction:column; gap:10px; margin-top:8px; }
.list-item { display:flex; justify-content:space-between; gap:12px; align-items:center; padding:10px; border-radius:10px; border:1px solid #f1f1f1; background: linear-gradient(90deg,#fff,#f7fff7); }
.list-item .meta { max-width: 68%; }
.list-item .meta .title { font-weight:700; margin-bottom:6px; }
.list-item .meta .sub { color:var(--muted); font-size:13px; }
.list-actions { display:flex; gap:8px; align-items:center; }

/* buttons */
.btn { padding:8px 10px; border-radius:8px; background:#fff; border:1px solid #e6efe6; cursor:pointer; font-weight:700; }
.btn.primary { background: linear-gradient(90deg,var(--accent),var(--accent-700)); color: #fff; border:none; box-shadow: 0 8px 18px rgba(17,120,68,0.12); }
.btn.ghost { background: transparent; border:1px solid #e6efe6; color:var(--text); }

/* right column */
.right-card .big { font-size:28px; font-weight:800; color:#2c3e50; margin-top:8px; }

/* small helpers */
.view-link { color: var(--accent); text-decoration:none; font-weight:700; }
.badge { padding:6px 10px; border-radius:8px; font-weight:700; font-size:12px; background:#f2f4f7; color:#333; text-transform:capitalize; }

/* skeleton */
.skeleton { background: linear-gradient(90deg,#f3f8f3 0,#eef9ee 50%, #f3f8f3 100%); background-size:200% 100%; animation: shimmer 1.2s linear infinite; border-radius:8px; }
@keyframes shimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }

/* responsive */
@media (max-width: 980px) {
  .collector-sidebar { display:none; }
  .collector-main { padding:16px; }
  .col-right { width:100%; order: 2; }
  .col-left { order: 1; }
}
`;

/* ---------------------- helper functions ---------------------- */
function iconFor(key: string) {
  switch (key) {
    case "overview":
      return "🏠";
    case "assigned":
      return "📦";
    case "earnings":
      return "💰";
    case "history":
      return "📜";
    case "analytics":
      return "📈";
    case "profile":
      return "👤";
    default:
      return "•";
  }
}
function badgeBg(status?: string) {
  const s = (status ?? "").toLowerCase();
  if (s.includes("completed")) return "#e6ffef";
  if (s.includes("picked")) return "#fff8e6";
  return "#f2f4f7";
}

/* ---------------------- component ---------------------- */
export default function CollectorDashboard(): JSX.Element {
  const navigate = useNavigate();
  const { setAuthState } = useContext(AuthContext);

  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const [stats, setStats] = useState<Stat[]>([
    { label: "Assigned", value: "—" },
    { label: "Completed (month)", value: "—" },
    { label: "Kg Collected", value: "—" },
  ]);

  const [recent, setRecent] = useState<PickupPreview[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const [available, setAvailable] = useState<PickupPreview[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState<boolean>(false);
  const [assigningIds, setAssigningIds] = useState<Record<string, boolean>>({});
  const [availableError, setAvailableError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth < 880);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // load stats + recent
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingRecent(true);
      try {
        const [statsRes, recentRes] = await Promise.allSettled([
          api.get("/api/collector/stats").catch(() => null),
          api.get("/api/waste/collector/assigned?limit=5").catch(() => null),
        ]);

        if (!mounted) return;

        if (statsRes && statsRes.status === "fulfilled" && statsRes.value?.data) {
          const d = statsRes.value.data;
          setStats([
            { label: "Assigned", value: d.assigned ?? 0 },
            { label: "Completed (month)", value: d.completedMonth ?? 0 },
            { label: "Kg Collected", value: d.kgCollected ?? 0 },
          ]);
        }

        if (recentRes && recentRes.status === "fulfilled" && recentRes.value?.data) {
          const arr = Array.isArray(recentRes.value.data) ? recentRes.value.data : recentRes.value.data?.data ?? [];
          setRecent(
            arr.slice(0, 5).map((p: any) => ({
              _id: p._id ?? p.id ?? String(Math.random()).slice(2),
              wasteType: p.wasteType ?? p.type ?? "Unknown",
              quantity: p.quantity ?? 0,
              status: p.status ?? "unknown",
              createdAt: p.createdAt ?? p.created_at,
              user: p.user ?? undefined,
            }))
          );
        } else {
          setRecent([]);
        }
      } catch (e) {
        console.warn("Load error", e);
        setRecent([]);
      } finally {
        if (mounted) setLoadingRecent(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* fetch available pickups (stable reference) */
  const fetchAvailable = useCallback(async () => {
    setLoadingAvailable(true);
    setAvailableError(null);
    try {
      const res = await api.get("/api/waste/available?limit=6");
      const raw = res?.data;
      let arr: any[] = [];
      if (Array.isArray(raw)) arr = raw;
      else if (Array.isArray(raw?.data)) arr = raw.data;
      else if (Array.isArray(raw?.items)) arr = raw.items;
      else if (raw && typeof raw === "object") {
        const guess = raw.data ?? raw.items ?? raw.result;
        if (Array.isArray(guess)) arr = guess;
      }
      const mapped = arr.map((p: any) => ({
        _id: p._id ?? p.id ?? String(Math.random()).slice(2),
        wasteType: p.wasteType ?? p.type ?? "Unknown",
        quantity: p.quantity ?? 0,
        status: p.status ?? "pending",
        createdAt: p.createdAt ?? p.created_at,
        user: p.user ?? p.requester ?? undefined,
        image: p.image ?? p.imageUrl ?? null,
      }));
      setAvailable(mapped.slice(0, 6));
    } catch (err: any) {
      console.error("fetchAvailable error:", err);
      setAvailableError(err?.response?.data?.message || err?.message || "Failed to load available pickups");
    } finally {
      setLoadingAvailable(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailable();
    const id = setInterval(() => fetchAvailable(), 30000);
    return () => clearInterval(id);
  }, [fetchAvailable]);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    try {
      setAuthState({ isAuth: false, roleState: "" });
    } catch {}
    navigate("/login", { replace: true });
  }, [navigate, setAuthState]);

  const firstName = useMemo(() => user?.name?.split?.(" ")?.[0] ?? "Collector", [user]);

  const setAssigning = useCallback((id: string, v: boolean) => {
    setAssigningIds((s) => {
      const copy = { ...s };
      if (v) copy[id] = true;
      else delete copy[id];
      return copy;
    });
  }, []);

  const claimPickup = useCallback(
    async (id: string) => {
      if (!window.confirm("Assign this pickup to yourself?")) return;
      setAssigning(id, true);
      const prev = available;
      setAvailable((cur) => cur.filter((x) => x._id !== id));
      try {
        const res = await api.post(`/api/waste/${id}/assign`);
        if (res?.data?.error) throw new Error(res.data.error || "Assign failed");
        await fetchAvailable();
        window.alert("Pickup assigned to you. Check Assigned Pickups.");
        // optionally navigate to assigned page
        navigate("/collector/assigned");
      } catch (err: any) {
        console.error("claim failed", err);
        setAvailable(prev); // rollback
        setAvailableError(err?.response?.data?.message || err?.message || "Failed to assign pickup");
        setTimeout(() => setAvailableError(null), 3000);
      } finally {
        setAssigning(id, false);
      }
    },
    [available, fetchAvailable, setAssigning, navigate]
  );

  useEffect(() => {
    console.debug("CollectorDashboard mounted, collapsed:", collapsed);
  }, [collapsed]);

  return (
    <div className="collector-root" role="application">
      <style>{css}</style>

      <aside
        className="collector-sidebar"
        style={{ width: collapsed ? 88 : 260 }}
        aria-label="Collector navigation"
      >
        <div className="collector-brand" style={{ gap: 8 }}>
          <div className="icon" aria-hidden>🚚</div>
          {!collapsed && <div className="title">Collector</div>}
          <button
            aria-label="Toggle sidebar"
            title="Toggle"
            onClick={() => setCollapsed((v) => !v)}
            className="collector-toggle"
            style={{ marginLeft: "auto" }}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        <nav className="collector-nav" aria-label="Collector links">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                color: "#e6eef0",
                textDecoration: "none",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
            >
              <span style={{ width: 28, textAlign: "center" }} aria-hidden>
                {iconFor(l.key)}
              </span>
              {!collapsed && <span>{l.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="collector-footer" style={{ marginTop: "auto" }}>
          {!collapsed && <div style={{ fontWeight: 700 }}>{user?.name ?? firstName}</div>}
          <button onClick={logout} style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: "#e74c3c", color: "#fff", border: "none", cursor: "pointer" }}>
            <span style={{ marginRight: 8 }}>🚪</span>
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      <main className="collector-main" role="main">
        <header className="collector-header" aria-hidden={false}>
          <div>
            <h1 className="collector-title">Welcome, {firstName}!</h1>
            <div className="collector-sub">Manage your pickups, view earnings and track performance</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="stats-row" role="region" aria-label="Quick stats">
              {stats.map((s) => (
                <div key={s.label} className="stat" title={String(s.label)}>
                  <div className="value" aria-live="polite">{s.value}</div>
                  <div className="label">{s.label}</div>
                </div>
              ))}
            </div>

            <button
              aria-label={user?.name ?? "Collector profile"}
              title={user?.name ?? "Collector profile"}
              style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(90deg,#19bd4a,#0ea158)", color: "#fff", border: "none", fontWeight: 800 }}
            >
              {(user?.name?.charAt?.(0) ?? "C").toUpperCase()}
            </button>
          </div>
        </header>

        <section className="grid">
          <div className="col-left">
            <div className="card">
              <h3 className="card-title">Quick Actions</h3>
              <div className="actions" role="toolbar" aria-label="Quick actions">
                <Link to="/collector/assigned" className="action" aria-label="Assigned pickups">
                  <div className="icon">📦</div>
                  <div>
                    <div style={{ fontWeight: 800 }}>Assigned</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>View assigned pickups</div>
                  </div>
                </Link>

                <Link to="/collector/earnings" className="action" aria-label="Earnings">
                  <div className="icon">💰</div>
                  <div>
                    <div style={{ fontWeight: 800 }}>Earnings</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>Check payouts</div>
                  </div>
                </Link>

                <Link to="/collector/history" className="action" aria-label="History">
                  <div className="icon">📜</div>
                  <div>
                    <div style={{ fontWeight: 800 }}>History</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>Past pickups</div>
                  </div>
                </Link>
              </div>
            </div>

            <div style={{ height: 14 }} />

            <div className="card">
              <h3 className="card-title">Recent Assigned Pickups</h3>
              {loadingRecent ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 44, height: 44 }} className="skeleton" />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 12 }} className="skeleton" />
                        <div style={{ height: 10, marginTop: 8, width: "50%" }} className="skeleton" />
                      </div>
                      <div style={{ width: 60 }} className="skeleton" />
                    </div>
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <p style={{ color: "#666" }}>No recent pickups assigned.</p>
              ) : (
                <ul className="list" aria-live="polite">
                  {recent.map((p) => (
                    <li key={p._id} className="list-item">
                      <div
                        className="meta"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/collector/history/${p._id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") navigate(`/collector/history/${p._id}`);
                        }}
                        aria-label={`Open pickup ${p.wasteType} history`}
                      >
                        <div className="title">{p.wasteType}</div>
                        <div className="sub">{p.quantity} kg • {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}</div>
                      </div>
                      <div className="list-actions">
                        <span className="badge" style={{ background: badgeBg(p.status) }}>{p.status ?? "unknown"}</span>
                        {/* Link changed: go to collector history page for details */}
                        <Link to={`/collector/history/${p._id}`} className="view-link">View</Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ height: 14 }} />

            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="card-title">Available Pickups</h3>
                <div>
                  <button className="btn" onClick={() => fetchAvailable()} disabled={loadingAvailable}>{loadingAvailable ? "Refreshing…" : "Refresh"}</button>
                  <Link to="/collector/available" className="view-link" style={{ marginLeft: 10 }}>See all available →</Link>
                </div>
              </div>

              {loadingAvailable ? (
                <div style={{ marginTop: 12 }}>
                  <div style={{ height: 12 }} className="skeleton" />
                  <div style={{ height: 12, marginTop: 8 }} className="skeleton" />
                </div>
              ) : availableError ? (
                <div style={{ marginTop: 12, color: "crimson" }}>{availableError}</div>
              ) : available.length === 0 ? (
                <p style={{ color: "#666" }}>No unassigned pickups right now.</p>
              ) : (
                <ul className="list" aria-live="polite">
                  {available.map((p) => (
                    <li key={p._id} className="list-item">
                      <div style={{ maxWidth: 360 }}>
                        <div style={{ fontWeight: 700 }}>{p.wasteType}</div>
                        <div style={{ color: "#666", fontSize: 13 }}>{p.quantity} kg • {p.user?.name ?? "User"}</div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          className="btn primary"
                          onClick={() => claimPickup(p._id)}
                          disabled={!!assigningIds[p._id]}
                        >
                          {assigningIds[p._id] ? "Assigning…" : "Assign to me"}
                        </button>

                        {/* Link changed: open history/detail for this pickup */}
                        <Link to={`/collector/history/${p._id}`} className="view-link">View</Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <aside className="col-right">
            <div className="card right-card">
              <h3 className="card-title">Earnings Snapshot</h3>
              <div className="big">Rs 12,450</div>
              <div style={{ color: "var(--muted)", marginTop: 8 }}>Payouts this month</div>
              <div style={{ height: 12 }} />
              <button className="btn primary" onClick={() => navigate("/collector/earnings")}>View full earnings</button>
            </div>

            <div style={{ height: 12 }} />

            <div className="card">
              <h3 className="card-title">Tips</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Communicate with users for timely pickups</li>
                <li>Confirm weights on pickup for accurate payouts</li>
                <li>Maintain safe handling & hygiene</li>
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}