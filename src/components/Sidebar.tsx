import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";

export default function Sidebar({ active }: { active?: string }) {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const userRaw = localStorage.getItem("user");
  let userName: string | null = null;
  try {
    userName = userRaw ? JSON.parse(userRaw).name ?? null : null;
  } catch {
    userName = null;
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    try {
      auth?.setAuthState?.({ isAuth: false, roleState: "" });
    } catch {}
    navigate("/login", { replace: true });
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <h2 style={styles.logoText}>GreenHome</h2>
        {userName && <div style={styles.logoSub}>{userName}</div>}
      </div>

      <nav style={styles.nav}>
        <button style={{ ...styles.navItem, ...(active === "dashboard" ? styles.navItemActive : {}) }} onClick={() => navigate("/dashboard")}>Dashboard</button>
        <button style={{ ...styles.navItem, ...(active === "post-waste" ? styles.navItemActive : {}) }} onClick={() => navigate("/post-waste")}>Post Waste</button>
        <button style={{ ...styles.navItem, ...(active === "pickups" ? styles.navItemActive : {}) }} onClick={() => navigate("/pickups")}>Pickup Status</button>
        <button style={{ ...styles.navItem, ...(active === "rewards" ? styles.navItemActive : {}) }} onClick={() => navigate("/rewards")}>Rewards</button>
        <button style={{ ...styles.navItem, ...(active === "profile" ? styles.navItemActive : {}) }} onClick={() => navigate("/profile")}>Profile</button>

        <button style={styles.navItemLogout} onClick={handleLogout}>Logout</button>
      </nav>
    </aside>
  );
}

const styles: { [k: string]: React.CSSProperties } = {
  sidebar: {
    width: 260,
    backgroundColor: "#2c3e50",
    color: "white",
    display: "flex",
    flexDirection: "column",
    padding: "20px 0",
    boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
    boxSizing: "border-box",
  },
  logo: {
    padding: "0 20px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    marginBottom: 6,
  },
  logoText: { margin: 0, fontSize: 20, fontWeight: 700 },
  logoSub: { marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.85)" },

  nav: { display: "flex", flexDirection: "column", gap: 6, padding: "14px 12px", flex: 1 },
  navItem: {
    background: "transparent",
    border: "none",
    color: "white",
    padding: "12px 14px",
    textAlign: "left",
    cursor: "pointer",
    borderRadius: 8,
    fontSize: 15,
    transition: "all 0.2s ease",
    fontWeight: 500,
  },
  navItemActive: { backgroundColor: "#34495e" },
  navItemLogout: {
    background: "#e74c3c",
    border: "none",
    color: "white",
    padding: "12px 14px",
    textAlign: "left",
    cursor: "pointer",
    borderRadius: 8,
    fontSize: 15,
    marginTop: "auto",
    fontWeight: 700,
  },
};