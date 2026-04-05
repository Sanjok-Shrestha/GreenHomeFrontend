// src/pages/admin/ManageCollectors.tsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../api";
import type { AxiosResponse } from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import "./ManageCollectors.css";

/* ── Types ── */
type Collector = {
  id?: string; _id: string; name?: string; email?: string; phone?: string;
  active?: boolean; status?: string; createdAt?: string; points?: number; isApproved?: boolean;
};
type Toast = { text: string; kind?: "info" | "success" | "danger" };

/* ── StatusBadge ── */
function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "pending").toLowerCase();
  const map: Record<string, { label: string; cls: string }> = {
    pending:  { label: "Pending",  cls: "mc-badge--pending"  },
    applied:  { label: "Pending",  cls: "mc-badge--pending"  },
    approved: { label: "Approved", cls: "mc-badge--approved" },
    active:   { label: "Active",   cls: "mc-badge--approved" },
    rejected: { label: "Rejected", cls: "mc-badge--rejected" },
    disabled: { label: "Disabled", cls: "mc-badge--disabled" },
  };
  const { label, cls } = map[s] ?? { label: status ?? "Unknown", cls: "mc-badge--disabled" };
  return <span className={`mc-badge ${cls}`}>{label}</span>;
}

/* ── Normalizer ── */
function normalizeCollector(d: Partial<any>): Collector {
  const id        = String((d as any).id ?? d._id ?? "");
  const activeFlag= typeof d.active === "boolean" ? d.active : !!d.isApproved;
  const statusRaw = (d.status ?? (activeFlag ? "approved" : "pending")) as string;
  return {
    id, _id: id,
    name:      String(d.name  ?? ""),
    email:     String(d.email ?? ""),
    phone:     String(d.phone ?? ""),
    points:    Number(d.points ?? 0),
    createdAt: d.createdAt ?? (d as any).created_at ?? undefined,
    active:    Boolean(activeFlag),
    status:    statusRaw.toLowerCase(),
    isApproved:Boolean(d.isApproved ?? (statusRaw.toLowerCase() === "approved")),
  };
}

