import { useEffect, useState } from "react";
import api from "../../api";
import type { AxiosResponse } from "axios";

type Collector = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  active?: boolean;     // used to indicate approved / enabled
  status?: string;      // optional backend-provided status (e.g. 'pending'|'approved'|'rejected')
  createdAt?: string;
  earnings?: number;
};

export default function ManageCollectors() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingOnly, setPendingOnly] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res: AxiosResponse<Collector[] | { data: Collector[] }> = await api.get("/api/admin/collectors");
      const data: Collector[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setCollectors(data);
    } catch (err: any) {
      console.error("Failed to load collectors", err);
      setError(err?.response?.data?.message || "Failed to load collectors");
    } finally {
      setLoading(false);
    }
  }

  // Existing toggle - keeps backward compatibility with your code
  async function toggleActive(id: string, current?: boolean) {
    try {
      await api.patch(`/api/admin/collectors/${id}/active`, { active: !current });
      setCollectors((s) => s.map((c) => (c._id === id ? { ...c, active: !current, status: !current ? "approved" : c.status } : c)));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update collector");
    }
  }

  // Approve flow: prefer a dedicated approve endpoint; fallback to toggleActive
  async function approveCollector(id: string) {
    if (!confirm("Approve this collector?")) return;
    try {
      // Preferred: call dedicated endpoint if backend provides it
      await api.post(`/api/admin/collectors/${id}/approve`);
      setCollectors((s) => s.map((c) => (c._id === id ? { ...c, active: true, status: "approved" } : c)));
    } catch (err) {
      // fallback to toggling active flag if approve endpoint not present
      await toggleActive(id, false);
    }
  }

  // Reject flow: prefer a dedicated reject endpoint (keeps record), or delete as fallback
  async function rejectCollector(id: string) {
    if (!confirm("Reject this collector registration? This may remove their registration.")) return;
    try {
      // Preferred: backend route to mark as rejected
      await api.post(`/api/admin/collectors/${id}/reject`);
      setCollectors((s) => s.map((c) => (c._id === id ? { ...c, active: false, status: "rejected" } : c)));
    } catch (err) {
      // fallback: delete the record if no reject endpoint exists
      try {
        await api.delete(`/api/admin/collectors/${id}`);
        setCollectors((s) => s.filter((c) => c._id !== id));
      } catch (delErr: any) {
        alert(delErr?.response?.data?.message || "Failed to reject/delete collector");
      }
    }
  }

  function viewEarnings(id: string) {
    window.open(`/admin/collector/${id}/earnings`, "_blank");
  }

  const visible = pendingOnly ? collectors.filter((c) => {
    // detect pending: prefer explicit status field, else active === false and created recently
    if (typeof c.status === "string") return c.status === "pending" || c.status === "applied";
    return !c.active;
  }) : collectors;

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <h2>Manage Collectors</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <button onClick={load} style={button}>Refresh</button>

        <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} />
          Show pending only
        </label>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div style={{ color: "crimson" }}>{error}</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Phone</th>
              <th style={th}>Earnings</th>
              <th style={th}>Joined</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {visible.map((c) => {
              const status = c.status ?? (c.active ? "approved" : "pending");
              return (
                <tr key={c._id}>
                  <td style={td}>{c.name}</td>
                  <td style={td}>{c.email}</td>
                  <td style={td}>{c.phone}</td>
                  <td style={td}>Rs {c.earnings ?? 0}</td>
                  <td style={td}>{c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}</td>
                  <td style={td}>
                    <StatusPill status={status} />
                  </td>
                  <td style={td}>
                    {/* If pending, show Approve / Reject. Otherwise allow Enable/Disable and Earnings */}
                    {status === "pending" || status === "applied" ? (
                      <>
                        <button onClick={() => approveCollector(c._id)} style={smallBtn}>Approve</button>{" "}
                        <button onClick={() => rejectCollector(c._id)} style={smallBtnAlt}>Reject</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => toggleActive(c._id, c.active)} style={smallBtn}>{c.active ? "Disable" : "Enable"}</button>{" "}
                        <button onClick={() => viewEarnings(c._id)} style={smallBtnAlt}>Earnings</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* small presentational StatusPill */
function StatusPill({ status }: { status?: string }) {
  const s = (status || "pending").toLowerCase();
  const map: Record<string, { label: string; bg: string; color?: string }> = {
    pending: { label: "Pending", bg: "#fff7e6", color: "#a65f00" },
    applied: { label: "Pending", bg: "#fff7e6", color: "#a65f00" },
    approved: { label: "Active", bg: "#e9f9ee", color: "#0b7a3f" },
    active: { label: "Active", bg: "#e9f9ee", color: "#0b7a3f" },
    rejected: { label: "Rejected", bg: "#fff1f1", color: "#a33" },
    disabled: { label: "Disabled", bg: "#f6f6f6", color: "#666" },
  };
  const meta = map[s] ?? { label: status ?? "Unknown", bg: "#f6f6f6", color: "#333" };
  return <div style={{ padding: "6px 10px", borderRadius: 999, background: meta.bg, color: meta.color, display: "inline-block", fontWeight: 700, fontSize: 12 }}>{meta.label}</div>;
}

/* styles */
const button: React.CSSProperties = { padding: "8px 12px", borderRadius: 6, background: "#0b6efd", color: "#fff", border: "none" };
const smallBtn: React.CSSProperties = { padding: "6px 8px", borderRadius: 6, border: "none", background: "#2c3e50", color: "#fff" };
const smallBtnAlt: React.CSSProperties = { padding: "6px 8px", borderRadius: 6, border: "none", background: "#f1f1f1" };
const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #eee" };
const td: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #f5f5f5" };