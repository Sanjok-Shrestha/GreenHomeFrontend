import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import AdminSidebar from "../../components/AdminSidebar";
import "./AdminPendingApprovals.css";


/**
 * AdminPendingApprovals
 * - GET /waste/admin/pending-approvals
 * - POST /waste/:id/approve
 * - POST /waste/:id/reject  { reason }
 */

type UserRef = { _id?: string; name?: string; phone?: string; email?: string; address?: string; };
type Pending = {
  _id: string;
  user?: UserRef | string;
  collector?: UserRef | string;
  wasteType?: string;
  quantity?: number;
  price?: number;
  status?: string;
  pickupDate?: string | null;
  location?: string;
  createdAt?: string;
  imageUrl?: string;
  history?: any[];
};

export default function AdminPendingApprovals(): React.JSX.Element {
  const navigate = useNavigate();
  const [items, setItems] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionIds, setActionIds] = useState<Record<string, boolean>>({});

  const fetchList = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get("/waste/admin/pending-approvals");
      const data = res.data?.data ?? res.data ?? [];
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
    const t = setInterval(fetchList, 15000); // poll every 15s
    return () => clearInterval(t);
  }, [fetchList]);

  const setBusy = (id: string, v: boolean) =>
    setActionIds((s) => { const c = { ...s }; if (v) c[id] = true; else delete c[id]; return c; });

  const approve = async (id: string) => {
    if (!window.confirm("Approve this pickup and mark as Completed?")) return;
    setBusy(id, true);
    try {
      await api.post(`/waste/${id}/approve`);
      setItems((cur) => cur.filter((i) => i._id !== id));
      alert("Approved ✓");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to approve");
    } finally {
      setBusy(id, false);
    }
  };

  const reject = async (id: string) => {
    const reason = window.prompt("Optional reason for rejection (shown to collector):", "");
    if (reason === null) return; // cancelled
    setBusy(id, true);
    try {
      await api.post(`/waste/${id}/reject`, { reason });
      setItems((cur) => cur.filter((i) => i._id !== id));
      alert("Rejected ✓");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to reject");
    } finally {
      setBusy(id, false);
    }
  };

  if (loading && items.length === 0) return (
    <div className="admin-page-root">
      <AdminSidebar />
      <main className="admin-main"><div className="admin-loading">Loading pending approvals…</div></main>
    </div>
  );

  return (
    <div className="admin-page-root">
      <AdminSidebar />

      <main className="admin-main">
        <header className="admin-header">
          <h1>Pending Approvals</h1>
          <div className="admin-actions">
            <button onClick={() => fetchList()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
            <button onClick={() => navigate("/admin")}>Back</button>
          </div>
        </header>

        {error && <div className="admin-error">{error}</div>}

        {!loading && items.length === 0 && <div className="admin-empty">No pending approvals.</div>}

        <main className="admin-list">
          {items.map((p) => (
            <article key={p._id} className="admin-card">
              <div className="admin-card-left">
                <div className="admin-card-title">{p.wasteType ?? "Unknown"}</div>
                <div className="admin-card-meta">
                  <span>{p.quantity ?? "—"} kg</span>
                  <span>•</span>
                  <span>{p.location ?? "—"}</span>
                  <span>•</span>
                  <span>{new Date(p.createdAt || "").toLocaleString()}</span>
                </div>
                {p.pickupDate && <div className="admin-card-schedule">Scheduled: {new Date(p.pickupDate).toLocaleString()}</div>}
                <div className="admin-card-parties">
                  <div>Owner: {(p.user as any)?.name ?? (typeof p.user === "string" ? p.user : "—")}</div>
                  <div>Collector: {(p.collector as any)?.name ?? (typeof p.collector === "string" ? p.collector : "—")}</div>
                </div>
              </div>

              <div className="admin-card-right">
                <div className="admin-card-actions">
                  <button onClick={() => navigate(`/admin/pickup/${p._id}`)}>Open</button>
                  <button onClick={() => approve(p._id)} disabled={!!actionIds[p._id]}> {actionIds[p._id] ? "Working…" : "Approve"} </button>
                  <button onClick={() => reject(p._id)} disabled={!!actionIds[p._id]}> {actionIds[p._id] ? "Working…" : "Reject"} </button>
                </div>
              </div>
            </article>
          ))}
        </main>
      </main>

   
    </div>
  );
}