/* ── Component ── */
export default function ManageCollectors() {
  const location = useLocation();

  const [collectors,     setCollectors]     = useState<Collector[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [pendingOnly,    setPendingOnly]    = useState(false);
  const [search,         setSearch]         = useState("");
  const [mutationLoading,setMutationLoading]= useState(false);
  const [mutationId,     setMutationId]     = useState<string | null>(null);
  const [toast,          setToast]          = useState<Toast | null>(null);

  const showToast = (text: string, kind: Toast["kind"] = "info", ttl = 3000) => {
    setToast({ text, kind });
    setTimeout(() => setToast(null), ttl);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("filter") === "pending") setPendingOnly(true);
  }, []);

  useEffect(() => { load(); }, [pendingOnly]);

  async function load(pendingOverride?: boolean) {
    setLoading(true); setError(null);
    try {
      const usePending = typeof pendingOverride === "boolean" ? pendingOverride : pendingOnly;
      const res: AxiosResponse<any> = await api.get("/admin/collectors", {
        params: { _t: Date.now(), filter: usePending ? "pending" : undefined },
      });
      const raw: any[] = Array.isArray(res.data) ? res.data : (res.data as any)?.data ?? [];
      setCollectors(raw.map((d) => normalizeCollector(d)));
    } catch (err: any) {
      setError(err?.response?.data?.message || String(err?.message || "Failed to load collectors"));
    } finally { setLoading(false); }
  }

  function updateCollectorInState(updated: Collector) {
    const uid    = String(updated._id);
    const status = (updated.status ?? (updated.active ? "approved" : "pending")).toLowerCase();
    setCollectors((prev) => {
      if (pendingOnly && status !== "pending" && status !== "applied")
        return prev.filter((c) => String(c._id) !== uid);
      let found = false;
      const next = prev.map((c) => { if (String(c._id) === uid) { found = true; return { ...c, ...updated }; } return c; });
      if (!found) next.unshift({ ...updated });
      return next;
    });
  }

  async function toggleActive(id: string, current?: boolean) {
    setMutationLoading(true); setMutationId(id);
    try {
      const res = await api.patch(`/admin/collectors/${id}/active`, { active: !current });
      const ret = res.data?.collector ?? null;
      if (ret) updateCollectorInState(normalizeCollector(ret));
      else setCollectors((prev) => prev.map((c) => c._id === id ? { ...c, active: !current, status: !current ? "approved" : "disabled" } : c));
      await load();
      showToast("Collector updated", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to update collector", "danger");
    } finally { setMutationLoading(false); setMutationId(null); }
  }

  async function approveCollector(id: string) {
    if (!confirm("Approve this collector?")) return;
    setMutationLoading(true); setMutationId(id);
    try {
      const res = await api.post(`/admin/collectors/${id}/approve`);
      const ret = res.data?.collector ?? null;
      if (ret) updateCollectorInState(normalizeCollector(ret));
      else updateCollectorInState({ _id: id, status: "approved", active: true, name: "", email: "", phone: "" } as Collector);
      await load();
      showToast("Collector approved", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to approve collector", "danger");
    } finally { setMutationLoading(false); setMutationId(null); }
  }

  async function rejectCollector(id: string) {
    if (!confirm("Reject this collector registration?")) return;
    setMutationLoading(true); setMutationId(id);
    try {
      const res = await api.post(`/admin/collectors/${id}/reject`);
      const ret = res.data?.collector ?? null;
      if (ret) { updateCollectorInState(normalizeCollector(ret)); showToast("Collector rejected", "info"); }
      else {
        try { await api.delete(`/admin/collectors/${id}`); setCollectors((p) => p.filter((c) => c._id !== id)); showToast("Collector removed", "info"); }
        catch (delErr: any) { showToast(delErr?.response?.data?.message || "Failed to reject/delete", "danger"); }
      }
      await load();
    } catch (err: any) {
      try { await api.delete(`/admin/collectors/${id}`); setCollectors((p) => p.filter((c) => c._id !== id)); showToast("Collector removed", "info"); }
      catch (delErr: any) { showToast(delErr?.response?.data?.message || "Failed to reject/delete", "danger"); }
    } finally { setMutationLoading(false); setMutationId(null); }
  }

  const pendingCount  = collectors.filter((c) => { const s = (c.status ?? "").toLowerCase(); return s === "pending" || s === "applied"; }).length;
  const approvedCount = collectors.filter((c) => (c.status ?? "").toLowerCase() === "approved").length;

  const visible = collectors
    .filter((c) => {
      if (pendingOnly) { const s = (c.status ?? "").toLowerCase(); return s === "pending" || s === "applied"; }
      return true;
    })
    .filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return [c.name, c.email, c.phone].some((v) => (v ?? "").toLowerCase().includes(q));
    });

  return (
    <div className="admin-page">
      <AdminSidebar />

      <main className="admin-main">
        <div className="mc-page">

          {/* ── Header ── */}
          <div className="mc-header">
            <div>
              <h2 className="mc-title">Manage Collectors</h2>
              <div className="mc-sub">
                {loading ? "Loading…" : `${visible.length} of ${collectors.length} collector${collectors.length !== 1 ? "s" : ""}`}
              </div>
            </div>
            <div className="mc-header__chips">
              {pendingCount > 0 && <span className="mc-chip mc-chip--warning">⏳ {pendingCount} pending</span>}
              <span className="mc-chip mc-chip--success">✓ {approvedCount} approved</span>
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div className="mc-toolbar">
            <input
              className="mc-search"
              placeholder="Search name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search collectors"
            />
            <button
              type="button"
              className="mc-btn mc-btn--primary"
              onClick={() => load()}
              disabled={loading || mutationLoading}
            >
              ↻ Refresh
            </button>
            <label className="mc-toggle">
              <input
                type="checkbox"
                checked={pendingOnly}
                onChange={(e) => setPendingOnly(e.target.checked)}
                disabled={loading || mutationLoading}
              />
              Pending only
            </label>
            {mutationLoading && <span className="mc-processing">Processing…</span>}
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="mc-error">
              ⚠ {error}
              <button className="mc-btn mc-btn--sm" onClick={() => load()} style={{ marginLeft: 8 }}>Retry</button>
            </div>
          )}

          {/* ── Loading ── */}
          {loading && <div className="mc-loading">Loading collectors…</div>}

          {/* ── Table ── */}
          {!loading && !error && (
            <div className="mc-table-wrap">
              <table className="mc-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Points</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="mc-empty">
                        {pendingOnly ? "No pending collectors." : "No collectors found."}
                      </td>
                    </tr>
                  ) : visible.map((c) => {
                    const status    = (c.status ?? (c.active ? "approved" : "pending")).toLowerCase();
                    const isPending = status === "pending" || status === "applied";
                    const isBusy    = mutationId === c._id && mutationLoading;
                    return (
                      <tr key={c._id} className={isBusy ? "mc-row--busy" : ""}>
                        <td><span className="mc-name">{c.name || "—"}</span></td>
                        <td><span className="mc-mono">{c.email || "—"}</span></td>
                        <td><span className="mc-mono">{c.phone || "—"}</span></td>
                        <td><span className="mc-points">{c.points ?? 0}</span></td>
                        <td><span className="mc-mono">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</span></td>
                        <td><StatusBadge status={status} /></td>
                        <td>
                          <div className="mc-actions">
                            {isPending ? (
                              <>
                                <button type="button" className="mc-btn mc-btn--approve mc-btn--sm"
                                  onClick={() => approveCollector(c._id)} disabled={mutationLoading}>
                                  {isBusy ? "Approving…" : "✓ Approve"}
                                </button>
                                <button type="button" className="mc-btn mc-btn--danger mc-btn--sm"
                                  onClick={() => rejectCollector(c._id)} disabled={mutationLoading}>
                                  {isBusy ? "Rejecting…" : "✕ Reject"}
                                </button>
                              </>
                            ) : (
                              <>
                                <button type="button" className="mc-btn mc-btn--ghost mc-btn--sm"
                                  onClick={() => toggleActive(c._id, c.active)} disabled={mutationLoading}>
                                  {isBusy ? (c.active ? "Disabling…" : "Enabling…") : (c.active ? "Disable" : "Enable")}
                                </button>
                                <button type="button" className="mc-btn mc-btn--sm"
                                  onClick={() => window.open(`/admin/collector/${c._id}`, "_blank")}>
                                  View ↗
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Toast ── */}
          {toast && (
            <div className="mc-toast" role="status" aria-live="polite">
              <div className={`mc-toast__inner mc-toast__inner--${toast.kind ?? "info"}`}>{toast.text}</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}