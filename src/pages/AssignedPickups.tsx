import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import CollectorSidebar from "../components/CollectorSidebar";
import "./AssignedPickups.css";

/* ── Types ── */
type UserRef = { _id?: string; name?: string; phone?: string; address?: string; email?: string; };
type PickupStatus = "Pending" | "Scheduled" | "Picked" | "CollectedPending" | "Collected" | "Completed" | string;
type Pickup = {
  _id: string; user: UserRef; wasteType: string; quantity: number;
  status: PickupStatus; image?: string | null; createdAt?: string; location?: string;
};

const PAGE_SIZE = 10;

function statusClass(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "completed" || s === "collected") return "ap-status ap-status--collected";
  if (s === "picked" || s === "scheduled")   return "ap-status ap-status--picked";
  if (s.includes("pending") || s.includes("awaiting") || s.includes("approval")) return "ap-status ap-status--pending-approval";
  return "ap-status ap-status--pending";
}

export default function AssignedPickups(): JSX.Element {
  const navigate = useNavigate();

  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchAssigned = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get("/waste/collector/assigned", { signal });
      const items = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setPickups(items);
    } catch (err: any) {
      if (err?.code === "ERR_CANCELED") return;
      setError(err?.response?.data?.message || "Failed to load pickups");
      if (err?.response?.status === 401) setToast("Session expired — please login again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchAssigned(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchAssigned]);

  useEffect(() => {
    const id = setInterval(() => fetchAssigned(), 15000);
    return () => clearInterval(id);
  }, [fetchAssigned]);

  const setUpdating = (id: string, v: boolean) =>
    setUpdatingIds((s) => { const c = { ...s }; if (v) c[id] = true; else delete c[id]; return c; });

  async function tryUpdateEndpoints(id: string, statusPayload: any) {
    const attempts = [
      { method: "patch", url: `/waste/${id}/status`, body: statusPayload },
      { method: "patch", url: `/waste/${id}`, body: statusPayload },
      { method: "post", url: `/waste/${id}/status`, body: statusPayload },
      { method: "post", url: `/waste/complete/${id}` },
      { method: "put", url: `/waste/complete/${id}` },
      { method: "post", url: `/waste/${id}/collect` }, // optional
    ];
    const tried: any[] = [];
    for (const a of attempts) {
      try {
        let res: any;
        if (a.method === "patch") res = await api.patch(a.url, a.body);
        else if (a.method === "post") res = await api.post(a.url, a.body);
        else res = await api.put(a.url, a.body);
        tried.push({ ...a, res });
        if (res && res.status >= 200 && res.status < 300) return { ok: true, used: a, res, tried };
      } catch (err: any) {
        tried.push({ ...a, err });
        const code = err?.response?.status;
        if (code && code !== 404 && code !== 409) return { ok: false, used: a, err, tried };
      }
    }
    return { ok: false, tried };
  }

  const updatePickupStatus = async (id: string, serverStatus: string) => {
    const confirmMsg =
      serverStatus.toLowerCase() === "picked" ? "Mark this pickup as 'Picked Up'?" :
      serverStatus.toLowerCase() === "collected" ? "Mark this pickup as 'Collected'? This will finalize the job." :
      `Change status to ${serverStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    setUpdating(id, true);
    const prev = pickups;
    // optimistic
    setPickups((cur) => cur.map((p) => p._id === id ? { ...p, status: serverStatus } : p));
    try {
      const result = await tryUpdateEndpoints(id, { status: serverStatus });
      if (result.ok) {
        const serverStatusFromRes = result.res?.data?.data?.status ?? result.res?.data?.status ?? serverStatus;
        const lowered = String(serverStatusFromRes || serverStatus).toLowerCase();

        // Exclude any 'collected'/'completed' from view — they go to collector history
        if (lowered.includes("pending") || (lowered.includes("awaiting") && !lowered.includes("collected"))) {
          setPickups((cur) => cur.map(p => p._id === id ? { ...p, status: serverStatusFromRes } : p));
          setToast("Marked collected — awaiting admin approval");
        } else if (lowered.includes("collected") || lowered.includes("completed")) {
          // final — remove from assigned list (collector history handles completed)
          setPickups((cur) => cur.filter((p) => p._id !== id));
          setToast("Pickup completed — moved to history");
          setTimeout(() => navigate("/collector/history"), 700);
        } else {
          await fetchAssigned();
          setToast("Status updated");
        }
      } else {
        const last = (result.tried ?? []).slice(-1)[0];
        const msg = last?.err?.response?.data?.message ?? last?.err?.message ?? "Failed to update status";
        setPickups(prev);
        setToast(msg);
      }
    } catch (err: any) {
      setPickups(prev);
      setToast(err?.response?.data?.message || err?.message || "Failed to update status.");
    } finally {
      setUpdating(id, false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleView = (id: string) => navigate(`/track/${id}`);

  // Exclude any pickups that are 'collected' or 'completed' (case-insensitive)
  const activePickups = useMemo(
    () => pickups.filter(p => {
      const s = String(p.status || "").toLowerCase();
      return !s.includes("collected") && !s.includes("completed");
    }),
    [pickups]
  );

  const visible = useMemo(() => activePickups.slice(0, page * PAGE_SIZE), [activePickups, page]);

  if (loading) return (
    <div className="collector-root">
      <CollectorSidebar />
      <main className="collector-main">
        <div className="ap-loading">Loading assigned pickups…</div>
      </main>
    </div>
  );

  return (
    <div className="collector-root" role="application">
      <CollectorSidebar />
      <main className="collector-main" role="main">
        <header className="collector-header">
          <div>
            <h1 className="collector-title">Assigned Pickups</h1>
            <p className="collector-sub">Pickups currently assigned to you</p>
          </div>
          <div className="collector-header__right">
            <span className="collector-count">{activePickups.length} assigned</span>
            <button className="ap-btn ap-btn--primary" onClick={() => fetchAssigned()} disabled={loading}>
              {loading ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>
        </header>

        {toast && <div className="ap-toast" role="status" aria-live="polite">{toast}</div>}
        {error && <div className="ap-error">⚠ {error}</div>}
        {!error && activePickups.length === 0 && <div className="ap-empty">No pickups assigned to you yet.</div>}

        {!error && activePickups.length > 0 && (
          <section className="ap-grid">
            {visible.map((p) => {
              const statusKey = (p.status || "pending").toLowerCase();
              const awaitingApproval = statusKey.includes("pending") || statusKey.includes("awaiting") || statusKey.includes("approval");
              return (
                <article key={p._id} className="ap-card" data-status={statusKey} aria-labelledby={`pickup-name-${p._id}`}>
                  <div className="ap-card__body">
                    <div className="ap-card__left">
                      <div className="ap-card__user-row">
                        <div>
                          <div className="ap-card__username" id={`pickup-name-${p._id}`}>{p.user?.name ?? "Unknown"}</div>
                          <div className="ap-card__phone">{p.user?.phone ?? "No phone"}</div>
                        </div>
                        <span className={statusClass(String(p.status))}>{String(p.status ?? "Pending")}</span>
                      </div>

                      <div className="ap-card__fields">
                        <div className="ap-field">
                          <span className="ap-field__label">Waste type</span>
                          <span className="ap-field__value">{p.wasteType}</span>
                        </div>
                        <div className="ap-field">
                          <span className="ap-field__label">Quantity</span>
                          <span className="ap-field__value">{p.quantity} kg</span>
                        </div>
                        {p.location && <div className="ap-field"><span className="ap-field__label">Location</span><span className="ap-field__value">{p.location}</span></div>}
                        {p.user?.address && <div className="ap-field"><span className="ap-field__label">Address</span><span className="ap-field__value">{p.user.address}</span></div>}
                      </div>

                      {p.image && <img src={p.image} alt={`Preview of ${p.wasteType}`} className="ap-card__image" loading="lazy" />}
                    </div>

                    <div className="ap-card__right">
                      <div className="ap-card__time">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}</div>

                      <a href={p.user?.phone ? `tel:${p.user.phone}` : "#"} onClick={(e) => { if (!p.user?.phone) { e.preventDefault(); alert("No phone number available"); } }} className="ap-btn ap-btn--call" aria-label={`Call ${p.user?.name ?? "user"}`}>📞 Call user</a>

                      <button onClick={() => handleView(p._id)} className="ap-btn ap-btn--view">View details</button>

                      {!awaitingApproval && statusKey !== "picked" && statusKey !== "collected" && statusKey !== "completed" && (
                        <button onClick={() => updatePickupStatus(p._id, "Picked")} disabled={!!updatingIds[p._id]} className="ap-btn ap-btn--picked">
                          {updatingIds[p._id] ? "Updating…" : "Mark picked"}
                        </button>
                      )}

                      {!awaitingApproval && statusKey === "picked" && (
                        <button onClick={() => updatePickupStatus(p._id, "Collected")} disabled={!!updatingIds[p._id]} className="ap-btn ap-btn--complete">
                          {updatingIds[p._id] ? "Updating…" : "✓ Mark completed"}
                        </button>
                      )}

                      {awaitingApproval && <div className="ap-awaiting">⏳ Awaiting admin approval</div>}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <div className="ap-footer">
          {page * PAGE_SIZE < activePickups.length && <button className="ap-btn ap-btn--load" onClick={() => setPage((p) => p + 1)}>Load more</button>}
        </div>
      </main>
    </div>
  );
}