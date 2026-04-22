import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiRepeat, FiCheck, FiGift, FiClock, FiList, FiGlobe, FiAlertTriangle } from "react-icons/fi";
import api from "../../api";
import Sidebar from "../components/Sidebar";

/* ─────────────────────────── Styles ─────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --bg:           #f0f3f7;
    --surface:      #ffffff;
    --surface-2:    #f7f9fc;
    --border:       #e4e9f0;
    --border-2:     #cdd5e0;
    --green:        #16a34a;
    --green-2:      #22c55e;
    --green-soft:   #f0fdf4;
    --green-border: rgba(22,163,74,.2);
    --blue:         #2563eb;
    --blue-soft:    #eff6ff;
    --amber:        #d97706;
    --amber-soft:   #fffbeb;
    --red:          #dc2626;
    --red-soft:     #fef2f2;
    --text-1:       #0f1f2e;
    --text-2:       #4b6070;
    --text-3:       #94a8b8;
    --mono:         'JetBrains Mono', monospace;
    --font:         'Figtree', system-ui, sans-serif;
    --ease:         cubic-bezier(.4,0,.2,1);
    --ease-spring:  cubic-bezier(.34,1.26,.64,1);
    --r-sm:         8px;
    --r-md:         12px;
    --r-lg:         16px;
    --r-xl:         20px;
    --sh-sm:        0 1px 4px rgba(0,0,0,.05), 0 1px 2px rgba(0,0,0,.04);
    --sh-md:        0 6px 20px rgba(0,0,0,.07), 0 2px 6px rgba(0,0,0,.04);
    --sh-lg:        0 20px 48px rgba(0,0,0,.10), 0 6px 16px rgba(0,0,0,.05);
  }

  /* ── Root ── */
  .db-container {
    display: flex;
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--font);
    color: var(--text-1);
    -webkit-font-smoothing: antialiased;
  }

  /* ── Main ── */
  .db-main {
    flex: 1;
    padding: 32px 30px 56px;
    overflow-y: auto;
    min-width: 0;
    animation: db-in 280ms var(--ease) both;
  }

  @keyframes db-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Header ── */
  .db-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }

  .db-welcome {
    margin: 0 0 4px;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.4px;
    color: var(--text-1);
  }

  .db-subtitle {
    margin: 0;
    font-size: 13.5px;
    color: var(--text-2);
  }

  .db-avatar {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--green), #0f7a35);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 800;
    flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(22,163,74,.3);
    transition: transform 150ms var(--ease), box-shadow 150ms;
    cursor: default;
  }

  .db-avatar:hover {
    transform: scale(1.07);
    box-shadow: 0 6px 20px rgba(22,163,74,.35);
  }

  /* ── Stats grid ── */
  .db-stats-grid {
    display: grid;
    gap: 14px;
    margin-bottom: 22px;
  }

  .db-stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 20px 22px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--sh-sm);
    position: relative;
    overflow: hidden;
    transition: transform 150ms var(--ease), box-shadow 150ms;
    animation: db-stat-in 360ms var(--ease-spring) both;
  }

  .db-stat-card:nth-child(1) { animation-delay:  50ms; }
  .db-stat-card:nth-child(2) { animation-delay: 100ms; }
  .db-stat-card:nth-child(3) { animation-delay: 150ms; }
  .db-stat-card:nth-child(4) { animation-delay: 200ms; }

  @keyframes db-stat-in {
    from { opacity: 0; transform: translateY(12px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .db-stat-card:hover { transform: translateY(-2px); box-shadow: var(--sh-md); }

  /* Accent stripe */
  .db-stat-card::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    border-radius: var(--r-xl) 0 0 var(--r-xl);
  }

  .db-stat-card--green::before  { background: var(--green); }
  .db-stat-card--blue::before   { background: var(--blue); }
  .db-stat-card--amber::before  { background: var(--amber); }
  .db-stat-card--red::before    { background: var(--red); }

  .db-stat-icon {
    font-size: 32px;
    width: 52px;
    height: 52px;
    border-radius: var(--r-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .db-stat-card--green  .db-stat-icon { background: var(--green-soft); }
  .db-stat-card--blue   .db-stat-icon { background: var(--blue-soft);  }
  .db-stat-card--amber  .db-stat-icon { background: var(--amber-soft); }
  .db-stat-card--red    .db-stat-icon { background: var(--red-soft);   }

  .db-stat-label {
    margin: 0 0 6px;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: .5px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .db-stat-value {
    margin: 0 0 5px;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -1px;
    color: var(--text-1);
    font-family: var(--mono);
    line-height: 1;
  }

  .db-stat-change {
    margin: 0;
    font-size: 12px;
    color: var(--green);
    font-weight: 500;
  }

  .db-stat-change--muted { color: var(--text-3); }

  /* ── Content grid ── */
  .db-content-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 14px;
  }

  /* ── Card ── */
  .db-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 20px 22px;
    box-shadow: var(--sh-sm);
    transition: box-shadow 150ms;
  }

  .db-card:hover { box-shadow: var(--sh-md); }

  .db-card-title {
    margin: 0 0 16px;
    font-size: 14.5px;
    font-weight: 700;
    letter-spacing: -0.1px;
    color: var(--text-1);
    display: flex;
    align-items: center;
    gap: 7px;
  }

  /* ── Activity list ── */
  .db-activity-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .db-activity-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    transition: border-color 130ms, background 130ms, transform 130ms var(--ease);
    cursor: pointer;
  }

  .db-activity-item:hover {
    border-color: var(--border-2);
    background: var(--surface);
    transform: translateX(3px);
  }

  .db-activity-icon {
    font-size: 18px;
    width: 38px;
    height: 38px;
    border-radius: var(--r-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--green-soft);
    border: 1px solid var(--green-border);
    flex-shrink: 0;
  }

  .db-activity-content { flex: 1; min-width: 0; }

  .db-activity-link {
    display: block;
    text-decoration: none;
    color: var(--text-1);
    font-size: 13.5px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 3px;
    transition: color 120ms;
  }

  .db-activity-link:hover { color: var(--green); }

  .db-activity-meta {
    font-size: 11.5px;
    color: var(--text-3);
    font-family: var(--mono);
    text-transform: capitalize;
  }

  /* ── Status badge in activity ── */
  .db-activity-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .2px;
    text-transform: capitalize;
    flex-shrink: 0;
  }

  /* ── Impact grid ── */
  .db-impact-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .db-impact-item {
    text-align: center;
    padding: 16px 10px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    transition: border-color 130ms, transform 130ms var(--ease);
  }

  .db-impact-item:hover {
    border-color: var(--green-border);
    transform: translateY(-2px);
  }

  .db-impact-value {
    margin: 0 0 6px;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.8px;
    color: var(--green);
    font-family: var(--mono);
  }

  .db-impact-label {
    margin: 0;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text-3);
    letter-spacing: .3px;
    text-transform: uppercase;
    line-height: 1.4;
  }

  /* ── States ── */
  .db-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    border-radius: var(--r-md);
    background: var(--red-soft);
    border: 1px solid #fecaca;
    color: var(--red);
    font-size: 13.5px;
  }

  .db-muted {
    color: var(--text-3);
    font-size: 13.5px;
    padding: 16px 0;
    text-align: center;
  }

  /* ── Skeleton ── */
  .db-skeleton {
    background: linear-gradient(90deg, #e9ecf0 0%, #f5f7fa 50%, #e9ecf0 100%);
    background-size: 200% 100%;
    animation: db-shimmer 1.3s ease infinite;
    border-radius: var(--r-sm);
  }

  @keyframes db-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }

  /* icon tweaks so react-icons inherit color/size nicely */
  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: inherit;
  }
