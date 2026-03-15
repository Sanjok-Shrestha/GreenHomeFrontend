import React, { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate, Link, NavLink } from "react-router-dom";
import api from "../api";

/**
 * AssignedPickups — improved status update and debug info
 * Now includes a Collector Sidebar for consistent layout with dashboard
 *
 * Save/replace: src/pages/AssignedPickups.tsx
 */

/* ---------------------- Sidebar + page styles ---------------------- */
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

/* AssignedPickups styles */
.wrap { padding: 20px; min-height: 60vh; }
.center { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px; }
.loader {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  border: 4px solid #e6e6e6;
  border-top-color: #2c3e50;
  animation: spin 1s linear infinite;
}
.card {
  display: flex; gap: 16px; padding: 16px; border-radius: 10px; background: var(--card); box-shadow: var(--shadow-sm);
  align-items: flex-start;
}
.cardLeft { flex: 1; }
.cardRight { width: 180; display: flex; align-items: flex-start; justify-content: flex-end; }
.row { display:flex; align-items:center; gap:12px; }
.user { display:flex; flex-direction:column; }
.userName { font-weight:700; font-size:16px; }
.muted { color:#666; font-size:13px; }
.meta { marginTop:6px; color:#333; fontSize:14px; }
.status {
  padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; text-transform: capitalize; display: inline-block;
}
.actionButton {
  padding: 8px 12px; border-radius: 8px; border: none; background-color: #2c3e50; color: #fff; cursor: pointer; font-weight: 700; text-decoration: none; text-align: center; display: inline-block;
}
.button { background-color: #2c3e50; color: #fff; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
.buttonAlt { background-color: #fff; color: #2c3e50; border: 1px solid #ddd; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
.toast { background: #0b6efd; color: #fff; padding: 8px 12px; border-radius: 8px; display: inline-block; margin-bottom: 12px; }

/* responsive */
@media (max-width: 980px) {
  .collector-sidebar { display:none; }
  .collector-main { padding:16px; }
}
`;

/* ---------------------- helper utilities ---------------------- */

type UserRef = {
  _id?: string;
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
};

type PickupStatus = "Pending" | "Scheduled" | "Picked" | "Collected" | string;

type Pickup = {
  _id: string;
  user: UserRef;
  wasteType: string;
  quantity: number;
  status: PickupStatus;
  image?: string | null;
  createdAt?: string;
  location?: string;
};

const PAGE_SIZE = 10;

const statusStyle = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "collected" || s === "completed") {
    return { background: "#e6ffef", color: "#1b8f4a" };
  }
  if (s === "picked" || s === "scheduled") {
    return { background: "#fff8e6", color: "#8a6d00" };
  }
  return { background: "#f2f4f7", color: "#333" };
};

const NAV_LINKS = [
  { to: "/collector", label: "Overview", key: "overview" },
  { to: "/collector/assigned", label: "Assigned Pickups", key: "assigned" },
  { to: "/collector/earnings", label: "Earnings", key: "earnings" },
  { to: "/collector/history", label: "Pickup History", key: "history" },
  { to: "/collector/analytics", label: "Performance / Analytics", key: "analytics" },
  { to: "/profile", label: "Profile", key: "profile" },
];

function iconFor(key: string) {
  switch (key) {
    case "overview": return "🏠";
    case "assigned": return "📦";
    case "earnings": return "💰";
    case "history": return "📜";
    case "analytics": return "📈";
    case "profile": return "👤";
    default: return "•";
  }
}

/* ---------------------- Component ---------------------- */

export default function AssignedPickups(): JSX.Element {
  const navigate = useNavigate();

  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  // sidebar collapsed responsive state
  const [collapsed, setCollapsed] = useState<boolean>(false);
  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth < 880);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchAssigned = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Pickup[] | { data: Pickup[] }>("/api/waste/collector/assigned", { signal });
      const items: Pickup[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setPickups(items);
    } catch (err: any) {
      if (err?.code === "ERR_CANCELED") return;
      console.error("Failed to load assigned pickups", err);
      setError(err?.response?.data?.message || "Failed to load pickups");
      if (err?.response?.status === 401) {
        setToast("Session expired — please login again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAssigned(controller.signal);
    return () => controller.abort();
  }, [fetchAssigned]);

  const setUpdating = (id: string, v: boolean) =>
    setUpdatingIds((s) => {
      const copy = { ...s };
      if (v) copy[id] = true;
      else delete copy[id];
      return copy;
    });

  async function tryUpdateEndpoints(id: string, statusPayload: any) {
    const tried: { url: string; method: string; res?: any; err?: any }[] = [];

    const attempts: { method: "patch" | "post" | "put"; url: string; body?: any }[] = [
      { method: "patch", url: `/api/waste/${id}/status`, body: statusPayload }, // common
      { method: "patch", url: `/api/waste/${id}`, body: statusPayload }, // servers that accept PATCH to resource
      { method: "post", url: `/api/waste/${id}/status`, body: statusPayload }, // alternative
      { method: "put", url: `/api/waste/complete/${id}` }, // older pattern to mark complete
      { method: "post", url: `/api/waste/complete/${id}` }, // other servers use POST
    ];

    for (const a of attempts) {
      try {
        let res;
        if (a.method === "patch") res = await api.patch(a.url, a.body);
        else if (a.method === "post") res = await api.post(a.url, a.body);
        else if (a.method === "put") res = await api.put(a.url, a.body);
        tried.push({ url: a.url, method: a.method, res });
        if (res && res.status >= 200 && res.status < 300) {
          return { ok: true, used: a, res, tried };
        }
      } catch (err: any) {
        tried.push({ url: a.url, method: a.method, err });
        const code = err?.response?.status;
        if (code && code !== 404 && code !== 409) {
          return { ok: false, used: a, err, tried };
        }
      }
    }
    return { ok: false, tried };
  }

  const updatePickupStatus = async (id: string, serverStatus: string) => {
    const confirmMsg =
      serverStatus.toLowerCase() === "picked"
        ? "Mark this pickup as 'Picked Up'?"
        : serverStatus.toLowerCase() === "collected"
        ? "Mark this pickup as 'Collected'? This will finalize the job."
        : `Change status to ${serverStatus}?`;

    if (!window.confirm(confirmMsg)) return;

    setUpdating(id, true);

    const prev = pickups;
    // optimistic update
    setPickups((cur) => cur.map((p) => (p._id === id ? { ...p, status: serverStatus } : p)));

    try {
      const payload = { status: serverStatus };
      const result = await tryUpdateEndpoints(id, payload);

      if (result.ok) {
        // success — refresh to get canonical server state
        await fetchAssigned();
        setToast("Status updated");
      } else {
        console.warn("All endpoints failed or returned non-OK:", result);
        const last = result.tried?.slice(-1)[0];
        const serverMsg = last?.err?.response?.data?.message ?? last?.err?.message ?? "Failed to update status";
        setPickups(prev); // rollback optimistic
        setToast(serverMsg);
      }
    } catch (err: any) {
      console.error("Failed to update status", err);
      setPickups(prev);
      setToast(err?.response?.data?.message || err?.message || "Failed to update status. Please try again.");
    } finally {
      setUpdating(id, false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleView = (id: string) => navigate(`/track/${id}`);

  const visible = useMemo(() => pickups.slice(0, page * PAGE_SIZE), [pickups, page]);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  }, [navigate]);

  if (loading) {
    return (
      <div className="collector-root">
        <style>{css}</style>
        <aside className="collector-sidebar" aria-hidden />
        <main className="collector-main">
          <div className="wrap">
            <div className="center">
              <div className="loader" aria-hidden />
              <div>Loading assigned pickups…</div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
          <div style={{ fontWeight: 700 }}>{(() => {
            try { const u = localStorage.getItem("user"); return u ? JSON.parse(u).name ?? "Collector" : "Collector"; } catch { return "Collector"; }
          })()}</div>
          <button onClick={logout} style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: "#e74c3c", color: "#fff", border: "none", cursor: "pointer" }}>
            <span style={{ marginRight: 8 }}>🚪</span>
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      <main className="collector-main" role="main">
        <header className="collector-header">
          <div>
            <h1 className="collector-title">Assigned Pickups</h1>
            <div className="collector-sub">Pickups currently assigned to you</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ color: "#666" }}>{pickups.length} assigned</div>
            <button onClick={() => fetchAssigned()} className="button">{loading ? "Refreshing…" : "Refresh"}</button>
          </div>
        </header>

        <section>
          {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}

          {error ? (
            <div style={{ padding: 20, color: "crimson" }}>{error}</div>
          ) : !pickups.length ? (
            <div style={{ padding: 20 }}>No assigned pickups</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {visible.map((p) => (
                <article key={p._id} className="card" aria-labelledby={`pickup-${p._id}`}>
                  <div className="cardLeft">
                    <div className="row">
                      <div>
                        <div className="userName">{p.user?.name ?? "Unknown"}</div>
                        <div className="muted">{p.user?.phone ?? "No phone"}</div>
                      </div>

                      <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <div className="status" style={statusStyle(p.status)}>{String(p.status ?? "").toUpperCase()}</div>
                        <div className="muted">{p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div style={{ marginTop: 6 }}><strong>Waste:</strong> {p.wasteType}</div>
                      <div style={{ marginTop: 6 }}><strong>Quantity:</strong> {p.quantity} kg</div>
                      {p.location && <div style={{ marginTop: 6 }}><strong>Location:</strong> {p.location}</div>}
                      {p.user?.address && <div style={{ marginTop: 6 }}><strong>Address:</strong> {p.user.address}</div>}
                    </div>

                    {p.image && (
                      <div style={{ marginTop: 10 }}>
                        <img src={p.image} alt={`Preview of ${p.wasteType}`} style={{ maxWidth: 220, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} loading="lazy" />
                      </div>
                    )}
                  </div>

                  <div className="cardRight">
                    <a
                      href={p.user?.phone ? `tel:${p.user.phone}` : "#"}
                      onClick={(e) => { if (!p.user?.phone) { e.preventDefault(); alert("No phone number available"); } }}
                      className="actionButton"
                      aria-label={`Call ${p.user?.name ?? "user"}`}
                      style={{ textDecoration: "none", textAlign: "center" }}
                    >
                      Call user
                    </a>

                    <button onClick={() => handleView(p._id)} className="actionButton" style={{ background: "#fff", color: "#2c3e50", border: "1px solid #ddd" }}>
                      View details
                    </button>

                    {String(p.status).toLowerCase() !== "picked" && (
                      <button onClick={() => updatePickupStatus(p._id, "Picked")} disabled={!!updatingIds[p._id]} className="actionButton" style={{ background: "#f39c12" }}>
                        {updatingIds[p._id] ? "Updating…" : "Mark picked"}
                      </button>
                    )}

                    {String(p.status).toLowerCase() === "picked" && (
                      <button onClick={() => updatePickupStatus(p._id, "Collected")} disabled={!!updatingIds[p._id]} className="actionButton" style={{ background: "#27ae60" }}>
                        {updatingIds[p._id] ? "Updating…" : "Mark completed"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div style={{ marginTop: 18 }}>
          {page * PAGE_SIZE < pickups.length && <button onClick={() => setPage((p) => p + 1)} className="button">Load more</button>}
          <div style={{ marginTop: 12 }}><Link to="/dashboard" style={{ color: "#0b6efd" }}>← Back to dashboard</Link></div>
        </div>
      </main>
    </div>
  );
}

/* inject spinner keyframes */
(() => {
  if (typeof document === "undefined") return;
  const id = "assigned-pickups-spinner";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
})();