// src/components/AdminSidebar.tsx
import React, { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

type LinkItem = { to: string; label: string; key: string; icon?: string };

const LINKS: LinkItem[] = [
  { to: "/admin", label: "Admin Home", key: "home" },
  { to: "/admin/certificates/create", label: "Create Certificate", key: "create-certificate" },
  { to: "/admin/collectors", label: "Manage Collectors", key: "manage-collectors" },
  { to: "/admin/users", label: "Manage Users", key: "manage-users" },
  { to: "/admin/pricing", label: "Pricing Management", key: "pricing" },
  { to: "/admin/reports", label: "Reports", key: "reports" },
  { to: "/admin/waste-categories", label: "Waste Categories", key: "waste-categories" },
  { to: "/admin/assign-pickups", label: "Assign Pickups", key: "assign-pickups" },

  // NEW: Pending approvals page
  { to: "/admin/pending-approvals", label: "Pending Approvals", key: "pending-approvals" },
];

/* ---------- Inline SVG icons (small, consistent) ---------- */
const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="admin-sidebar__icon" aria-hidden>{children}</span>
);

const HomeIcon = () => (
  <Icon>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M3 10.5L12 4l9 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </Icon>
);

const CreateIcon = () => (
  <Icon>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M3 21l3-1 11-11a2.5 2.5 0 0 0 0-3.5 2.5 2.5 0 0 0-3.5 0L6.5 16 5.5 19 3 21z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 7l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </Icon>
);

const CollectorsIcon = () => (
  <Icon>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2 21c1.7-4 6-6 9-6s7.3 2 9 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </Icon>
);

const UsersIcon = () => (
  <Icon>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M17 21v-2a4 4 0 0 0-4-4H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  </Icon>
);

const PricingIcon = () => (
  <Icon>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M12 1v22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M17 5H9a4 4 0 1 0 0 8h6a4 4 0 1 1 0 8H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </Icon>
);

const ReportsIcon = () => (
  <Icon>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7 14v-4M11 17V9M15 13v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </Icon>
);

const RecycleIcon = () => (
  <Icon>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M21 12l-3 4-4-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 12l3-4 4 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 3v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 21v-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </Icon>
);

const BoxIcon = () => (
  <Icon>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M21 16V8a2 2 0 0 0-1-1.7L13 3a2 2 0 0 0-2 0L4 6.3A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7L11 21a2 2 0 0 0 2 0l7-3.3A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.27 6.96L12 11l8.73-4.04" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </Icon>
);

const ApprovalIcon = () => (
  <Icon>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.1"/>
    </svg>
  </Icon>
);

const LogoutIcon = () => (
  <Icon>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 12H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </Icon>
);

function renderIcon(key: string) {
  switch (key) {
    case "home": return <HomeIcon />;
    case "create-certificate": return <CreateIcon />;
    case "manage-collectors": return <CollectorsIcon />;
    case "manage-users": return <UsersIcon />;
    case "pricing": return <PricingIcon />;
    case "reports": return <ReportsIcon />;
    case "waste-categories": return <RecycleIcon />;
    case "assign-pickups": return <BoxIcon />;
    case "pending-approvals": return <ApprovalIcon />;
    default: return <HomeIcon />;
  }
}

/* ---------- AdminSidebar component ---------- */
export default function AdminSidebar(): React.ReactElement {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const userName = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return "Admin";
      const u = JSON.parse(raw);
      return (u?.name ?? u?.email ?? "Admin");
    } catch {
      return "Admin";
    }
  }, []);

  const logout = () => {
    ["accessToken", "token", "ada", "role"].forEach((k) => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  };

  return (
    <aside className={`admin-sidebar ${collapsed ? "admin-sidebar--collapsed" : ""}`} aria-label="Admin navigation" style={{ width: collapsed ? 88 : 240 }}>
      <div className="admin-sidebar__top">
        <div className="admin-sidebar__brand">
          <button
            className="admin-sidebar__collapse"
            aria-label="Toggle sidebar"
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? "»" : "«"}
          </button>

          {!collapsed && (
            <>
              <div className="admin-sidebar__logo" aria-hidden>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
                  <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 11.5v7a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1v-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="admin-sidebar__title">Admin Dashboard</div>
            </>
          )}
        </div>
      </div>

      <nav className="admin-sidebar__nav" role="navigation" aria-label="Admin pages">
        {LINKS.map((l) => (
          <NavLink
            key={l.key}
            to={l.to}
            className={({ isActive }) =>
              `admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""}`
            }
            title={l.label}
          >
            <div style={{ width: 28, display: "flex", justifyContent: "center" }} aria-hidden>
              {renderIcon(l.key)}
            </div>
            {!collapsed && <span className="admin-sidebar__label">{l.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar__bottom">
        <div className="admin-sidebar__user" title={userName}>
          <div className="admin-sidebar__avatar">{(userName?.charAt(0) ?? "A").toUpperCase()}</div>
          {!collapsed && <div className="admin-sidebar__username">{userName}</div>}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="admin-sidebar__logout" onClick={logout} title="Logout" aria-label="Logout" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LogoutIcon />
            {!collapsed && "Logout"}
          </button>
        </div>
      </div>
    </aside>
  );
}