import React, { type FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

/**
 * AdminDashboard — improved
 *
 * Improvements:
 * - Responsive card grid
 * - Small admin overview (stats) fetched from /api/admin/overview if available
 * - Accessible keyboard focus styles and aria attributes
 * - Confirm logout uses a simple accessible modal instead of window.confirm
 * - Toast for non-blocking feedback
 * - Clearer visual hierarchy and actionable cards
 */

type Overview = {
  collectorsPending?: number;
  reportsOpen?: number;
  activeUsers?: number;
  revenueThisMonth?: number;
};

const AdminDashboard: FC = () => {
  const navigate = useNavigate();

  const [overview, setOverview] = useState<Overview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const logoutConfirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // try to fetch basic admin overview; fail gracefully if endpoint not available
    let mounted = true;
    (async () => {
      setLoadingOverview(true);
      try {
        const res = await api.get("/api/admin/overview");
        if (!mounted) return;
        setOverview(res.data ?? null);
      } catch {
        // ignore errors — overview is optional
      } finally {
        if (mounted) setLoadingOverview(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // quick formatted numbers
  const stats = useMemo(() => {
    return [
      { label: "Collectors pending", value: overview?.collectorsPending ?? "—" },
      { label: "Open reports", value: overview?.reportsOpen ?? "—" },
      { label: "Active users", value: overview?.activeUsers ?? "—" },
      { label: "Revenue (month)", value: overview?.revenueThisMonth ? `Rs ${overview.revenueThisMonth}` : "—" },
    ];
  }, [overview]);

  const showToast = useCallback((msg: string, ttl = 2800) => {
    setToast(msg);
    setTimeout(() => setToast(null), ttl);
  }, []);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const openLogout = useCallback(() => {
    setLogoutModalOpen(true);
    // focus will be moved to confirm button via ref after render
    setTimeout(() => logoutConfirmBtnRef.current?.focus(), 0);
  }, []);

  const cancelLogout = useCallback(() => setLogoutModalOpen(false), []);

  const confirmLogout = useCallback(() => {
    // perform logout actions
    try {
      localStorage.clear();
      showToast("Signed out");
      navigate("/login", { replace: true });
    } catch {
      showToast("Failed to sign out");
    }
  }, [navigate, showToast]);

  return (
    <div style={wrap}>
      <header style={header}>
        <div>
          <h1 style={title}>Admin Dashboard</h1>
          <p style={subtitle}>Manage pricing, verify collectors, review reports and system metrics</p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            style={primaryBtn}
            onClick={() => handleNavigate("/admin/pricing")}
            title="Manage pricing"
            aria-label="Manage pricing"
          >
            Manage Pricing
          </button>
          <button
            style={ghostBtn}
            onClick={() => handleNavigate("/admin/collectors")}
            title="Verify collectors"
            aria-label="Verify collectors"
          >
            Verify Collectors
          </button>
          <button
            style={ghostBtn}
            onClick={() => handleNavigate("/admin/reports")}
            title="View reports"
            aria-label="View reports"
          >
            View Reports
          </button>
        </div>
      </header>

      <section style={statsRow} aria-labelledby="overview-heading">
        <h2 id="overview-heading" style={{ position: "absolute", left: -9999, top: "auto", width: 1, height: 1, overflow: "hidden" }}>
          Overview
        </h2>

        {loadingOverview ? (
          <div style={statsLoading}>Loading overview…</div>
        ) : (
          stats.map((s) => (
            <div key={s.label} style={statCard} role="group" aria-label={s.label}>
              <div style={statValue}>{s.value}</div>
              <div style={statLabel}>{s.label}</div>
            </div>
          ))
        )}
      </section>

      <section style={grid}>
        <ActionCard
          title="Manage Pricing"
          desc="Update pricing tiers and reward rates."
          onClick={() => handleNavigate("/admin/pricing")}
          icon="💲"
          hint={`${overview?.revenueThisMonth ? `Rs ${overview.revenueThisMonth} this month` : ""}`}
        />

        <ActionCard
          title="Verify Collectors"
          desc="Approve or reject collector applications."
          onClick={() => handleNavigate("/admin/collectors")}
          icon="🧾"
          hint={`${overview?.collectorsPending ? `${overview.collectorsPending} pending` : ""}`}
        />

        <ActionCard
          title="View Reports"
          desc="Inspect user-reported issues and incidents."
          onClick={() => handleNavigate("/admin/reports")}
          icon="📣"
          hint={`${overview?.reportsOpen ? `${overview.reportsOpen} open` : ""}`}
        />

        <ActionCard
          title="System Settings"
          desc="Manage feature toggles, keys and integrations."
          onClick={() => handleNavigate("/admin/settings")}
          icon="⚙️"
        />

        <ActionCard
          title="User Search"
          desc="Lookup users, view details and act on accounts."
          onClick={() => handleNavigate("/admin/users")}
          icon="🔎"
        />

        <div style={{ minWidth: 260, display: "flex", alignItems: "stretch" }}>
          <div style={card}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Quick actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button style={cardAction} onClick={() => handleNavigate("/admin/collectors?filter=pending")}>Pending collectors</button>
              <button style={cardAction} onClick={() => handleNavigate("/admin/reports?status=open")}>Open reports</button>
              <button style={cardAction} onClick={() => handleNavigate("/admin/analytics")}>Analytics</button>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ marginTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ color: "#666" }}>Signed in as admin</div>

        <div style={{ display: "flex", gap: 8 }}>
          <button style={secondaryBtn} onClick={() => { localStorage.clear(); showToast("Local cache cleared"); }}>
            Clear cache
          </button>

          <button style={logoutBtn} onClick={openLogout}>
            Logout
          </button>
        </div>
      </footer>

      {/* Logout confirmation modal */}
      {logoutModalOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="logout-title" style={modalOverlay}>
          <div style={modal}>
            <h3 id="logout-title" style={{ marginTop: 0 }}>Sign out</h3>
            <p>Are you sure you want to sign out of the admin account?</p>

            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button style={ghostBtn} onClick={cancelLogout}>Cancel</button>
              <button
                ref={logoutConfirmBtnRef}
                style={dangerBtn}
                onClick={confirmLogout}
                aria-label="Confirm sign out"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite" style={toastStyle}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

/* ----------------------------- small helpers & components ----------------------------- */

const ActionCard: FC<{ title: string; desc?: string; onClick: () => void; icon?: string; hint?: string }> = ({ title, desc, onClick, icon, hint }) => {
  return (
    <div style={card} tabIndex={0} role="button" onClick={onClick} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()} aria-label={title}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={iconWrap}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>{title}</div>
          {desc && <div style={{ color: "#666", marginTop: 6 }}>{desc}</div>}
        </div>
      </div>
      {hint && <div style={{ marginTop: 10, color: "#888", fontSize: 13 }}>{hint}</div>}
    </div>
  );
};

/* ----------------------------- styles (inline objects) ----------------------------- */

const wrap: React.CSSProperties = {
  padding: 28,
  maxWidth: 1200,
  margin: "0 auto",
  fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  marginBottom: 18,
};

const title: React.CSSProperties = { margin: 0, fontSize: 22, fontWeight: 800 };
const subtitle: React.CSSProperties = { margin: 0, color: "#666", fontSize: 13 };

const statsRow: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 18,
  alignItems: "stretch",
};

const statCard: React.CSSProperties = {
  minWidth: 160,
  padding: 14,
  borderRadius: 10,
  background: "#fff",
  boxShadow: "0 8px 20px rgba(11,36,18,0.04)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const statValue: React.CSSProperties = { fontSize: 20, fontWeight: 800 };
const statLabel: React.CSSProperties = { color: "#666", marginTop: 6, fontSize: 13 };

const statsLoading: React.CSSProperties = { color: "#666" };

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
  alignItems: "start",
};

const card: React.CSSProperties = {
  padding: 14,
  borderRadius: 12,
  background: "#fff",
  boxShadow: "0 10px 30px rgba(11,36,18,0.04)",
  cursor: "pointer",
  minHeight: 110,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  outline: "none",
};

const iconWrap: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 10,
  background: "linear-gradient(180deg,#f6f9f6,#eef7ee)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
  boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.02)",
};

const cardAction: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "#fff",
  cursor: "pointer",
  textAlign: "left",
  fontWeight: 700,
};

const primaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  background: "#1db954",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: 800,
};

const ghostBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.06)",
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  background: "#f4f4f4",
  border: "1px solid rgba(0,0,0,0.06)",
  cursor: "pointer",
};

const logoutBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  background: "#c0392b",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
};

const dangerBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  background: "#c0392b",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: 800,
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.32)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: 16,
};

const modal: React.CSSProperties = {
  width: "100%",
  maxWidth: 480,
  background: "#fff",
  borderRadius: 12,
  padding: 18,
  boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
};

const toastStyle: React.CSSProperties = {
  position: "fixed",
  right: 18,
  bottom: 18,
  background: "#2c3e50",
  color: "#fff",
  padding: "10px 12px",
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
};