`;

/* ─────────────────────────── Helpers ─────────────────────────── */
function activityBadge(status?: string): React.CSSProperties {
  const s = (status ?? "").toLowerCase();
  if (s === "collected") return { background: "#dcfce7", color: "#15803d" };
  if (s === "pending")   return { background: "#fef9c3", color: "#854d0e" };
  if (s === "scheduled") return { background: "#dbeafe", color: "#1d4ed8" };
  return { background: "#f1f5f9", color: "#475569" };
}

/* ─────────────────────────── Types ─────────────────────────── */
type WastePost = {
  _id: string; wasteType?: string; quantity?: number; price?: number;
  status?: string; pickupDate?: string | null; imageUrl?: string; createdAt?: string;
  [k: string]: any;
};

/* ─────────────────────────── Component ─────────────────────────── */
const Dashboard: React.FC = () => {
  const [user,           setUser]           = useState<any>(null);
  const [wasteItems,     setWasteItems]     = useState<WastePost[]>([]);
  const [totalPosted,    setTotalPosted]    = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [points,         setPoints]         = useState<number>(0);
  const [pendingCount,   setPendingCount]   = useState<number>(0);
  const [recent,         setRecent]         = useState<WastePost[]>([]);
  const [loading,        setLoading]        = useState<boolean>(true);
  const [error,          setError]          = useState<string | null>(null);

  const [statsCols, setStatsCols] = useState<number>(() => {
    if (typeof window === "undefined") return 4;
    const w = window.innerWidth;
    return w >= 1100 ? 4 : w >= 700 ? 2 : 1;
  });

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try { const p = JSON.parse(raw); setUser(p); setPoints(p?.points ?? 0); }
      catch (e) { console.error("Error parsing user data:", e); }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res  = await api.get("/api/waste/my-posts");
        const data: WastePost[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        if (!mounted) return;
        setWasteItems(data || []);
        setTotalPosted(data.length);
        setCompletedCount(data.filter((d) => (d.status ?? "").toLowerCase() === "collected").length);
        setPendingCount(data.filter((d) => ["pending","scheduled"].includes((d.status ?? "").toLowerCase())).length);
        // show latest three activities
        setRecent(data.slice().sort((a,b) => +new Date(b.createdAt||0) - +new Date(a.createdAt||0)).slice(0,3));
      } catch (err: any) {
        if (mounted) setError(err?.response?.data?.message || "Failed to load dashboard data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setStatsCols(w >= 1100 ? 4 : w >= 700 ? 2 : 1);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* Impact calculations */
  const IMPACT = useMemo(() => {
    const CO2_PER_KG = 0.9;
    const TREE_SEQUESTRATION_KG_PER_YEAR = 22;

    const recycledKg = wasteItems.reduce((sum, it) => {
      const q = Number(it.quantity ?? 0);
      const collected = ((it.status ?? "").toLowerCase() === "collected");
      return sum + (collected && !isNaN(q) ? q : 0);
    }, 0);

    const co2ReducedKg = recycledKg * CO2_PER_KG;
    const treesSaved = co2ReducedKg / TREE_SEQUESTRATION_KG_PER_YEAR;

    return {
      recycledKg,
      co2ReducedKg,
      treesSaved,
      CO2_PER_KG,
      TREE_SEQUESTRATION_KG_PER_YEAR,
    };
  }, [wasteItems]);

  /* ── Skeleton rows ── */
  const ActivitySkeleton = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[0,1,2].map((i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface-2)" }}>
          <div className="db-skeleton" style={{ width: 38, height: 38, borderRadius: "var(--r-sm)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="db-skeleton" style={{ height: 12, marginBottom: 7, width: "55%" }} />
            <div className="db-skeleton" style={{ height: 10, width: "38%" }} />
          </div>
          <div className="db-skeleton" style={{ width: 56, height: 20, borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="db-container">
        <Sidebar />

        <div className="db-main">

          {/* ── Header ── */}
          <div className="db-header">
            <div>
              <h1 className="db-welcome">Welcome back, {user?.name || "User"}!</h1>
              <p className="db-subtitle">Track your waste management and earn rewards</p>
            </div>
            <div className="db-avatar" title={user?.name ?? "User"}>
              {(user?.name?.charAt(0) ?? "U").toUpperCase()}
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="db-stats-grid" style={{ gridTemplateColumns: `repeat(${statsCols}, minmax(0,1fr))` }}>

            <div className="db-stat-card db-stat-card--green">
              <div className="db-stat-icon">
                <FiRepeat className="icon" size={22} aria-hidden />
              </div>
              <div>
                <p className="db-stat-label">Total Waste Posted</p>
                <h2 className="db-stat-value">{loading ? "—" : totalPosted}</h2>
                <p className="db-stat-change">
                  {!loading ? `+${Math.max(0, totalPosted)} this week` : ""}
                </p>
              </div>
            </div>

            <div className="db-stat-card db-stat-card--blue">
              <div className="db-stat-icon">
                <FiCheck className="icon" size={20} aria-hidden />
              </div>
              <div>
                <p className="db-stat-label">Pickups Completed</p>
                <h2 className="db-stat-value">{loading ? "—" : completedCount}</h2>
                <p className="db-stat-change">+{!loading ? Math.max(0, completedCount) : ""} this week</p>
              </div>
            </div>

            <div className="db-stat-card db-stat-card--amber">
              <div className="db-stat-icon">
                <FiGift className="icon" size={20} aria-hidden />
              </div>
              <div>
                <p className="db-stat-label">Reward Points</p>
                <h2 className="db-stat-value">{points}</h2>
                <p className="db-stat-change">+50 this week</p>
              </div>
            </div>

            <div className="db-stat-card db-stat-card--red">
              <div className="db-stat-icon">
                <FiClock className="icon" size={20} aria-hidden />
              </div>
              <div>
                <p className="db-stat-label">Pending Pickups</p>
                <h2 className="db-stat-value">{loading ? "—" : pendingCount}</h2>
                <p className="db-stat-change db-stat-change--muted">Awaiting collection</p>
              </div>
            </div>

          </div>

          {/* ── Content grid ── */}
          <div className="db-content-grid">

            {/* Recent activity */}
            <div className="db-card">
              <h3 className="db-card-title"><FiList className="icon" style={{ marginRight: 8 }} />Recent Activity</h3>

              {loading ? <ActivitySkeleton /> : error ? (
                <div className="db-error"><FiAlertTriangle style={{ marginRight: 8 }} /> {error}</div>
              ) : recent.length === 0 ? (
                <div className="db-muted">No recent activity yet.</div>
              ) : (
                <div className="db-activity-list">
                  {recent.map((item) => (
                    <Link key={item._id} to={`/track/${item._id}`} style={{ textDecoration: "none" }}>
                      <div className="db-activity-item">
                        <div className="db-activity-icon">
                          <FiRepeat className="icon" size={16} aria-hidden />
                        </div>
                        <div className="db-activity-content">
                          <span className="db-activity-link">
                            {(item.wasteType ?? "Waste").toUpperCase()} • {item.quantity ?? "—"} kg
                          </span>
                          <div className="db-activity-meta">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                          </div>
                        </div>
                        <span className="db-activity-badge" style={activityBadge(item.status)}>
                          {item.status ?? "—"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Environmental impact */}
            <div className="db-card">
              <h3 className="db-card-title"><FiGlobe className="icon" style={{ marginRight: 8 }} />Environmental Impact</h3>
              <div className="db-impact-grid">
                <div className="db-impact-item">
                  <p className="db-impact-value">{loading ? "—" : `${IMPACT.recycledKg.toFixed(1)}kg`}</p>
                  <p className="db-impact-label">Waste Recycled (collected)</p>
                </div>
                <div className="db-impact-item">
                  <p className="db-impact-value">{loading ? "—" : `${IMPACT.co2ReducedKg.toFixed(1)}kg`}</p>
                  <p className="db-impact-label">Estimated CO₂ Reduced</p>
                </div>
                <div className="db-impact-item">
                  <p className="db-impact-value">{loading ? "—" : Math.max(0, Math.round(IMPACT.treesSaved))}</p>
                  <p className="db-impact-label">Trees (years) equivalent saved</p>
                </div>
              </div>

              <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
                These numbers are estimates based on collected waste quantities and default conversion factors.
                <br />
                CO₂ factor: {IMPACT.CO2_PER_KG} kg CO₂ per kg waste · Tree sequestration: {IMPACT.TREE_SEQUESTRATION_KG_PER_YEAR} kg CO₂/year.
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;