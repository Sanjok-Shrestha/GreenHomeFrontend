import React, { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

type LinkItem = { to: string; label: string; key: string; icon?: string };

const LINKS: LinkItem[] = [
  { to: "/admin", label: "Admin Home", key: "home", icon: "🏠" },
  { to: "/admin/certificates/create", label: "Create Certificate", key: "create-certificate", icon: "📝" }, // updated
  { to: "/admin/collectors", label: "Manage Collectors", key: "manage-collectors", icon: "🧑‍💼" },
  { to: "/admin/users", label: "Manage Users", key: "manage-users", icon: "👥" },
  { to: "/admin/pricing", label: "Pricing Management", key: "pricing", icon: "💲" },
  { to: "/admin/reports", label: "Reports", key: "reports", icon: "📊" },
  { to: "/admin/waste-categories", label: "Waste Categories", key: "waste-categories", icon: "♻️" },
  { to: "/admin/assign-pickups", label: "Assign Pickups", key: "assign-pickups", icon: "📦" },
];

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
    // optionally notify auth context here
    navigate("/login", { replace: true });
  };

  return (
    <aside className={`admin-sidebar ${collapsed ? "admin-sidebar--collapsed" : ""}`} aria-label="Admin navigation">
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
              <div className="admin-sidebar__logo">Admin</div>
              <div className="admin-sidebar__title">Dashboard</div>
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
            <span className="admin-sidebar__icon" aria-hidden>{l.icon ?? "•"}</span>
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
          <button className="admin-sidebar__logout" onClick={logout} title="Logout">
            {!collapsed ? "Logout" : "⎋"}
          </button>
        </div>
      </div>
    </aside>
  );
}