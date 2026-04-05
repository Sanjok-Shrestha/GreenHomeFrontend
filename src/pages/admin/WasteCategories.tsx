import React, { useEffect, useState, type JSX } from "react";
import api from "../../api";
import AdminSidebar from "../../components/AdminSidebar";

type Category = {
  _id?: string;
  name: string;
  description?: string;
  active?: boolean;
};

export default function WasteCategories(): JSX.Element {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // detected mode:
  // - "admin" -> admin CRUD endpoints available at /api/admin/categories
  // - null -> not admin / unauthorized
  const [mode, setMode] = useState<"admin" | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function normalizeStringsOrObjects(raw: any): Category[] {
    if (!raw) return [];
    // unwrap common wrappers: { data: [...] } or { categories: [...] } or { result: [...] }
    if (!Array.isArray(raw) && typeof raw === "object") {
      if (Array.isArray(raw.data)) raw = raw.data;
      else if (Array.isArray(raw.categories)) raw = raw.categories;
      else if (Array.isArray(raw.result)) raw = raw.result;
    }
    if (Array.isArray(raw)) {
      // string[] -> map to { name }
      if (raw.length === 0) return [];
      if (typeof raw[0] === "string") {
        return (raw as string[]).map((s) => ({ name: String(s).trim() })).filter((c) => c.name);
      }
      // array of objects -> extract name-like fields
      return (raw as any[]).map((d) => {
        const name = String(d?.name ?? d?.label ?? d?.wasteType ?? d?.type ?? d?.title ?? "");
        return {
          _id: d?._id ?? d?.id ?? undefined,
          name,
          description: d?.description ?? d?.desc ?? "",
          active: typeof d?.active === "boolean" ? d.active : true,
        } as Category;
      }).filter((c) => c.name);
    }
    return [];
  }

  // load enforces admin-only access: first confirm profile and admin role, then call admin endpoint
  async function load() {
    setLoading(true);
    setError(null);
    setMode(null);
    setCats([]);

    // 1) Check authenticated profile
    let profile: any = null;
    try {
      const profRes = await api.get("/users/profile");
      profile = profRes?.data ?? null;
    } catch (e: any) {
      // not authenticated or profile fetch failed
      console.debug("Profile fetch failed:", e?.response?.status ?? e?.message);
      setError("Unauthorized — admin only");
      setLoading(false);
      return;
    }

    // 2) Verify admin role
    const isAdmin = !!(profile && (profile.role === "admin" || profile.isAdmin === true));
    if (!isAdmin) {
      setError("Unauthorized — admin only");
      setLoading(false);
      return;
    }

    // 3) Fetch admin categories
    try {
      const res = await api.get("/admin/categories");
      if (res && res.status >= 200 && res.status < 300) {
        const raw = res.data;
        const normalized = normalizeStringsOrObjects(raw);
        setCats(normalized);
        setMode("admin");
        setLoading(false);
        return;
      } else {
        setError("Admin categories endpoint returned no data.");
      }
    } catch (err: any) {
      console.error("/admin/categories failed:", err);
      setError("Failed to load admin categories");
    } finally {
      setLoading(false);
    }
  }

  // Add (admin only)
  async function add() {
    if (mode !== "admin") {
      alert("Add is not available: admin endpoints are not available on the server or you are not an admin.");
      return;
    }
    if (!newName.trim()) return alert("Enter a category name");
    setError(null);
    const payload = { name: newName.trim(), description: newDesc.trim() };
    // Optimistic UI: append a temp item
    const tempId = `temp-${Date.now()}`;
    const tempItem: Category = { _id: tempId, name: payload.name, description: payload.description, active: true };
    setCats((s) => [tempItem, ...s]);
    setNewName("");
    setNewDesc("");
    try {
      const res = await api.post("/admin/categories", payload);
      const created = res?.data;
      // replace temp with created if returned
      setCats((s) =>
        s.map((c) =>
          c._id === tempId
            ? (created
                ? {
                    _id: created._id ?? created.id ?? created._id,
                    name: created.name ?? payload.name,
                    description: created.description ?? payload.description ?? "",
                    active: typeof created.active === "boolean" ? created.active : true,
                  }
                : c)
            : c
        )
      );
      setToast("Category added");
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      console.error("Add category failed", err);
      // rollback
      setCats((s) => s.filter((c) => c._id !== tempId));
      alert(err?.response?.data?.message || err?.message || "Failed to add category");
    }
  }

  // Toggle active (admin only)
  async function toggle(id?: string, current?: boolean) {
    if (mode !== "admin") {
      alert("Edit is not available: admin endpoints are not available on the server or you are not an admin.");
      return;
    }
    if (!id) return;
    // optimistic update
    const prev = cats;
    setCats((s) => s.map((c) => (c._id === id ? { ...c, active: !current } : c)));
    try {
      await api.patch(`/admin/categories/${id}`, { active: !current });
      setToast("Updated");
      setTimeout(() => setToast(null), 2000);
    } catch (err: any) {
      console.error("Toggle failed", err);
      setCats(prev);
      alert(err?.response?.data?.message || err?.message || "Failed to update");
    }
  }

  // Remove (admin only)
  async function remove(id?: string) {
    if (mode !== "admin") {
      alert("Delete is not available: admin endpoints are not available on the server or you are not an admin.");
      return;
    }
    if (!id || !confirm("Delete category?")) return;
    const prev = cats;
    setCats((s) => s.filter((c) => c._id !== id));
    try {
      await api.delete(`/admin/categories/${id}`);
      setToast("Deleted");
      setTimeout(() => setToast(null), 2000);
    } catch (err: any) {
      console.error("Delete failed", err);
      setCats(prev);
      alert(err?.response?.data?.message || err?.message || "Failed to delete");
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f7f5" }}>
      <AdminSidebar />

      <main style={{ flex: 1, padding: 20 }}>
        <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
          <h2>Waste Categories</h2>
          <p style={{ color: "#666" }}>Manage categories used across postings and pricing</p>

          <div style={{ marginTop: 12, marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <input
              placeholder="Category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd", flex: 1 }}
              disabled={mode !== "admin"}
              title={mode === "admin" ? "Enter a category name" : "Disabled — admin endpoint not available or you are not an admin"}
            />
            <input
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd", flex: 1 }}
              disabled={mode !== "admin"}
            />
            <button onClick={add} style={mode === "admin" ? button : disabledButton} disabled={mode !== "admin"}>
              Add
            </button>
            <button onClick={load} style={buttonAlt}>Refresh</button>
          </div>

          {toast && <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: "#0b6efd", color: "#fff" }}>{toast}</div>}

          {loading ? (
            <div style={{ padding: 48, color: "#666" }}>Loading categories…</div>
          ) : error ? (
            <div style={{ padding: 18, color: "crimson" }}>⚠ {error}</div>
          ) : cats.length === 0 ? (
            <div style={{ padding: 28, background: "#fff", borderRadius: 12 }}>No categories found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8 }}>
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
                  <tr key={c._id ?? c.name}>
                    <td style={td}>{c.name}</td>
                    <td style={td}>{c.description ?? "—"}</td>
                    <td style={td}>{typeof c.active === "boolean" ? (c.active ? "Yes" : "No") : "—"}</td>
                    <td style={td}>
                      <button
                        onClick={() => toggle(c._id, c.active)}
                        style={mode === "admin" ? smallBtn : smallBtnDisabled}
                        disabled={mode !== "admin"}
                      >
                        {c.active ? "Disable" : "Enable"}
                      </button>{" "}
                      <button
                        onClick={() => remove(c._id)}
                        style={mode === "admin" ? smallBtnDanger : smallBtnDangerDisabled}
                        disabled={mode !== "admin"}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: 12, color: "#666", fontSize: 13 }}>
            <div>
              Mode: <strong>{mode ?? "unauthorized"}</strong>
            </div>
            <div style={{ marginTop: 6 }}>
              {mode === "admin" && "Using admin CRUD endpoints at /api/admin/categories."}
              {mode === null && "This page is admin-only. Please sign in as an admin to manage categories."}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* styles */
const button: React.CSSProperties = { padding: "8px 12px", borderRadius: 6, background: "#0b6efd", color: "#fff", border: "none" };
const buttonAlt: React.CSSProperties = { padding: "8px 12px", borderRadius: 6, background: "#f1f1f1", border: "none" };
const disabledButton: React.CSSProperties = { padding: "8px 12px", borderRadius: 6, background: "#e9ecef", border: "none", color: "#888" };
const smallBtn: React.CSSProperties = { padding: "6px 8px", borderRadius: 6, border: "none", background: "#2c3e50", color: "#fff" };
const smallBtnDisabled: React.CSSProperties = { ...smallBtn, opacity: 0.5, cursor: "not-allowed" };
const smallBtnDanger: React.CSSProperties = { padding: "6px 8px", borderRadius: 6, border: "none", background: "#c0392b", color: "#fff" };
const smallBtnDangerDisabled: React.CSSProperties = { ...smallBtnDanger, opacity: 0.5, cursor: "not-allowed" };
const th: React.CSSProperties = { textAlign: "left", padding: "12px", borderBottom: "1px solid #eee" };
const td: React.CSSProperties = { padding: "12px", borderBottom: "1px solid #f5f5f5" };