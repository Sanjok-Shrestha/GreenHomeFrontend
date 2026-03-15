import { useEffect, useState } from "react";
import api from "../../api";
import type { AxiosResponse } from "axios";

type PriceItem = {
  _id?: string;
  wasteType: string;
  pricePerKg: number;
};

export default function PricingManagement() {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // editing: track which id is editing and per-id value
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  // add new item
  const [newType, setNewType] = useState<string>("");
  const [newPrice, setNewPrice] = useState<string>("");

  // request states
  const [saving, setSaving] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res: AxiosResponse<PriceItem[] | { data: PriceItem[] }> = await api.get("/api/admin/pricing");
      const data: PriceItem[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setItems(data);
      // seed editing values
      const seed: Record<string, string> = {};
      data.forEach((d) => {
        if (d._id) seed[d._id] = String(d.pricePerKg);
      });
      setEditingValues(seed);
    } catch (err: any) {
      console.error("Failed to load pricing", err);
      setError(err?.response?.data?.message || "Failed to load pricing");
    } finally {
      setLoading(false);
    }
  }

  function setEditingValue(id: string, v: string) {
    setEditingValues((s) => ({ ...s, [id]: v }));
  }

  async function save(id?: string) {
    // if id provided -> update existing
    if (id) {
      const raw = editingValues[id];
      const num = Number(raw);
      if (raw === "" || Number.isNaN(num) || num < 0) {
        alert("Enter a valid non-negative price");
        return;
      }
      setSaving(true);
      try {
        await api.patch(`/api/admin/pricing/${id}`, { pricePerKg: num });
        // reload or optimistic update
        setItems((prev) => prev.map((p) => (p._id === id ? { ...p, pricePerKg: num } : p)));
        setEditingId(null);
      } catch (err: any) {
        alert(err?.response?.data?.message || "Failed to save pricing");
      } finally {
        setSaving(false);
      }
    } else {
      // add new
      const type = newType.trim();
      const num = Number(newPrice);
      if (!type) {
        alert("Provide a waste type name");
        return;
      }
      if (newPrice === "" || Number.isNaN(num) || num < 0) {
        alert("Enter a valid non-negative price");
        return;
      }
      setSaving(true);
      try {
        const res = await api.post("/api/admin/pricing", { wasteType: type, pricePerKg: num });
        // if backend returns created item, append it; otherwise reload list
        const created: PriceItem | null = res?.data ?? null;
        if (created && created._id) {
          setItems((prev) => [created, ...prev]);
          setEditingValues((s) => ({ ...s, [created._id!]: String(created.pricePerKg) }));
        } else {
          await load();
        }
        setNewType("");
        setNewPrice("");
      } catch (err: any) {
        alert(err?.response?.data?.message || "Failed to add pricing");
      } finally {
        setSaving(false);
      }
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete pricing item?")) return;
    setDeletingIds((s) => ({ ...s, [id]: true }));
    try {
      await api.delete(`/api/admin/pricing/${id}`);
      setItems((s) => s.filter((i) => i._id !== id));
      // cleanup editing values
      setEditingValues((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete");
    } finally {
      setDeletingIds((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2>Pricing Management</h2>
      <p style={{ color: "#666" }}>Set price per kg for waste categories</p>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div style={{ color: "crimson" }}>{error}</div>
      ) : (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
            <thead>
              <tr>
                <th style={th}>Waste Type</th>
                <th style={th}>Price / Kg (Rs)</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it._id}>
                  <td style={td}>{it.wasteType}</td>
                  <td style={td}>
                    {editingId === it._id ? (
                      <input
                        type="number"
                        value={editingValues[it._id ?? ""] ?? ""}
                        onChange={(e) => setEditingValue(it._id ?? "", e.target.value)}
                        style={{ padding: 6, width: 140 }}
                        min="0"
                        step="0.01"
                        disabled={saving}
                      />
                    ) : (
                      `Rs ${it.pricePerKg}`
                    )}
                  </td>
                  <td style={td}>
                    {editingId === it._id ? (
                      <>
                        <button onClick={() => save(it._id)} style={smallBtn} disabled={saving}>
                          {saving ? "Saving…" : "Save"}
                        </button>{" "}
                        <button
                          onClick={() => {
                            setEditingId(null);
                          }}
                          style={smallBtnAlt}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(it._id ?? null);
                            setEditingValues((s) => ({ ...s, [it._id ?? ""]: String(it.pricePerKg) }));
                          }}
                          style={smallBtn}
                        >
                          Edit
                        </button>{" "}
                        <button onClick={() => remove(it._id!)} style={smallBtnDanger} disabled={Boolean(deletingIds[it._id ?? ""])}>
                          {deletingIds[it._id ?? ""] ? "Deleting…" : "Delete"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 14 }}>
            <h4>Add new price</h4>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                placeholder="Waste type (e.g. Plastic)"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd", width: 220 }}
                disabled={saving}
              />
              <input
                placeholder="Price (Rs/kg)"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                style={{ padding: 8, borderRadius: 6, border: "1px solid #ddd", width: 140 }}
                disabled={saving}
                type="number"
                min="0"
                step="0.01"
              />
              <button onClick={() => save()} style={button} disabled={saving}>
                {saving ? "Adding…" : "Add"}
              </button>
              <button onClick={load} style={buttonAlt} disabled={saving}>
                Refresh
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #eee" };
const td: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #f5f5f5" };
const button: React.CSSProperties = { padding: "8px 12px", borderRadius: 6, background: "#0b6efd", color: "#fff", border: "none" };
const buttonAlt: React.CSSProperties = { padding: "8px 12px", borderRadius: 6, background: "#f1f1f1", border: "none" };
const smallBtn: React.CSSProperties = { padding: "6px 8px", borderRadius: 6, border: "none", background: "#2c3e50", color: "#fff" };
const smallBtnAlt: React.CSSProperties = { padding: "6px 8px", borderRadius: 6, border: "none", background: "#f1f1f1" };
const smallBtnDanger: React.CSSProperties = { padding: "6px 8px", borderRadius: 6, border: "none", background: "#c0392b", color: "#fff" };