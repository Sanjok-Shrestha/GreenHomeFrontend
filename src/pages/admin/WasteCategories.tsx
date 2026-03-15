import { useEffect, useState } from "react";
import api from "../../api";
import type { AxiosResponse } from "axios";

type Category = {
  _id?: string;
  name: string;
  description?: string;
  active?: boolean;
};

export default function WasteCategories() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Explicitly type the response so TypeScript knows `.data` exists
      const res: AxiosResponse<Category[] | { data: Category[] }> = await api.get("/api/admin/categories");
      const data: Category[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setCats(data);
    } catch (err: any) {
      console.error("Failed to load categories", err);
      setError(err?.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  async function add() {
    if (!newName.trim()) return alert("Enter a category name");
    try {
      await api.post("/api/admin/categories", { name: newName.trim(), description: newDesc.trim() });
      setNewName("");
      setNewDesc("");
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to add category");
    }
  }

  async function toggle(id?: string, current?: boolean) {
    if (!id) return;
    try {
      await api.patch(`/api/admin/categories/${id}`, { active: !current });
      setCats((s) => s.map((c) => (c._id === id ? { ...c, active: !current } : c)));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update");
    }
  }

  async function remove(id?: string) {
    if (!id || !confirm("Delete category?")) return;
    try {
      await api.delete(`/api/admin/categories/${id}`);
      setCats((s) => s.filter((c) => c._id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete");
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2>Waste Categories</h2>
      <p style={{ color: "#666" }}>Manage categories used across postings and pricing</p>

      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <input
          placeholder="Category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd", marginRight: 8 }}
        />
        <input
          placeholder="Description (optional)"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd", marginRight: 8 }}
        />
        <button onClick={add} style={button}>Add</button>
        <button onClick={load} style={buttonAlt}>Refresh</button>
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
              <th style={th}>Description</th>
              <th style={th}>Active</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c._id}>
                <td style={td}>{c.name}</td>
                <td style={td}>{c.description}</td>
                <td style={td}>{c.active ? "Yes" : "No"}</td>
                <td style={td}>
                  <button onClick={() => toggle(c._id, c.active)} style={smallBtn}>
                    {c.active ? "Disable" : "Enable"}
                  </button>{" "}
                  <button onClick={() => remove(c._id)} style={smallBtnDanger}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const button: React.CSSProperties = { padding: "8px 12px", borderRadius: 6, background: "#0b6efd", color: "#fff", border: "none" };
const buttonAlt: React.CSSProperties = { padding: "8px 12px", borderRadius: 6, background: "#f1f1f1", border: "none" };
const smallBtn: React.CSSProperties = { padding: "6px 8px", borderRadius: 6, border: "none", background: "#2c3e50", color: "#fff" };
const smallBtnDanger: React.CSSProperties = { padding: "6px 8px", borderRadius: 6, border: "none", background: "#c0392b", color: "#fff" };
const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #eee" };
const td: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #f5f5f5" };