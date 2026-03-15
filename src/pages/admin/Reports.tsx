import { useEffect, useMemo, useState } from "react";
import api from "../../api";

type Summary = {
  totalUsers?: number;
  totalPosts?: number;
  totalPickups?: number;
  totalEarnings?: number;
};

type Row = {
  id: string;
  date: string;
  user?: string;
  wasteType?: string;
  quantity?: number;
  price?: number;
  status?: string;
};

export default function Reports() {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [summary, setSummary] = useState<Summary>({});
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await api.get<{ summary: Summary; rows: Row[] }>("/api/admin/reports", { params: { from, to } });
      setSummary(res.data.summary ?? {});
      setRows(res.data.rows ?? []);
    } catch (err: any) {
      console.error("Failed to load reports", err);
      setError(err?.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalRevenue = useMemo(() => rows.reduce((s, r) => s + (r.price || 0), 0), [rows]);

  function exportCSV() {
    if (!rows.length) return alert("No data to export");
    const header = ["id", "date", "user", "wasteType", "quantity", "price", "status"];
    const csv = [header.join(","), ...rows.map((r) => header.map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <h2>Reports</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <label style={{ display: "flex", flexDirection: "column" }}>
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd" }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column" }}>
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd" }} />
        </label>
        <button onClick={load} style={button}>Filter</button>
        <button onClick={() => { setFrom(""); setTo(""); load(); }} style={buttonAlt}>Clear</button>
        <div style={{ flex: 1 }} />
        <button onClick={exportCSV} style={buttonAlt}>Export CSV</button>
      </div>

      {loading ? <div>Loading…</div> : error ? <div style={{ color: "crimson" }}>{error}</div> : (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={summaryCard}><div style={{color:"#666"}}>Total Users</div><div style={{fontWeight:800}}>{summary.totalUsers ?? 0}</div></div>
            <div style={summaryCard}><div style={{color:"#666"}}>Total Posts</div><div style={{fontWeight:800}}>{summary.totalPosts ?? 0}</div></div>
            <div style={summaryCard}><div style={{color:"#666"}}>Total Pickups</div><div style={{fontWeight:800}}>{summary.totalPickups ?? 0}</div></div>
            <div style={summaryCard}><div style={{color:"#666"}}>Total Earnings</div><div style={{fontWeight:800}}>{summary.totalEarnings ?? 0}</div></div>
          </div>

          <div style={{ background: "#fff", padding: 12, borderRadius: 8 }}>
            <div style={{ marginBottom: 8, color: "#666" }}>Total rows: {rows.length} • Revenue: Rs {totalRevenue}</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Date</th>
                  <th style={th}>User</th>
                  <th style={th}>Type</th>
                  <th style={th}>Qty</th>
                  <th style={th}>Price</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={td}>{new Date(r.date).toLocaleString()}</td>
                    <td style={td}>{r.user}</td>
                    <td style={td}>{r.wasteType}</td>
                    <td style={td}>{r.quantity}</td>
                    <td style={td}>Rs {r.price}</td>
                    <td style={td}>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const button: React.CSSProperties = { padding: "8px 12px", borderRadius: 6, background: "#0b6efd", color: "#fff", border: "none" };
const buttonAlt: React.CSSProperties = { padding: "8px 12px", borderRadius: 6, background: "#f1f1f1", border: "none" };
const summaryCard: React.CSSProperties = { background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", minWidth: 140 };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #eee" };
const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #f5f5f5" };