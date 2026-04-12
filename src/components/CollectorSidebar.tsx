import { useCallback, useContext, useEffect, useMemo, useState, type JSX } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";

const NAV_LINKS = [
  { to: "/collector/dashboard", label: "Dashboard", key: "overview" },
  { to: "/collector/assigned", label: "Assigned Pickups", key: "assigned" },
  { to: "/collector/rewards", label: "Rewards", key: "rewards" },
  { to: "/collector/history", label: "Pickup History", key: "history" },
  { to: "/collector/analytics", label: "Performance / Analytics", key: "analytics" },
  { to: "/profile", label: "Profile", key: "profile" },
];

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
.collector-brand .icon { width:28px; height:28px; display:inline-block; flex-shrink:0; }
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

/* small helper for icon sizing */
.cs-icon { width:18px; height:18px; display:inline-block; flex-shrink:0; }
`;

/* ---------- Inline SVG icons (accessible) ---------- */
const IconWrapper = ({ children }: { children: React.ReactNode }) => (
  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28 }} aria-hidden>{children}</span>
);

const OverviewIcon = ({ className = "cs-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <rect x="13" y="3" width="8" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
    <rect x="13" y="10" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const AssignedIcon = ({ className = "cs-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path d="M3 7h18v10H3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 7v-2M16 7v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 12h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const RewardsIcon = ({ className = "cs-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path d="M12 3l2.2 4.5L19 9l-4 3.5L16.4 18 12 15.5 7.6 18 9 12.5 5 9l4.8-1.5L12 3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HistoryIcon = ({ className = "cs-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path d="M21 12a9 9 0 1 1-3.1-6.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AnalyticsIcon = ({ className = "cs-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path d="M4 19v-9M10 19V8M16 19V4M22 19v-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const BellIcon = ({ className = "db-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M15 17h5l-1.4-1.8A3 3 0 0 0 18 13.2V10a6 6 0 1 0-12 0v3.2a3 3 0 0 0-.6 2L4 17h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.7 20a2.5 2.5 0 0 1-3.4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ProfileIcon = ({ className = "cs-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
    <path d="M4 20c1.5-4 7-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LogoutIcon = ({ className = "cs-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 12H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---------- CollectorSidebar component ---------- */
export default function CollectorSidebar(): JSX.Element {
  const navigate = useNavigate();
  const auth = useContext(AuthContext) as any;

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

  const renderIcon = (key: string) => {
    switch (key) {
      case "overview": return <OverviewIcon />;
      case "assigned": return <AssignedIcon />;
      case "rewards": return <RewardsIcon />;
      case "history": return <HistoryIcon />;
      case "notifications": return <BellIcon />;
      case "analytics": return <AnalyticsIcon />;
      case "profile": return <ProfileIcon />;
      default: return <ProfileIcon />;
    }
  };

  return (
    <aside className="collector-sidebar" style={{ width: collapsed ? 88 : 260 }} aria-label="Collector navigation">
      <style>{sidebarCss}</style>

      <div className="collector-brand" style={{ gap: 8 }}>
        <div className="icon" aria-hidden>
          <IconWrapper><OverviewIcon /></IconWrapper>
        </div>
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
            <IconWrapper>{renderIcon(l.key)}</IconWrapper>
            {!collapsed && <span>{l.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="collector-footer" style={{ marginTop: "auto" }}>
        {!collapsed && <div style={{ fontWeight: 700 }}>{userName ?? firstName}</div>}
        <button
          onClick={logout}
          style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: "#e74c3c", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, justifyContent: collapsed ? "center" : "flex-start" }}
        >
          <IconWrapper><LogoutIcon /></IconWrapper>
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}