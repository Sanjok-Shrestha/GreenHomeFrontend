import { useEffect, useState } from "react";
import api from "../../api";
import type { AxiosResponse } from "axios";

type User = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
  createdAt?: string;
};

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Strongly type response so TypeScript knows `.data` exists
      const res: AxiosResponse<User[] | { data: User[] }> = await api.get("/api/admin/users");
      const data: User[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setUsers(data);
    } catch (err: any) {
      console.error("Failed to load users", err);
      setError(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(userId: string, current: boolean | undefined) {
    try {
      await api.patch(`/api/admin/users/${userId}/active`, { active: !current });
      setUsers((s) => s.map((u) => (u._id === userId ? { ...u, active: !current } : u)));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update user");
    }
  }

  async function removeUser(userId: string) {
    if (!confirm("Delete user? This is permanent.")) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      setUsers((s) => s.filter((u) => u._id !== userId));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete user");
    }
  }

  const filtered = users.filter(
    (u) =>
      !q ||
      (u.name ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <h2>Manage Users</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" style={inputStyle} />
        <button onClick={load} style={button}>Refresh</button>
        <button onClick={() => exportCSV(filtered)} style={buttonAlt}>Export CSV</button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: "crimson" }}>{error}</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Role</th>
              <th style={th}>Joined</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u._id}>
                <td style={td}>{u.name}</td>
                <td style={td}>{u.email}</td>
                <td style={td}>{u.role}</td>
                <td style={td}>{u.createdAt ? new Date(u.createdAt).toLocaleString() : ""}</td>
                <td style={td}>
                  <button onClick={() => toggleActive(u._id, u.active)} style={smallBtn}>
                    {u.active ? "Disable" : "Enable"}
                  </button>{" "}
                  <button onClick={() => removeUser(u._id)} style={smallBtnDanger}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* helpers */
function exportCSV(list: any[]) {
  if (!list.length) { alert("No rows to export"); return; }
  const header = Object.keys(list[0]);
  const rows = list.map((r) => header.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","));
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `users_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* styles */
const inputStyle: React.CSSProperties = { padding: 8, borderRadius: 6, border: "1px solid #ddd", flex: 1 };
const button: React.CSSProperties = { padding: "8px 12px", background: "#0b6efd", color: "#fff", border: "none", borderRadius: 6 };
const buttonAlt: React.CSSProperties = { padding: "8px 12px", background: "#f1f1f1", border: "none", borderRadius: 6 };
const smallBtn: React.CSSProperties = { padding: "6px 8px", borderRadius: 6, border: "none", background: "#2c3e50", color: "#fff", cursor: "pointer" };
const smallBtnDanger: React.CSSProperties = { padding: "6px 8px", borderRadius: 6, border: "none", background: "#c0392b", color: "#fff", cursor: "pointer" };
const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #eee" };
const td: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #f5f5f5" };