import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

type Waste = {
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

export default function MyPickups(): React.JSX.Element {
  const navigate = useNavigate();
  const [items, setItems] = useState<Waste[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dateValue, setDateValue] = useState<string>("");

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/waste/my-posts");
      const data = res.data?.data ?? res.data;
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load my pickups", err);
      setError(err?.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const startSchedule = (id: string, current?: string | null) => {
    setEditingId(id);
    if (current) {
      // convert to local datetime-local value
      const d = new Date(current);
      // datetime-local expects "YYYY-MM-DDTHH:mm"
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      setDateValue(localISO);
    } else {
      setDateValue("");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDateValue("");
  };

  const saveSchedule = async (id: string) => {
    if (!dateValue) {
      alert("Please choose date/time");
      return;
    }
    try {
      await api.put(`/api/waste/schedule/${id}`, { pickupDate: dateValue });
      await fetchItems();
      setEditingId(null);
      setDateValue("");
      showToast("Scheduled");
    } catch (err: any) {
      console.error("Scheduling failed", err);
      alert(err?.response?.data?.message || "Failed to schedule");
      await fetchItems();
      setEditingId(null);
      setDateValue("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  const showToast = (text: string, ttl = 900) => {
    const n = document.createElement("div");
    n.textContent = text;
    Object.assign(n.style, {
      position: "fixed",
      right: "12px",
      bottom: "12px",
      background: "#27ae60",
      color: "#fff",
      padding: "6px 10px",
      borderRadius: "6px",
      fontSize: "12px",
      zIndex: 9999,
    });
    document.body.appendChild(n);
    setTimeout(() => {
      try { document.body.removeChild(n); } catch {}
    }, ttl);
  };

  return (
    <div style={pageStyles.root}>
      <aside style={pageStyles.sidebar} aria-label="Main navigation">
        <div style={pageStyles.brand}>
          <div style={pageStyles.brandIcon}>🏡</div>
          <div style={pageStyles.brandText}>GreenHome</div>
        </div>

        <nav style={pageStyles.nav}>
          <button style={pageStyles.navButton} onClick={() => navigate("/dashboard")}>📊 Dashboard</button>
          <button style={{ ...pageStyles.navButton, ...pageStyles.navButtonActive }} onClick={() => navigate("/pickups")}>🚚 My Pickups</button>
          <button style={pageStyles.navButton} onClick={() => navigate("/post-waste")}>♻️ Post Waste</button>
          <button style={pageStyles.navButton} onClick={() => navigate("/rewards")}>🎁 Rewards</button>
          <button style={pageStyles.navButton} onClick={() => navigate("/profile")}>👤 Profile</button>
        </nav>

        <div style={{ marginTop: "auto", padding: 12 }}>
          <button style={pageStyles.logoutButton} onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>

      <main style={pageStyles.main}>
        <header style={pageStyles.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>My Pickups</h2>
            <div style={{ color: "#666", marginTop: 6, fontSize: 13 }}>Manage your posted waste and schedule pickups</div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link to="/post-waste" style={pageStyles.postButton}>+ Post waste</Link>
            <button onClick={() => fetchItems()} style={pageStyles.refreshButton}>Refresh</button>
          </div>
        </header>

        {loading ? (
          <div style={{ padding: 12, color: "#444" }}>Loading your pickups…</div>
        ) : error ? (
          <div style={{ padding: 12, color: "crimson" }}>Error: {error}</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 12 }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <p style={{ margin: 0, fontSize: 14 }}>
                No waste posts yet.{" "}
                <Link to="/post-waste" style={pageStyles.postInline}>
                  Post waste
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div style={{ padding: 12 }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((w) => (
                <div key={w._id} style={cardConstrained}>
                  {/* thumbnail */}
                  <div style={{ width: 56, height: 44, flex: "0 0 56px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {w.imageUrl ? (
                      <img src={ensureFullUrl(w.imageUrl)} alt="thumb" style={{ width: 56, height: 44, objectFit: "cover", borderRadius: 6 }} />
                    ) : (
                      <div style={{ width: 56, height: 44, background: "#f1f1f1", borderRadius: 6 }} />
                    )}
                  </div>

                  {/* info + actions */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                          {(w.wasteType ?? "Unknown").toString().toUpperCase()}
                        </div>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                          {w.quantity ?? "—"} kg • {w.createdAt ? new Date(w.createdAt).toLocaleString() : "—"}
                        </div>
                      </div>

                      <div style={{ textAlign: "right", flex: "0 0 auto", marginLeft: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Rs {w.price ?? "—"}</div>
                        <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{w.status ?? "—"}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <Link to={`/track/${w._id}`} style={linkTiny}>View</Link>

                      {editingId === w._id ? (
                        <>
                          <input
                            type="datetime-local"
                            value={dateValue}
                            onChange={(e) => setDateValue(e.target.value)}
                            style={inputTiny}
                          />
                          <button onClick={() => saveSchedule(w._id)} style={buttonTinyPrimary}>Save</button>
                          <button onClick={cancelEdit} style={buttonTiny}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startSchedule(w._id, w.pickupDate ?? null)} style={buttonTiny}>Schedule</button>

                          <button
                            onClick={() => {
                              const link = window.location.origin + `/track/${w._id}`;
                              navigator.clipboard?.writeText(link);
                              showToast("Copied");
                            }}
                            style={buttonTiny}
                          >
                            Copy
                          </button>

                          {/* post similar / quick create */}
                          <Link to="/post-waste" style={buttonTinyLink}>Post similar</Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* helper to ensure uploads path becomes absolute when served from backend */
function ensureFullUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = (window as any).__API_BASE__ || "";
  return `${base}${url}`;
}

/* styles: constrained card so it doesn't look long */
const cardConstrained: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  background: "#fff",
  padding: "10px 12px",
  borderRadius: 8,
  boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
  fontSize: 13,
  width: "100%",
  maxWidth: "100%",
};

const linkTiny: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 6,
  background: "#f0f0f0",
  color: "#111",
  textDecoration: "none",
  fontSize: 12,
  display: "inline-block",
};

const buttonTiny: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 6,
  border: "none",
  background: "#f0f0f0",
  cursor: "pointer",
  fontSize: 12,
};

const buttonTinyPrimary: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 6,
  border: "none",
  background: "#0b6efd",
  color: "#fff",
  cursor: "pointer",
  fontSize: 12,
};

const inputTiny: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #ddd",
  fontSize: 12,
};

const buttonTinyLink: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 6,
  background: "transparent",
  color: "#0b6efd",
  textDecoration: "none",
  border: "1px dashed #dfefff",
  fontSize: 12,
};

/* page layout styles */
const pageStyles: { [k: string]: React.CSSProperties } = {
  root: { display: "flex", minHeight: "100vh", fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial", background: "#f5f7fb" },
  sidebar: { width: 240, background: "linear-gradient(180deg,#16382f,#123023)", color: "#fff", display: "flex", flexDirection: "column", padding: 18, boxShadow: "2px 0 12px rgba(0,0,0,0.06)" },
  brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  brandIcon: { fontSize: 20 },
  brandText: { fontWeight: 800, fontSize: 18 },
  nav: { display: "flex", flexDirection: "column", gap: 8 },
  navButton: { background: "transparent", border: "none", color: "#e6eef0", padding: "10px 8px", textAlign: "left", borderRadius: 8, cursor: "pointer", fontWeight: 700 },
  navButtonActive: { background: "rgba(255,255,255,0.06)", color: "#fff" },
  logoutButton: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "#c0392b", color: "#fff", cursor: "pointer", fontWeight: 700 },

  main: { flex: 1, padding: 18 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  postButton: { padding: "8px 12px", borderRadius: 8, background: "#19fd0d", color: "#063", textDecoration: "none", fontWeight: 800 },
  refreshButton: { padding: "8px 12px", borderRadius: 8, background: "#eef6ff", border: "none", cursor: "pointer" },
  postInline: { padding: "6px 8px", borderRadius: 6, background: "#19fd0d", color: "#fff", textDecoration: "none", fontWeight: 700 },
};