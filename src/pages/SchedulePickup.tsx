import React, { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import "./SchedulePickup.css";

type WasteItem = {
  _id: string;
  wasteType: string;
  quantity: number;
  status: string;
  createdAt: string;
  pickupDate?: string | null;
  estimatedPrice?: number;
  price?: number;
  location?: string | null;
};

const parseIso = (iso?: string | null) => {
  if (!iso) return null;
  try { return new Date(iso); } catch { return null; }
};

function isWithinWindow(dateIso: string | null) {
  if (!dateIso) return false;
  const d = new Date(dateIso);
  return d.getHours() >= 8 && d.getHours() < 18;
}

async function callWithFallbacks(
  attempts: { method: "patch" | "post" | "put" | "delete"; url: string; body?: any }[]
) {
  const tried: { url: string; method: string; res?: any; err?: any }[] = [];
  for (const a of attempts) {
    try {
      let res;
      if (a.method === "patch") res = await api.patch(a.url, a.body);
      else if (a.method === "post") res = await api.post(a.url, a.body);
      else if (a.method === "put") res = await api.put(a.url, a.body);
      else if (a.method === "delete") res = await api.delete(a.url);
      tried.push({ url: a.url, method: a.method, res });
      if (res && res.status >= 200 && res.status < 300) return { ok: true, used: a, res, tried };
    } catch (err: any) {
      tried.push({ url: a.url, method: a.method, err });
      const code = err?.response?.status;
      if (code && code !== 404 && code !== 409) return { ok: false, used: a, err, tried };
    }
  }
  return { ok: false, tried };
}

export default function SchedulePickup(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [user] = useState<any>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [wasteItems, setWasteItems] = useState<WasteItem[]>([]);
  const [selectedWaste, setSelectedWaste] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; danger?: boolean } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ action: "cancel"; item: WasteItem } | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Record<string, { date: string; time: string }>>({});
  const [isEditing, setIsEditing] = useState(false);

  // control pending collapse/expand — default collapsed
  const [pendingExpanded, setPendingExpanded] = useState(false);

  const preselectedApplied = useRef(false);
  const modalConfirmRef = useRef<HTMLButtonElement | null>(null);
  const modalCancelRef = useRef<HTMLButtonElement | null>(null);

  const showToast = (text: string, danger = false, ttl = 3000) => {
    setToast({ text, danger });
    setTimeout(() => setToast(null), ttl);
  };

  const setUpdating = (id: string, v: boolean) =>
    setUpdatingIds((s) => {
      const copy = { ...s };
      if (v) copy[id] = true;
      else delete copy[id];
      return copy;
    });

  const normalizeSingle = (it: any): WasteItem => ({
    _id: String(it._id ?? it.id ?? ""),
    wasteType: String(it.wasteType ?? it.type ?? it.category ?? "Waste"),
    quantity: Number(it.quantity ?? it.qty ?? 0),
    status: String((it.status ?? "pending")).toLowerCase(),
    createdAt: it.createdAt ?? it.created_at ?? new Date().toISOString(),
    pickupDate: it.pickupDate ?? it.scheduledAt ?? it.pickup_date ?? null,
    estimatedPrice: it.estimatedPrice ?? it.estimated_price,
    price: it.price ?? null,
    location: it.location ?? it.address ?? it.city ?? it.area ?? null,
  });

  const normalizeItems = (arr: any[]): WasteItem[] => arr.map(normalizeSingle);

  const fetchItems = useCallback(async (signal?: AbortSignal) => {
    if (isEditing) return;
    setFetchLoading(true);
    setError(null);
    try {
      const res = await api.get("/waste/my-posts", { signal }).catch(async () =>
        api.get("/waste/my-waste", { signal }).catch(() => ({ data: [] }))
      );
      const payload = res?.data?.data ?? res?.data ?? [];
      setWasteItems(normalizeItems(Array.isArray(payload) ? payload : []));
    } catch (err: any) {
      if (err?.code === "ERR_CANCELED") return;
      if (!err?.response) setError("Unable to reach server. Check your connection.");
      else if (err.response?.status === 401) {
        showToast("Session expired", true);
        try { localStorage.removeItem("accessToken"); localStorage.removeItem("token"); localStorage.removeItem("user"); } catch {}
        setTimeout(() => navigate("/login"), 900);
      } else setError(err.response?.data?.message || "Failed to load items.");
    } finally {
      setFetchLoading(false);
    }
  }, [navigate, isEditing]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchItems(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchItems]);

  useEffect(() => {
    if (preselectedApplied.current || fetchLoading) return;
    const idToSelect = (location.state as any)?.createdId ?? searchParams.get("item");
    if (!idToSelect) return;
    const exists = wasteItems.find((w) => w._id === idToSelect);
    if (exists) {
      setSelectedWaste(idToSelect);
      setPickupDate("");
      setPickupTime("");
      preselectedApplied.current = true;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.state, searchParams, fetchLoading, wasteItems]);

  const excludedStatuses = new Set(["collected", "completed"]);

  const pendingList = useMemo(() =>
    wasteItems.filter((w) => {
      const s = w.status.toLowerCase();
      const matchesSearch = !search || `${w.wasteType} ${w.location ?? ""} ${w._id}`.toLowerCase().includes(search.toLowerCase());
      return matchesSearch && !w.pickupDate && (s === "pending" || s === "posted" || s === "new" || s === "") && !excludedStatuses.has(s);
    }), [wasteItems, search]);

  const scheduledList = useMemo(() =>
    wasteItems.filter((w) => {
      const s = w.status.toLowerCase();
      const matchesSearch = !search || `${w.wasteType} ${w.location ?? ""} ${w._id}`.toLowerCase().includes(search.toLowerCase());
      return matchesSearch && !excludedStatuses.has(s) && (Boolean(w.pickupDate) || s === "scheduled");
    }), [wasteItems, search]);

  const optimisticUpdate = (id: string, patch: Partial<WasteItem>) => {
    const prev = wasteItems;
    setWasteItems((cur) => cur.map((p) => (p._id === id ? { ...p, ...patch } : p)));
    return () => setWasteItems(prev);
  };

  const schedulePickup = async (id: string, iso: string | null, navigateAfter = true) => {
    if (!iso) return showToast("Invalid date/time", true);
    if (new Date(iso) <= new Date()) return showToast("Please select a future date/time", true);
    if (!isWithinWindow(iso)) return showToast("Choose a time between 08:00 and 18:00", true);

    setGlobalLoading(true);
    setUpdating(id, true);
    const rollback = optimisticUpdate(id, { pickupDate: iso, status: "scheduled" });

    try {
      const attempts = [
        { method: "put" as const, url: `/waste/schedule/${id}`, body: { pickupDate: iso } },
        { method: "post" as const, url: `/waste/schedule`, body: { id, pickupDate: iso } },
        { method: "patch" as const, url: `/waste/${id}/schedule`, body: { pickupDate: iso } },
        { method: "patch" as const, url: `/waste/schedule/${id}`, body: { pickupDate: iso } },
      ];
      const result = await callWithFallbacks(attempts);

      if (!result.ok) {
        const status = result.tried?.[result.tried.length - 1]?.err?.response?.status;
        rollback();
        showToast(status === 403 ? "Forbidden: you cannot schedule this item." : "Scheduling failed", true);
        return;
      }

      const updated = result.res?.data?.data ?? result.res?.data;
      if (updated && (updated._id || updated.pickupDate)) {
        setWasteItems((cur) => cur.map((p) => (p._id === id ? normalizeSingle(updated) : p)));
      } else {
        await fetchItems();
      }

      showToast("Pickup scheduled");
      if (navigateAfter) navigate("/pickups");
    } catch (err: any) {
      rollback();
      showToast(err?.response?.data?.message ?? err?.message ?? "Scheduling error", true);
    } finally {
      setUpdating(id, false);
      setGlobalLoading(false);
    }
  };

  const cancelSchedule = async (id: string) => {
    setGlobalLoading(true);
    setUpdating(id, true);
    const rollback = optimisticUpdate(id, { pickupDate: null, status: "pending" });
    try {
      const result = await callWithFallbacks([
        { method: "put" as const, url: `/waste/schedule/${id}`, body: { pickupDate: null } },
        { method: "post" as const, url: `/waste/schedule`, body: { id, pickupDate: null } },
      ]);
      if (result.ok) { showToast("Schedule cancelled"); await fetchItems(); }
      else { rollback(); showToast("Cancel failed", true); }
    } catch { rollback(); showToast("Cancel request failed", true); }
    finally { setUpdating(id, false); setGlobalLoading(false); setConfirmModal(null); }
  };

  const combineDateTime = (date: string, time: string) => {
    if (!date || !time) return null;
    try { return new Date(`${date}T${time}:00`).toISOString(); } catch { return null; }
  };

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!selectedWaste) return setError("Please select a waste item to schedule.");
    const iso = combineDateTime(pickupDate, pickupTime);
    if (!iso) return setError("Please pick valid date and time.");
    if (new Date(iso) <= new Date()) return setError("Pick a future date & time.");
    setIsEditing(false);
    schedulePickup(selectedWaste, iso, false);
  };

  const startInlineEdit = (w: WasteItem) => {
    const d = parseIso(w.pickupDate);
    setEditing((s) => ({ ...s, [w._id]: { date: d ? d.toISOString().split("T")[0] : "", time: d ? d.toTimeString().slice(0, 5) : "" } }));
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelInlineEdit = (id: string) => {
    setEditing((s) => { const c = { ...s }; delete c[id]; return c; });
    setIsEditing(false);
  };

  const saveInlineEdit = async (id: string) => {
    const ed = editing[id];
    if (!ed) return;
    const iso = combineDateTime(ed.date, ed.time);
    if (!iso) { showToast("Invalid date/time", true); return; }
    setIsEditing(false);
    await schedulePickup(id, iso, false);
    cancelInlineEdit(id);
  };

  useEffect(() => {
    if (!confirmModal) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setConfirmModal(null);
      if (ev.key === "Enter") modalConfirmRef.current?.click();
    };
    document.addEventListener("keydown", onKey);
    setTimeout(() => modalConfirmRef.current?.focus(), 40);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmModal]);

  const getTodayLocal = () => new Date().toISOString().split("T")[0];

  // items to show depending on collapsed/expanded state (show 2 when collapsed)
  const pendingToShow = pendingExpanded ? pendingList : pendingList.slice(0, 2);

  return (
    <div className="sp-page">
      <Sidebar />

      <main className="sp-main" role="main">
        <header className="sp-header">
          <div className="sp-header-left">
            <h1 className="sp-title">🚚 Schedule Pickup</h1>
            <div className="sp-sub">Choose a convenient time — collectors are notified</div>
          </div>

          <div className="sp-header-right">
            <div className="sp-user-info">
              <div className="sp-user-label">Signed in as</div>
              <div className="sp-user-name">{user?.name ?? "You"}</div>
            </div>
            <div className="sp-header-controls">
              <input
                className="sp-search"
                aria-label="Search items"
                placeholder="Search items or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="sp-action-btn" onClick={() => fetchItems()} aria-label="Refresh" disabled={fetchLoading}>
                🔄 Refresh
              </button>
              <div className="sp-avatar">
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
            </div>
          </div>
        </header>

        <section className="sp-grid">
          {/* Form card */}
          <div className="sp-card">
            <h3 className="sp-card-title">📅 New pickup</h3>

            {error && <div className="sp-error-banner">{error}</div>}

            <form onSubmit={onSubmit}>
              <label className="sp-label" htmlFor="waste-select">Waste item</label>
              <select
                id="waste-select"
                className="sp-select"
                value={selectedWaste}
                onChange={(e) => setSelectedWaste(e.target.value)}
                disabled={fetchLoading || globalLoading}
              >
                <option value="">Choose one to schedule</option>
                {wasteItems.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.wasteType} — {w.quantity}kg{w.price ? ` • Rs ${w.price}` : ""}
                  </option>
                ))}
              </select>

              <div className="sp-date-row">
                <div className="sp-date-field">
                  <label className="sp-label" htmlFor="pickup-date">Date</label>
                  <input
                    id="pickup-date"
                    className="sp-input"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    onFocus={() => setIsEditing(true)}
                    onBlur={() => setIsEditing(false)}
                    min={getTodayLocal()}
                    disabled={globalLoading || fetchLoading}
                  />
                </div>
                <div className="sp-time-field">
                  <label className="sp-label" htmlFor="pickup-time">Time</label>
                  <input
                    id="pickup-time"
                    className="sp-input"
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    onFocus={() => setIsEditing(true)}
                    onBlur={() => setIsEditing(false)}
                    step={900}
                    disabled={globalLoading || fetchLoading}
                  />
                </div>
              </div>

              <div className="sp-form-actions">
                <button type="submit" className="sp-button" disabled={globalLoading || fetchLoading}>
                  {globalLoading ? "Working…" : "Schedule pickup"}
                </button>
                <button
                  type="button"
                  className="sp-action-btn"
                  onClick={() => { setSelectedWaste(""); setPickupDate(""); setPickupTime(""); setError(null); setIsEditing(false); }}
                >
                  Reset
                </button>
                <span className="sp-window-hint">Window: 08:00 – 18:00</span>
              </div>
            </form>
          </div>

          {/* Lists column */}
          <div>
            {/* Pending */}
            <div className="sp-card">
              <div className="sp-section-head">
                <h4>⏳ Pending</h4>
                <span className="sp-count">{pendingList.length}</span>
              </div>

              <div className={`sp-pending-wrap${pendingExpanded ? " expanded" : ""}`} role="region" aria-label="Pending items">
                <div id="pending-list" className="sp-list" style={{ marginTop: 8 }}>
                  {fetchLoading ? (
                    <div className="sp-empty">Loading…</div>
                  ) : pendingList.length === 0 ? (
                    <div className="sp-empty">No pending items</div>
                  ) : (
                    pendingToShow.map((w) => (
                      <div key={w._id} className="sp-item" role="listitem">
                        <div className="sp-item-info">
                          <div className="sp-item-title">{w.wasteType} · {w.quantity}kg</div>
                          <div className="sp-item-meta">{w.location ?? "Your location"}</div>
                        </div>
                        <div className="sp-item-actions">
                          <button
                            className="sp-action-btn"
                            onClick={() => { setSelectedWaste(w._id); setPickupDate(""); setPickupTime(""); setIsEditing(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                            aria-label={`Schedule ${w.wasteType}`}
                          >
                            Schedule
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* fade + toggle (only when more than 2 items) */}
                {!pendingExpanded && pendingList.length > 2 && (
                  <>
                    <div className="sp-pending-fade" aria-hidden="true" />
                    <button className="sp-pending-toggle" onClick={() => setPendingExpanded(true)} aria-expanded="false" aria-controls="pending-list">
                      Show more
                    </button>
                  </>
                )}
                {pendingExpanded && pendingList.length > 2 && (
                  <div style={{ textAlign: "center", marginTop: 8 }}>
                    <button className="sp-action-btn" onClick={() => { setPendingExpanded(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                      Show less
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Scheduled */}
            <div className="sp-card" style={{ marginTop: 16 }}>
              <div className="sp-section-head">
                <h4>📋 Scheduled</h4>
                <span className="sp-count">{scheduledList.length}</span>
              </div>

              {fetchLoading ? (
                <div className="sp-empty">Loading…</div>
              ) : scheduledList.length === 0 ? (
                <div className="sp-empty">No scheduled items</div>
              ) : (
                <div className="sp-list" role="list">
                  {scheduledList.map((w) => {
                    const isScheduled = Boolean(w.pickupDate);
                    const editState = editing[w._id];
                    return (
                      <div key={w._id} className="sp-item" role="listitem">
                        <div className="sp-item-info">
                          <div className="sp-item-title">{w.wasteType} · {w.quantity}kg</div>
                          <div className="sp-item-meta">
                            {w.location ?? "Your location"} · Posted {new Date(w.createdAt).toLocaleDateString()}
                          </div>
                          {editState ? (
                            <div className="inline-editor" aria-label="Reschedule editor">
                              <input
                                type="date"
                                value={editState.date}
                                onChange={(e) => setEditing((s) => ({ ...s, [w._id]: { ...s[w._id], date: e.target.value } }))}
                                onFocus={() => setIsEditing(true)}
                                onBlur={() => setIsEditing(false)}
                              />
                              <input
                                type="time"
                                value={editState.time}
                                onChange={(e) => setEditing((s) => ({ ...s, [w._id]: { ...s[w._id], time: e.target.value } }))}
                                step={900}
                                onFocus={() => setIsEditing(true)}
                                onBlur={() => setIsEditing(false)}
                              />
                              <button className="sp-action-btn" onClick={() => saveInlineEdit(w._id)} disabled={!!updatingIds[w._id]}>Save</button>
                              <button className="sp-action-btn" onClick={() => cancelInlineEdit(w._id)} disabled={!!updatingIds[w._id]}>Cancel</button>
                            </div>
                          ) : isScheduled && (
                            <div className="sp-item-scheduled">📅 {formatLocal(w.pickupDate ?? "")}</div>
                          )}
                        </div>

                        <div className="sp-item-actions">
                          {!isScheduled ? (
                            <button
                              className="sp-action-btn"
                              onClick={() => { setSelectedWaste(w._id); setPickupDate(""); setPickupTime(""); setIsEditing(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                            >
                              Schedule
                            </button>
                          ) : (
                            <>
                              <button className="sp-action-btn" onClick={() => startInlineEdit(w)} disabled={!!updatingIds[w._id]}>
                                Reschedule
                              </button>
                              <button className="sp-action-btn danger" onClick={() => setConfirmModal({ action: "cancel", item: w })} disabled={!!updatingIds[w._id]}>
                                Cancel
                              </button>
                            </>
                          )}
                          <div className={`sp-badge${isScheduled ? "" : " pending"}`}>
                            {isScheduled ? formatLocal(w.pickupDate ?? "") : "Pending"}
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

        <section className="sp-guidelines">
          <div className="sp-card">
            <h4 className="sp-card-title">ℹ️ Pickup Guidelines</h4>
            <ul>
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
            <h3 id="confirm-title" className="sp-modal-title">Cancel pickup</h3>
            <p className="sp-modal-body">
              Are you sure you want to cancel this scheduled pickup? This will notify the collector.
            </p>
            <div className="sp-modal-actions">
              <button ref={modalCancelRef} className="sp-action-btn" onClick={() => setConfirmModal(null)}>
                Close
              </button>
              <button
                ref={modalConfirmRef}
                className="sp-button danger"
                onClick={() => confirmModal && cancelSchedule(confirmModal.item._id)}
                aria-busy={!!(confirmModal && updatingIds[confirmModal.item._id])}
              >
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`sp-toast${toast.danger ? " sp-error" : ""}`} role="status" aria-live={toast.danger ? "assertive" : "polite"}>
          {toast.text}
        </div>
      )}
    </div>
  );
}

function formatLocal(iso?: string | null) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleString(); } catch { return iso ?? ""; }
}