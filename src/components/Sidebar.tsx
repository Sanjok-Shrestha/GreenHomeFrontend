import React, { useContext, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";

/**
 * Sidebar component (updated to match Certificates layout)
 * - width/min-width = 264px
 * - sticky/full-height so it lines up with ct-page
 */

const sidebarCss = `
/* Sidebar styles (moved from Dashboard) */
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
}

.db-logo-text {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
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

/* Responsive: hide on small screens (same behavior as Certificates sidebar) */
@media (max-width:980px) {
  .db-sidebar { display: none; }
}
`;

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

  // You can replace these buttons with NavLink to get active link styling via router if desired.
  return (
    <>
      <style>{sidebarCss}</style>
      <div className="db-sidebar sidebar-root" role="navigation" aria-label="Main navigation">
        <div className="db-logo">
          <h2 className="db-logo-text">🏡 GreenHome</h2>
        </div>

        <nav className="db-nav" aria-label="Dashboard navigation">
          <button className="db-nav-item db-nav-item--active" onClick={() => navigate("/dashboard")}>
            <span aria-hidden>📊</span> Dashboard
          </button>
          <button className="db-nav-item" onClick={() => navigate("/pickups")}>
            <span aria-hidden>🚚</span> Pickup Status
          </button>
          <button className="db-nav-item" onClick={() => navigate("/rewards")}>
            <span aria-hidden>🎁</span> Rewards
          </button>
          <button className="db-nav-item" onClick={() => navigate("/certificates")}>
            <span aria-hidden>📜</span> Certificates
          </button>
          <button className="db-nav-item" onClick={() => navigate("/profile")}>
            <span aria-hidden>👤</span> Profile
          </button>

          <button className="db-nav-item--logout" onClick={handleLogout}>
            <span aria-hidden>🚪</span> Logout
          </button>
        </nav>
      </div>
    </>
  );
}