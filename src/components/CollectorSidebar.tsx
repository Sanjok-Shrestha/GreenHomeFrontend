import React, { useCallback, useContext, useEffect, useMemo, useState, type JSX } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";

const NAV_LINKS = [
  { to: "/collector/dashboard", label: "Dashboard", key: "overview" },
  { to: "/collector/assigned", label: "Assigned Pickups", key: "assigned" },
  // changed: point to the combined rewards page instead of separate earnings page
  { to: "/collector/rewards", label: "Rewards", key: "earnings" },
  { to: "/collector/history", label: "Pickup History", key: "history" },
  { to: "/collector/analytics", label: "Performance / Analytics", key: "analytics" },
  { to: "/profile", label: "Profile", key: "profile" },
];

function iconFor(key: string) {
  switch (key) {
    case "overview": return "🏠";
    case "assigned": return "📦";
    case "Rewards": return "🎁";
    case "history": return "📜";
    case "analytics": return "📈";
    case "profile": return "👤";
    default: return "•";
  }
}

const sidebarCss = `
/* Sidebar-only scoped styles */
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

@media (max-width: 980px) {
  .collector-sidebar { display:none; }
}
`;

/* Small typed shape for AuthContext so TypeScript knows setAuthState exists */
type AuthContextShape = {
  user?: any;
  roleState?: string;
  setAuthState?: (s: { isAuth: boolean; roleState: string }) => void;
};

export default function CollectorSidebar(): JSX.Element {
  const navigate = useNavigate();
  const auth = useContext(AuthContext) as AuthContextShape | undefined;

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setUserName(parsed?.name ?? null);
      } catch {
        setUserName(null);
      }
    }
  }, []);

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth < 880);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const firstName = useMemo(() => (userName?.split?.(" ")?.[0] ?? "Collector"), [userName]);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    try { auth?.setAuthState?.({ isAuth: false, roleState: "" }); } catch {}
    navigate("/login", { replace: true });
  }, [navigate, auth]);

  return (
    <aside className="collector-sidebar" style={{ width: collapsed ? 88 : 260 }} aria-label="Collector navigation">
      <style>{sidebarCss}</style>

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
            end={l.to === "/collector/dashboard"}
            className={({ isActive }) => (isActive ? "active" : "")}
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
            <span style={{ width: 28, textAlign: "center" }} aria-hidden>{iconFor(l.key)}</span>
            {!collapsed && <span>{l.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="collector-footer" style={{ marginTop: "auto" }}>
        {!collapsed && <div style={{ fontWeight: 700 }}>{userName ?? firstName}</div>}
        <button
          onClick={logout}
          style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: "#e74c3c", color: "#fff", border: "none", cursor: "pointer" }}
        >
          <span style={{ marginRight: 8 }}>🚪</span>
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}