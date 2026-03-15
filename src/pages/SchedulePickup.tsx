import React, { useContext, useEffect, useRef, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../App";

/**
 * SchedulePickup (updated)
 * - Uses pendingList and scheduledList variables in the UI so they are not unused.
 * - Keeps the improved styling, optimistic updates, confirm modal, and toast.
 *
 * Save/replace: src/pages/SchedulePickup.tsx
 */

/* -------------------------- Styles (scoped & improved) -------------------------- */
const css = `
:root {
  --bg: #f5fbf6;
  --card: #ffffff;
  --muted: #606f63;
  --text: #102818;
  --accent: #17b153;
  --accent-600: #0e8a3f;
  --danger: #d64545;
  --glass: rgba(255,255,255,0.6);
  --radius-md: 12px;
  --radius-sm: 8px;
  --shadow-sm: 0 6px 18px rgba(16,48,28,0.06);
  --shadow-md: 0 20px 60px rgba(11,36,18,0.08);
  --focus: 3px solid rgba(23,177,83,0.14);
  --max-width: 1200px;
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
}

/* Layout */
.sp-page { display:flex; min-height:100vh; background: linear-gradient(180deg, var(--bg), #eef9ee 120%); color: var(--text); }
.sp-sidebar { width:240px; background: linear-gradient(180deg,#16382f,#123023); color:#fff; padding:22px; display:flex; flex-direction:column; gap:18px; box-shadow:2px 0 12px rgba(0,0,0,0.06); position:sticky; top:0; height:100vh; }
.sp-logo { font-weight:700; font-size:20px; letter-spacing:0.2px; display:flex; align-items:center; gap:10px; }
.sp-nav { display:flex; flex-direction:column; gap:8px; margin-top:6px; }
.sp-nav button { color:inherit; background:transparent; border:none; text-align:left; padding:10px 12px; border-radius:8px; cursor:pointer; font-weight:600; transition:background 160ms ease, transform 120ms ease; display:flex; align-items:center; gap:10px; }
.sp-nav button:hover { background: rgba(255,255,255,0.03); transform:translateY(-1px); }
.sp-nav button.active { background: rgba(255,255,255,0.06); box-shadow: inset 0 -1px 0 rgba(255,255,255,0.02); }

.sp-main { flex:1; padding:28px; overflow:auto; max-width: var(--max-width); margin:0 auto; }
.sp-header { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:20px; position:sticky; top:0; z-index:10; background:transparent; padding-top:6px; padding-bottom:6px; }
.sp-title { margin:0; font-size:28px; color:var(--text); }
.sp-sub { margin:6px 0 0; color:var(--muted); font-size:13px; }

/* Grid and cards */
.sp-grid { display:grid; grid-template-columns: 1.6fr 1fr; gap:20px; align-items:start; }
.sp-card { background:var(--card); padding:18px; border-radius:var(--radius-md); box-shadow:var(--shadow-sm); transition: transform 180ms ease, box-shadow 180ms ease; }
.sp-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-md); }

/* Controls */
.sp-button { background: linear-gradient(90deg,var(--accent),var(--accent-600)); color:#fff; padding:10px 14px; border:none; border-radius:10px; font-weight:700; cursor:pointer; box-shadow:0 8px 20px rgba(14,110,60,0.12); }
.sp-action-btn { padding:8px 10px; border-radius:8px; border:1px solid #e6efe6; background:white; cursor:pointer; font-weight:700; }
.sp-empty { text-align:center; color:var(--muted); padding:18px; }

/* Lists */
.sp-list { display:flex; flex-direction:column; gap:10px; margin-top:8px; }
.sp-item { display:flex; justify-content:space-between; gap:12px; align-items:center; padding:12px; border-radius:10px; border:1px solid #f1f1f1; background: linear-gradient(90deg,#fff,#f7fff7); }
.sp-badge { padding:6px 10px; border-radius:8px; font-weight:700; font-size:12px; background:#f2f4f7; color:#333; text-transform:capitalize; }

/* Forms */
.sp-label { font-weight:700; font-size:13px; color:#234b37; display:block; margin-bottom:8px; }
.sp-select, .sp-input { width:100%; padding:10px 12px; border-radius:8px; border:1px solid #e6ebe6; background:white; font-size:14px; }

/* Modal / toast */
.sp-modal-overlay { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(7,11,7,0.45); z-index:60; padding:18px; }
.sp-modal { background:#fff; padding:16px; border-radius:10px; width:min(560px,96%); box-shadow:0 30px 60px rgba(7,11,7,0.6); }
.sp-toast { position:fixed; right:18px; bottom:18px; background:#172; color:white; padding:10px 14px; border-radius:8px; box-shadow:0 6px 22px rgba(0,0,0,0.2); z-index:9999; }
.sp-toast.sp-error { background:var(--danger); }

/* Responsive */
@media (max-width:900px) { .sp-grid { grid-template-columns: 1fr; } .sp-sidebar { display:none; } }
`;

/* -------------------------- Types -------------------------- */
type WasteItem = {
  _id: string;
  wasteType: string;
  quantity: number;
  status: string;
  createdAt: string;
  pickupDate?: string | null;
  estimatedPrice?: number;
  price?: number;
  location?: string;
};

/* -------------------------- Component -------------------------- */
export default function SchedulePickup(): JSX.Element {
  const navigate = useNavigate();
  const { setAuthState } = useContext(AuthContext);
  const [user] = useState<any>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [wasteItems, setWasteItems] = useState<WasteItem[]>([]);
  const [selectedWaste, setSelectedWaste] = useState<string>("");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; danger?: boolean } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ action: "schedule" | "cancel" | "reschedule"; item?: WasteItem } | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function fetchItems() {
      setFetchLoading(true);
      setError(null);
      try {
        const res = await api.get("/api/waste/my-posts", { signal: controller.signal }).catch(async () => {
          return await api.get("/api/waste/my-waste", { signal: controller.signal }).catch(() => ({ data: [] }));
        });

        const payload = res?.data?.data ?? res?.data ?? [];
        const arr = Array.isArray(payload) ? payload : [];

        const normalized = arr.map((it: any) => ({
          ...it,
          status: String(it.status || "pending").toLowerCase(),
          pickupDate: it.pickupDate ?? it.scheduledAt ?? it.pickup_date ?? null,
          location: it.location ?? it.address ?? it.city ?? it.area ?? null,
        }));

        if (!mounted) return;
        setWasteItems(normalized);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        console.error("fetchItems error", err);
        setError("Unable to load your waste items.");
      } finally {
        if (mounted) setFetchLoading(false);
      }
    }

    fetchItems();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // Use derived lists in UI so they are read
  const pendingList = wasteItems.filter((w) => !w.pickupDate && (!w.status || w.status === "pending" || w.status === "posted" || w.status === "new"));
  const scheduledList = wasteItems.filter((w) => !!w.pickupDate || w.status === "scheduled");

  const getToday = () => new Date().toISOString().split("T")[0];
  const combineDateTime = (date: string, time: string) => {
    if (!date || !time) return null;
    const iso = `${date}T${time}`;
    return new Date(iso).toISOString();
  };

  const showToast = (text: string, danger = false, ttl = 3000) => {
    setToast({ text, danger });
    setTimeout(() => setToast(null), ttl);
  };

  const optimisticSetScheduled = (id: string, pickupIso: string | null) => {
    setWasteItems((prev) => prev.map((p) => (p._id === id ? { ...p, pickupDate: pickupIso, status: pickupIso ? "scheduled" : p.status } : p)));
  };

  const schedulePickup = async (id: string, iso: string) => {
    setLoading(true);
    setError(null);
    try {
      optimisticSetScheduled(id, iso);
      await api.put(`/api/waste/schedule/${id}`, { pickupDate: iso }).catch(async () => {
        return await api.post(`/api/waste/${id}/schedule`, { pickupDate: iso }).catch(() => null);
      });
      showToast("Pickup scheduled");
      setSelectedWaste("");
      setPickupDate("");
      setPickupTime("");
      setConfirmModal(null);
    } catch (err: any) {
      console.error("schedule error", err);
      showToast("Schedule failed", true);
      await refreshItems();
    } finally {
      setLoading(false);
    }
  };

  const cancelSchedule = async (id: string) => {
    setLoading(true);
    try {
      optimisticSetScheduled(id, null);
      await api.delete(`/api/waste/schedule/${id}`).catch(async () => {
        return await api.put(`/api/waste/schedule/${id}`, { pickupDate: null }).catch(() => null);
      });
      showToast("Schedule cancelled");
      setConfirmModal(null);
    } catch (err) {
      console.error("cancel error", err);
      showToast("Cancel failed", true);
      await refreshItems();
    } finally {
      setLoading(false);
    }
  };

  const refreshItems = async () => {
    setFetchLoading(true);
    try {
      const res = await api.get("/api/waste/my-posts").catch(async () => {
        return await api.get("/api/waste/my-waste").catch(() => ({ data: [] }));
      });
      const payload = res?.data?.data ?? res?.data ?? [];
      const arr = Array.isArray(payload) ? payload : [];
      const normalized = arr.map((it: any) => ({
        ...it,
        status: String(it.status || "pending").toLowerCase(),
        pickupDate: it.pickupDate ?? it.scheduledAt ?? it.pickup_date ?? null,
        location: it.location ?? it.address ?? it.city ?? it.area ?? null,
      }));
      setWasteItems(normalized);
    } catch (err) {
      console.error("refresh error", err);
      showToast("Refresh failed", true);
    } finally {
      setFetchLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedWaste) {
      setError("Select a waste item.");
      return;
    }
    if (!pickupDate || !pickupTime) {
      setError("Select pickup date and time.");
      return;
    }
    const combined = combineDateTime(pickupDate, pickupTime);
    if (!combined) {
      setError("Invalid date/time.");
      return;
    }
    if (new Date(combined) <= new Date()) {
      setError("Please choose a future date/time.");
      return;
    }
    const item = wasteItems.find((w) => w._id === selectedWaste) ?? undefined;
    setConfirmModal({ action: "schedule", item });
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    if (setAuthState) setAuthState({ isAuth: false, roleState: "" });
    navigate("/login", { replace: true });
  };

  return (
    <div className="sp-page">
      <style>{css}</style>

      <aside className="sp-sidebar" aria-label="Sidebar">
        <div className="sp-logo">GreenHome</div>

        <nav className="sp-nav" aria-label="Main navigation">
          <button onClick={() => navigate("/dashboard")}>📊 Dashboard</button>
          <button onClick={() => navigate("/post-waste")}>♻️ Post Waste</button>
          <button className="active">🚚 Pickup Status</button>
          <button onClick={() => navigate("/rewards")}>🎁 Rewards</button>
          <button onClick={() => navigate("/profile")}>👤 Profile</button>
          <div style={{ marginTop: "auto" }}>
            <button style={{ background: "#c0392b", color: "#fff", width: "100%", padding: 10, borderRadius: 8 }} onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </nav>
      </aside>

      <main className="sp-main">
        <header className="sp-header">
          <div>
            <h1 className="sp-title">🚚 Schedule Pickup</h1>
            <div className="sp-sub">Pick a convenient time — collectors will be notified</div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Signed in as</div>
              <div style={{ fontWeight: 800 }}>{user?.name ?? "You"}</div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 999, background: "linear-gradient(180deg,#19fd0d,#0fb13a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#083", fontWeight: 800 }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
          </div>
        </header>

        <section className="sp-grid">
          {/* Left: schedule form */}
          <div className="sp-card" aria-labelledby="schedule-heading">
            <h3 id="schedule-heading" style={{ marginTop: 0 }}>📅 New pickup</h3>

            {error && <div style={{ marginBottom: 12, color: "#b91c1c", fontWeight: 700 }}>{error}</div>}

            <form onSubmit={onSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label className="sp-label">Waste item</label>
                <select className="sp-select" value={selectedWaste} onChange={(e) => setSelectedWaste(e.target.value)} disabled={fetchLoading || loading}>
                  <option value="">Choose one to schedule</option>
                  {wasteItems.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.wasteType} — {w.quantity}kg {w.price ? `• Rs ${w.price}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label className="sp-label">Date</label>
                  <input className="sp-input" type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} min={getToday()} disabled={loading || fetchLoading} />
                </div>

                <div style={{ width: 160 }}>
                  <label className="sp-label">Time</label>
                  <input className="sp-input" type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} step={900} disabled={loading || fetchLoading} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <button type="submit" className="sp-button" disabled={loading || fetchLoading}>
                  {loading ? "Scheduling..." : "Schedule pickup"}
                </button>

                <button
                  type="button"
                  className="sp-action-btn"
                  onClick={() => {
                    setSelectedWaste("");
                    setPickupDate("");
                    setPickupTime("");
                    setError(null);
                  }}
                >
                  Reset
                </button>

                <div style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 13 }}>
                  Window: 08:00 - 18:00
                </div>
              </div>
            </form>
          </div>

          {/* Right: pending & scheduled lists */}
          <div>
            <div className="sp-card" style={{ marginBottom: 12 }}>
              <h4 style={{ margin: 0 }}>⏳ Pending</h4>
              <div className="sp-list" style={{ marginTop: 8 }}>
                {fetchLoading ? (
                  <div className="sp-empty">Loading…</div>
                ) : pendingList.length === 0 ? (
                  <div className="sp-empty">No pending items</div>
                ) : (
                  pendingList.map((w) => (
                    <div key={w._id} className="sp-item">
                      <div style={{ maxWidth: 260 }}>
                        <div style={{ fontWeight: 700 }}>{w.wasteType} • {w.quantity}kg</div>
                        <div style={{ color: "#666", fontSize: 13 }}>{w.location ?? "Your location"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="sp-action-btn"
                          onClick={() => {
                            setSelectedWaste(w._id);
                            setPickupDate(getToday());
                            setPickupTime("09:00");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Schedule
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="sp-card">
              <h4 style={{ marginTop: 0, marginBottom: 12 }}>📋 Scheduled / Your items</h4>

              {fetchLoading ? (
                <div className="sp-empty">Loading…</div>
              ) : scheduledList.length === 0 ? (
                <div className="sp-empty">No scheduled items</div>
              ) : (
                <div className="sp-list" role="list">
                  {scheduledList.map((w) => {
                    const isScheduled = !!w.pickupDate;
                    return (
                      <div key={w._id} className="sp-item" role="listitem" aria-labelledby={`item-${w._id}`}>
                        <div style={{ maxWidth: 360 }}>
                          <div style={{ fontWeight: 700 }}>{w.wasteType} • {w.quantity}kg</div>
                          <div style={{ color: "#666", fontSize: 13 }}>{w.location ?? "Your location"} • Posted {new Date(w.createdAt).toLocaleDateString()}</div>
                        </div>

                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {!isScheduled ? (
                            <button
                              className="sp-action-btn"
                              onClick={() => {
                                setSelectedWaste(w._id);
                                setPickupDate(getToday());
                                setPickupTime("09:00");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              Schedule
                            </button>
                          ) : (
                            <>
                              <button className="sp-action-btn" onClick={() => setConfirmModal({ action: "reschedule", item: w })}>Reschedule</button>
                              <button className="sp-action-btn" onClick={() => setConfirmModal({ action: "cancel", item: w })}>Cancel</button>
                            </>
                          )}

                          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                            <div className="sp-badge">{isScheduled ? `Scheduled: ${formatLocal(w.pickupDate ?? "")}` : "Pending"}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <section style={{ marginTop: 18 }}>
          <div className="sp-card">
            <h4 style={{ marginTop: 0 }}>ℹ️ Pickup Guidelines</h4>
            <ul style={{ marginTop: 8, color: "#617b6a" }}>
              <li>Schedule at least 1 hour ahead</li>
              <li>Keep items ready and accessible</li>
              <li>Collector arrives within 30 minutes of scheduled time</li>
            </ul>
          </div>
        </section>
      </main>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="sp-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="sp-modal">
            <h3 id="confirm-title">
              {confirmModal.action === "cancel" ? "Cancel pickup" : confirmModal.action === "reschedule" ? "Reschedule pickup" : "Confirm schedule"}
            </h3>

            <p style={{ color: "#556", marginTop: 8 }}>
              {confirmModal.action === "cancel"
                ? "Are you sure you want to cancel this scheduled pickup? This will notify the collector."
                : confirmModal.action === "reschedule"
                ? "Choose a new date and time to reschedule the pickup."
                : "Confirm schedule for the selected item."}
            </p>

            {confirmModal.action !== "cancel" && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input type="date" className="sp-input" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} min={getToday()} />
                <input type="time" className="sp-input" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
              <button className="sp-action-btn" onClick={() => setConfirmModal(null)}>Cancel</button>

              {confirmModal.action === "cancel" && confirmModal.item && (
                <button
                  className="sp-button"
                  onClick={() => {
                    cancelSchedule(confirmModal.item!._id);
                  }}
                >
                  Yes, cancel
                </button>
              )}

              {confirmModal.action !== "cancel" && confirmModal.item && (
                <button
                  className="sp-button"
                  onClick={() => {
                    const combined = combineDateTime(pickupDate, pickupTime);
                    if (!combined) {
                      setError("Pick a valid date & time");
                      return;
                    }
                    schedulePickup(confirmModal.item!._id, combined);
                  }}
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`sp-toast ${toast.danger ? "sp-error" : ""}`}>{toast.text}</div>}
    </div>
  );
}

/* -------------------------- Helpers -------------------------- */
function formatLocal(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}