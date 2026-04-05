import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import AdminSidebar from "../../components/AdminSidebar";
import "./Reports.css";

type Summary = {
  totalUsers?: number; totalPosts?: number;
  totalPickups?: number; totalEarnings?: number;
};
type Row = {
  id?: string; _id?: string; date: string; user?: string;
  wasteType?: string; quantity?: number; price?: number; status?: string;
};

export default function Reports() {
  const [from,    setFrom]    = useState("");
  const [to,      setTo]      = useState("");
  const [summary, setSummary] = useState<Summary>({});
  const [rows,    setRows]    = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res  = await api.get("/admin/reports", { params: { from, to } });
      const data = res.data;
      if (Array.isArray(data)) { setRows(data); setSummary({}); }
      else { setSummary(data.summary ?? {}); setRows(data.rows ?? []); }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load reports");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const totalRevenue = useMemo(() => rows.reduce((s, r) => s + (r.price || 0), 0), [rows]);

  function exportCSV() {
    if (!rows.length) return alert("No data to export");
    const header = ["id","date","user","wasteType","quantity","price","status"];
    const csvRows = rows.map((r) =>
      [r.id ?? r._id ?? "", r.date ?? "", r.user ?? "", r.wasteType ?? "",
       String(r.quantity ?? ""), String(r.price ?? ""), r.status ?? ""]
      .map((c) => `"${String(c).replace(/"/g,'""')}"`).join(",")
    );
    const csv  = [header.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function clearFilter() { setFrom(""); setTo(""); setTimeout(load, 0); }

  function statusClass(s?: string) {
    const key = (s ?? "").toLowerCase();
    if (key === "collected" || key === "completed") return "rp-status rp-status--collected";
    if (key === "pending")  return "rp-status rp-status--pending";
    if (key === "rejected") return "rp-status rp-status--rejected";
    return "rp-status";
  }

  return (
    <div className="admin-page" style={{ display: "flex", minHeight: "100vh", background: "var(--bg, #fff)" }}>
      <AdminSidebar />

      <main className="admin-main" style={{ flex: 1 }}>
        <div className="rp-page">

          {/* ── Header ── */}
          <div className="rp-header">
            <div>
              <h2 className="rp-title">Reports</h2>
              <p className="rp-sub">Pickup activity and revenue overview</p>
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div className="rp-toolbar">
            <div className="rp-field">
              <span className="rp-label">From</span>
              <input
                type="date"
                className="rp-date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-label="From date"
              />
            </div>

            <div className="rp-field">
              <span className="rp-label">To</span>
              <input
                type="date"
                className="rp-date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-label="To date"
              />
            </div>

            <button className="rp-btn rp-btn--primary" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Filter"}
            </button>

            <button className="rp-btn" onClick={clearFilter} disabled={loading}>
              Clear
            </button>

            <div className="rp-toolbar__actions">
              <button className="rp-btn rp-btn--export" onClick={exportCSV} disabled={!rows.length}>
                ↓ Export CSV
              </button>
            </div>
          </div>

          {/* ── States ── */}
          {loading && <div className="rp-loading">Loading report…</div>}
          {error   && <div className="rp-error">⚠ {error}</div>}

          {!loading && !error && (
            <>
              {/* ── Summary metrics ── */}
              <div className="rp-summary">
                <div className="rp-metric">
                  <div className="rp-metric__label">Total Users</div>
                  <div className="rp-metric__value">{(summary.totalUsers ?? 0).toLocaleString()}</div>
                </div>
                <div className="rp-metric">
                  <div className="rp-metric__label">Total Posts</div>
                  <div className="rp-metric__value">{(summary.totalPosts ?? 0).toLocaleString()}</div>
                </div>
                <div className="rp-metric rp-metric--blue">
                  <div className="rp-metric__label">Total Pickups</div>
                  <div className="rp-metric__value">{(summary.totalPickups ?? 0).toLocaleString()}</div>
                </div>
                <div className="rp-metric rp-metric--green">
                  <div className="rp-metric__label">Total Earnings</div>
                  <div className="rp-metric__value">Rs {(summary.totalEarnings ?? 0).toLocaleString()}</div>
                </div>
              </div>

              {/* ── Table card ── */}
              <div className="rp-table-card">
                <div className="rp-table-meta">
                  <span className="rp-table-meta__info">
                    {rows.length} row{rows.length !== 1 ? "s" : ""}
                  </span>
                  <span className="rp-revenue">Rs {totalRevenue.toLocaleString()} total revenue</span>
                </div>

                <div className="rp-table-wrap">
                  <table className="rp-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>User</th>
                        <th>Type</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr className="rp-empty"><td colSpan={6}>No report data found.</td></tr>
                      ) : rows.map((r) => (
                        <tr key={r.id ?? r._id ?? Math.random()}>
                          <td><span className="rp-mono">{r.date ? new Date(r.date).toLocaleDateString() : "—"}</span></td>
                          <td>{r.user ?? "—"}</td>
                          <td>{r.wasteType ?? "—"}</td>
                          <td><span className="rp-mono">{r.quantity ?? "—"}</span></td>
                          <td><span className="rp-price">Rs {r.price ?? 0}</span></td>
                          <td><span className={statusClass(r.status)}>{r.status ?? "—"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}