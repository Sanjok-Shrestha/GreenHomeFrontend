import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../App";

/**
 * Role-aware NavBar — shows "Home" only for guests (not-signed-in)
 */
export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext); // { isAuth, roleState, setAuthState }

  const [open, setOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const u = JSON.parse(user);
        setUserName(u?.name ?? null);
      } catch {
        setUserName(null);
      }
    } else {
      setUserName(null);
    }
  }, [auth?.isAuth]);

  // Hide NavBar on auth pages where you intentionally don't want it
  const hideOnPaths = ["/login", "/register"];
  if (hideOnPaths.includes(location.pathname)) return null;

  const initials = userName ? userName.trim().charAt(0).toUpperCase() : "U";

  // Links visible for everyone (but excluding 'Home' if user is signed-in)
  const commonLinksGuest = [
    { to: "/", label: "Home" },
    { to: "/explore", label: "Explore" },
    { to: "/rewards", label: "Rewards" },
  ];

  const commonLinksAuth = [
    { to: "/explore", label: "Explore" },
    { to: "/rewards", label: "Rewards" },
  ];

  // Auth/role specific links
  const userLinks = [
    { to: "/post-waste", label: "Post Waste" },
    { to: "/leaderboard", label: "Leaderboard" },
  ];

  const collectorLinks = [
    { to: "/collector", label: "Collector" },
    { to: "/collector/assigned", label: "Assigned" },
  ];

  const adminLinks = [{ to: "/admin", label: "Admin" }];

  // build links to render
  const linksToRender = auth?.isAuth ? [...commonLinksAuth] : [...commonLinksGuest];
  if (auth?.isAuth) {
    linksToRender.push(...userLinks);
    if (auth.roleState === "collector") linksToRender.push(...collectorLinks);
    if (auth.roleState === "admin") linksToRender.push(...adminLinks);
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    try {
      auth?.setAuthState?.({ isAuth: false, roleState: "" });
    } catch {}
    navigate("/", { replace: true });
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.brand}>
          <Link to="/" style={styles.logoLink}>
            <span style={styles.logo}>♻️</span>
            <span style={styles.brandText}>GreenHome</span>
          </Link>
        </div>

        <nav style={{ ...styles.nav, ...(open ? styles.navOpen : {}) }} aria-label="Main navigation">
          {linksToRender.map((l) => (
            <Link key={l.to} to={l.to} style={styles.navLink} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div style={styles.actions}>
          {auth?.isAuth ? (
            <div style={styles.userWrapper}>
              <button
                aria-label="Open user menu"
                onClick={() => setShowUserMenu((v) => !v)}
                style={styles.profileBtn}
                title={userName ?? "User"}
              >
                {initials}
              </button>

              {showUserMenu && (
                <div style={styles.userMenu}>
                  <div style={styles.userMenuItem}>
                    <strong style={{ color: "#0b3e23" }}>{userName ?? "User"}</strong>
                  </div>
                  <Link to="/profile" style={styles.userMenuItem} onClick={() => setShowUserMenu(false)}>
                    Profile
                  </Link>
                  {auth.roleState === "collector" && (
                    <Link to="/collector" style={styles.userMenuItem} onClick={() => setShowUserMenu(false)}>
                      Collector
                    </Link>
                  )}
                  {auth.roleState === "admin" && (
                    <Link to="/admin" style={styles.userMenuItem} onClick={() => setShowUserMenu(false)}>
                      Admin
                    </Link>
                  )}
                  <button onClick={handleLogout} style={{ ...styles.userMenuItem, ...styles.logoutBtn }}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.authLinks}>
              <Link to="/login" style={styles.authLink}>
                Login
              </Link>
              <Link to="/register" style={{ ...styles.authLink, ...styles.ctaRegister }}>
                Get Started
              </Link>
            </div>
          )}

          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            style={{ ...styles.hamburger, ...(open ? styles.hamburgerOpen : {}) }}
          >
            <span style={styles.hbLine} />
            <span style={styles.hbLine} />
            <span style={styles.hbLine} />
          </button>
        </div>
      </div>
    </header>
  );
}

/* styles kept unchanged from your original file */
const styles: { [k: string]: React.CSSProperties | { [k: string]: React.CSSProperties } } = {
  header: {
    width: "100%",
    background: "#fff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
    position: "sticky",
    top: 0,
    zIndex: 60,
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "10px 16px",
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { display: "flex", alignItems: "center" },
  logoLink: { display: "flex", alignItems: "center", textDecoration: "none", color: "inherit", gap: 8 },
  logo: { fontSize: 22 },
  brandText: { fontWeight: 800, color: "#0b3e23" },

  nav: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  navOpen: {},
  navLink: {
    padding: "8px 10px",
    borderRadius: 8,
    textDecoration: "none",
    color: "#0b2a1a",
    fontWeight: 600,
    fontSize: 14,
  },

  actions: { display: "flex", gap: 12, alignItems: "center" },

  authLinks: { display: "flex", gap: 8, alignItems: "center" },
  authLink: { textDecoration: "none", color: "#0b6efd", padding: "6px 10px", borderRadius: 8 },
  ctaRegister: { background: "linear-gradient(90deg,#15b95a,#0ea158)", color: "#fff", padding: "8px 12px" },

  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "linear-gradient(90deg,#19bd4a,#0ea158)",
    color: "#fff",
    border: "none",
    fontWeight: 800,
    cursor: "pointer",
  },

  userWrapper: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
  },
  userMenu: {
    position: "absolute",
    right: 0,
    marginTop: 8,
    minWidth: 160,
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    transformOrigin: "top right",
    zIndex: 90,
  },
  userMenuItem: {
    padding: "8px 10px",
    textDecoration: "none",
    background: "transparent",
    border: "none",
    textAlign: "left",
    color: "#0b2a1a",
    cursor: "pointer",
    borderRadius: 8,
  },
  logoutBtn: { color: "#c0392b" },

  hamburger: {
    display: "none",
    width: 40,
    height: 40,
    borderRadius: 8,
    border: "none",
    background: "transparent",
    flexDirection: "column",
    justifyContent: "center",
    gap: 4,
    padding: 6,
    cursor: "pointer",
  },
  hamburgerOpen: {},
  hbLine: {
    display: "block",
    height: 2,
    background: "#0b2a1a",
    borderRadius: 2,
    width: 18,
  },

  // responsive
  "@media (max-width: 880px)": {
    nav: {
      position: "fixed",
      left: 0,
      right: 0,
      top: 64,
      background: "#fff",
      padding: 12,
      flexDirection: "column",
      gap: 8,
      display: "none",
    } as any,
    navOpen: {
      display: "flex",
    } as any,
    hamburger: {
      display: "inline-flex",
    } as any,
  },
};