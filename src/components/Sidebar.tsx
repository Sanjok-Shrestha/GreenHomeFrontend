// src/components/Sidebar.tsx
import { useContext, type JSX } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../App";

/* Sidebar styles */
const sidebarCss = `
.db-sidebar {
  width: 264px;
  min-width: 264px;
  background-color: #2c3e50;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  box-sizing: border-box;
  position: sticky;
  top: 0;
  height: 100vh;
}

.db-logo {
  padding: 0 20px 30px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  gap: 12px;
}

.db-logo-text {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.4px;
  color: #fff;
}

.db-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 12px;
  flex: 1;
  box-sizing: border-box;
}

.db-nav-item {
  background: transparent;
  border: none;
  color: #fff;
  padding: 12px 16px;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  transition: background-color 0.18s ease, transform 0.12s ease;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.db-nav-item:hover {
  background-color: #34495e;
  transform: translateY(-1px);
}

.db-nav-item--active {
  background-color: #34495e;
  font-weight: 700;
}

.db-nav-item--logout {
  background: #e74c3c;
  border: none;
  color: #fff;
  padding: 14px 18px;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  margin-top: auto;
  transition: background-color 0.18s ease, transform 0.12s ease;
  width: 100%;
  display:flex;
  align-items:center;
  gap:10px;
}

.db-nav-item--logout:hover {
  background-color: #c0392b;
  transform: translateY(-1px);
}

@media (max-width:980px) {
  .db-sidebar { display: none; }
}

.db-icon { width: 18px; height: 18px; display: inline-block; flex-shrink: 0; }
.db-logo-icon { width: 28px; height: 28px; flex-shrink: 0; }
`;

/* SVG icons */
const LogoIcon = ({ className = "db-logo-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 11.5v7a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1v-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DashboardIcon = ({ className = "db-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="13" y="3" width="8" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/><rect x="13" y="10" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>
);

const TruckIcon = ({ className = "db-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden><rect x="1" y="3" width="13" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.4"/><path d="M14 8h6l3 4v4h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6.5" cy="19.5" r="1.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="18.5" cy="19.5" r="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>
);

const HistoryIcon = ({ className = "db-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden><path d="M21 12a9 9 0 1 1-3.1-6.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const BellIcon = ({ className = "db-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M15 17h5l-1.4-1.8A3 3 0 0 0 18 13.2V10a6 6 0 1 0-12 0v3.2a3 3 0 0 0-.6 2L4 17h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.7 20a2.5 2.5 0 0 1-3.4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CalendarIcon = ({ className = "db-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M16 3v4M8 3v4M3 11h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
);

const GiftIcon = ({ className = "db-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden><rect x="3" y="8" width="18" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M12 8v13M7 6c1-1 3-1 5 1s1 5-3 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 6c-1-1-3-1-5 1s-1 5 3 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const CertificateIcon = ({ className = "db-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden><rect x="3" y="3" width="14" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.4"/><path d="M7 15v6l3-2 3 2v-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const UserIcon = ({ className = "db-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M4 20c1.5-4 7-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const LogoutIcon = ({ className = "db-icon" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden><path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

/* Sidebar component */
export default function Sidebar(): JSX.Element {
  const navigate = useNavigate();
  const { setAuthState } = useContext(AuthContext);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    try { setAuthState({ isAuth: false, roleState: "" }); } catch {}
    navigate("/login", { replace: true });
  };

  return (
    <>
      <style>{sidebarCss}</style>
      <div className="db-sidebar sidebar-root" role="navigation" aria-label="Main navigation">
        <div className="db-logo">
          <LogoIcon />
          <h2 className="db-logo-text">GreenHome</h2>
        </div>

        <nav className="db-nav" aria-label="Dashboard navigation">
          <NavLink to="/dashboard" className={({ isActive }) => `db-nav-item ${isActive ? "db-nav-item--active" : ""}`}>
            <DashboardIcon /> <span>Dashboard</span>
          </NavLink>

          <NavLink to="/pickups" className={({ isActive }) => `db-nav-item ${isActive ? "db-nav-item--active" : ""}`}>
            <TruckIcon /> <span>Pickup Status</span>
          </NavLink>

          <NavLink to="/history" className={({ isActive }) => `db-nav-item ${isActive ? "db-nav-item--active" : ""}`}>
            <HistoryIcon /> <span>History</span>
          </NavLink>

          <NavLink to="/notifications" className={({ isActive }) => `db-nav-item ${isActive ? "db-nav-item--active" : ""}`}>
            <BellIcon /> <span>Notifications</span>
          </NavLink>

          <NavLink to="/schedule-pickup" className={({ isActive }) => `db-nav-item ${isActive ? "db-nav-item--active" : ""}`}>
            <CalendarIcon /> <span>Schedule Pickup</span>
          </NavLink>

          <NavLink to="/rewards" className={({ isActive }) => `db-nav-item ${isActive ? "db-nav-item--active" : ""}`}>
            <GiftIcon /> <span>Rewards</span>
          </NavLink>

          <NavLink to="/certificates" className={({ isActive }) => `db-nav-item ${isActive ? "db-nav-item--active" : ""}`}>
            <CertificateIcon /> <span>Certificates</span>
          </NavLink>

          <NavLink to="/profile" className={({ isActive }) => `db-nav-item ${isActive ? "db-nav-item--active" : ""}`}>
            <UserIcon /> <span>Profile</span>
          </NavLink>

          <button className="db-nav-item--logout" onClick={handleLogout}>
            <LogoutIcon /> <span>Logout</span>
          </button>
        </nav>
      </div>
    </>
  );
}