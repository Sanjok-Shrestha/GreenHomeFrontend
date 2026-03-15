import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../App";
import api from "../api";

type WastePost = {
  _id: string;
  wasteType?: string;
  quantity?: number;
  price?: number;
  status?: string;
  pickupDate?: string | null;
  imageUrl?: string;
  createdAt?: string;
  [k: string]: any;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthState } = useContext(AuthContext);
  const [user, setUser] = useState<any>(null);

  // stats and recent posts
  const [totalPosted, setTotalPosted] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [recent, setRecent] = useState<WastePost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        // try to read points from stored user if present
        setPoints(parsed?.points ?? 0);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // fetch user's posts
        const res = await api.get("/api/waste/my-posts");
        const data: WastePost[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        if (!mounted) return;

        // compute stats
        setTotalPosted(data.length);
        setCompletedCount(data.filter((d) => String(d.status).toLowerCase() === "collected").length);
        setPendingCount(
          data.filter((d) => {
            const s = String(d.status || "").toLowerCase();
            return s === "pending" || s === "scheduled";
          }).length
        );

        // recent items (most recent first)
        const sorted = data
          .slice()
          .sort((a, b) => Number(new Date(b.createdAt || 0)) - Number(new Date(a.createdAt || 0)));
        setRecent(sorted.slice(0, 4));
      } catch (err: any) {
        console.error("Failed to load dashboard data", err);
        setError(err?.response?.data?.message || "Failed to load dashboard data");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setAuthState({ isAuth: false, roleState: "" });
    navigate("/login", { replace: true });
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <h2 style={styles.logoText}>🏡 GreenHome</h2>
        </div>

        <nav style={styles.nav}>
          <button style={{ ...styles.navItem, ...styles.navItemActive }}>📊 Dashboard</button>

          <button
            style={styles.navItem}
            onClick={() => navigate("/post-waste")}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#34495e")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            ♻️ Post Waste
          </button>

          <button
            style={styles.navItem}
            onClick={() => navigate("/pickups")}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#34495e")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            🚚 Pickup Status
          </button>

          <button
            style={styles.navItem}
            onClick={() => navigate("/rewards")}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#34495e")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            🎁 Rewards
          </button>

          <button
            style={styles.navItem}
            onClick={() => navigate("/profile")}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#34495e")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            👤 Profile
          </button>

          <button
            style={styles.navItemLogout}
            onClick={handleLogout}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#c0392b")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#e74c3c")}
          >
            🚪 Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.welcomeText}>Welcome back, {user?.name || "User"}!</h1>
            <p style={styles.subtitle}>Track your waste management and earn rewards</p>
          </div>
          <div style={styles.profileIcon}>{user?.name?.charAt(0).toUpperCase() || "U"}</div>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, ...styles.statCard1 }}>
            <div style={styles.statIcon}>♻️</div>
            <div>
              <p style={styles.statLabel}>Total Waste Posted</p>
              <h2 style={styles.statValue}>{loading ? "—" : totalPosted}</h2>
              <p style={styles.statChange}>{!loading ? `+${Math.max(0, totalPosted - 0)} this week` : ""}</p>
            </div>
          </div>

          <div style={{ ...styles.statCard, ...styles.statCard2 }}>
            <div style={styles.statIcon}>✅</div>
            <div>
              <p style={styles.statLabel}>Pickups Completed</p>
              <h2 style={styles.statValue}>{loading ? "—" : completedCount}</h2>
              <p style={styles.statChange}>+{!loading ? Math.max(0, completedCount - 0) : ""} this week</p>
            </div>
          </div>

          <div style={{ ...styles.statCard, ...styles.statCard3 }}>
            <div style={styles.statIcon}>🎁</div>
            <div>
              <p style={styles.statLabel}>Reward Points</p>
              <h2 style={styles.statValue}>{points}</h2>
              <p style={styles.statChange}>+50 this week</p>
            </div>
          </div>

          <div style={{ ...styles.statCard, ...styles.statCard4 }}>
            <div style={styles.statIcon}>⏳</div>
            <div>
              <p style={styles.statLabel}>Pending Pickups</p>
              <h2 style={styles.statValue}>{loading ? "—" : pendingCount}</h2>
              <p style={styles.statChange}>Awaiting collection</p>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div style={styles.contentGrid}>
          {/* Recent Activity (links to TrackPickup) */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📋 Recent Activity</h3>

            {loading ? (
              <p>Loading…</p>
            ) : error ? (
              <p style={{ color: "crimson" }}>{error}</p>
            ) : recent.length === 0 ? (
              <p style={{ color: "#666" }}>No recent activity</p>
            ) : (
              <div style={styles.activityList}>
                {recent.map((item) => (
                  <div key={item._id} style={styles.activityItem}>
                    <div style={{ ...styles.activityIcon, backgroundColor: "#d1ecf1" }}>♻️</div>
                    <div style={styles.activityContent}>
                      <Link to={`/track/${item._id}`} style={{ textDecoration: "none", color: "#10381f", fontWeight: 700 }}>
                        {item.wasteType ? item.wasteType.toString().toUpperCase() : "Waste"} • {item.quantity ?? "—"} kg
                      </Link>
                      <div style={{ fontSize: 12, color: "#95a5a6" }}>
                        {item.status} • {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Environmental Impact */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🌍 Environmental Impact</h3>
            <div style={styles.impactGrid}>
              <div style={styles.impactItem}>
                <p style={styles.impactValue}>24kg</p>
                <p style={styles.impactLabel}>Waste Recycled</p>
              </div>
              <div style={styles.impactItem}>
                <p style={styles.impactValue}>15kg</p>
                <p style={styles.impactLabel}>CO₂ Reduced</p>
              </div>
              <div style={styles.impactItem}>
                <p style={styles.impactValue}>8</p>
                <p style={styles.impactLabel}>Trees Saved</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

/* Styles remain the same as you provided earlier (copied for completeness) */
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f5f7fb",
  },
  sidebar: {
    width: "260px",
    backgroundColor: "#2c3e50",
    color: "white",
    display: "flex",
    flexDirection: "column",
    padding: "20px 0",
    boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
  },
  logo: {
    padding: "0 20px 30px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  logoText: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "600",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    padding: "20px 10px",
    flex: 1,
  },
  navItem: {
    background: "transparent",
    border: "none",
    color: "white",
    padding: "14px 18px",
    textAlign: "left",
    cursor: "pointer",
    borderRadius: "8px",
    fontSize: "15px",
    transition: "all 0.3s ease",
    fontWeight: "500",
  },
  navItemActive: {
    backgroundColor: "#34495e",
  },
  navItemLogout: {
    background: "#e74c3c",
    border: "none",
    color: "white",
    padding: "14px 18px",
    textAlign: "left",
    cursor: "pointer",
    borderRadius: "8px",
    fontSize: "15px",
    marginTop: "auto",
    fontWeight: "600",
    transition: "all 0.3s ease",
  },
  main: {
    flex: 1,
    padding: "30px",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  welcomeText: {
    margin: 0,
    fontSize: "32px",
    color: "#2c3e50",
    fontWeight: "700",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#7f8c8d",
    fontSize: "16px",
  },
  profileIcon: {
    width: "55px",
    height: "55px",
    borderRadius: "50%",
    backgroundColor: "#19fd0d",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "bold",
    boxShadow: "0 4px 12px rgba(25,253,13,0.3)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  statCard: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  statCard1: { borderLeft: "5px solid #27ae60" },
  statCard2: { borderLeft: "5px solid #3498db" },
  statCard3: { borderLeft: "5px solid #f39c12" },
  statCard4: { borderLeft: "5px solid #e74c3c" },
  statIcon: { fontSize: "45px" },
  statLabel: { margin: 0, color: "#7f8c8d", fontSize: "14px", fontWeight: "500" },
  statValue: { margin: "8px 0 5px 0", fontSize: "36px", color: "#2c3e50", fontWeight: "700" },
  statChange: { margin: 0, fontSize: "12px", color: "#27ae60" },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  cardTitle: { margin: "0 0 20px 0", fontSize: "18px", color: "#2c3e50", fontWeight: "600" },
  actionButtons: { display: "flex", flexDirection: "column", gap: "12px" },
  actionButton: {
    backgroundColor: "#19fd0d",
    color: "white",
    border: "none",
    padding: "16px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 10px rgba(25,253,13,0.2)",
  },
  actionIcon: { fontSize: "22px" },
  activityList: { display: "flex", flexDirection: "column", gap: "12px" },
  activityItem: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "12px",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
  },
  activityIcon: {
    fontSize: "24px",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: { flex: 1 },
  activityTitle: { margin: 0, fontSize: "14px", color: "#2c3e50", fontWeight: "600" },
  activityTime: { margin: "4px 0 0 0", fontSize: "12px", color: "#95a5a6" },
  impactGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px" },
  impactItem: { textAlign: "center", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "10px" },
  impactValue: { margin: 0, fontSize: "28px", fontWeight: "700", color: "#27ae60" },
  impactLabel: { margin: "8px 0 0 0", fontSize: "12px", color: "#7f8c8d", fontWeight: "500" },
};