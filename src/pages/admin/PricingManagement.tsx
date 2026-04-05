// src/pages/admin/PricingManagement.tsx
import React, { useEffect, useMemo, useState, type JSX } from "react";
import api from "../../api";
import type { AxiosResponse } from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import "./PricingManagement.css";

type PriceItem    = { _id?: string; wasteType: string; pricePerKg: number; };
type WasteCategory = { key?: string; name: string; };

export default function PricingManagement(): JSX.Element {
  const [pricing,        setPricing]        = useState<PriceItem[]>([]);
  const [categories,     setCategories]     = useState<WasteCategory[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [editingIdOrKey, setEditingIdOrKey] = useState<string | null>(null);
  const [editingValues,  setEditingValues]  = useState<Record<string, string>>({});
  const [saving,         setSaving]         = useState(false);
  const [deletingIds,    setDeletingIds]    = useState<Record<string, boolean>>({});
  const [q,              setQ]              = useState("");
  const [onlyUnpriced,   setOnlyUnpriced]   = useState(false);
  const [newType,        setNewType]        = useState("");
  const [newPrice,       setNewPrice]       = useState("");

  const SAMPLE_TYPES = ["Plastic","Glass","Paper","Metal","Organic","E-waste","Textile"];

  async function tryGetCandidates(candidates: string[]) {
    for (const p of candidates) {
      if (!p) continue;
      try { const res = await api.get(p); return { path: p, res }; } catch {}
    }
    return null;
  }

  async function load() {
    setLoading(true); setError(null);
    try {
      const pricingRes: AxiosResponse<any> | null = await api.get("/pricing").catch(() => null);
      const wasteAttempt = await tryGetCandidates(["/waste/categories","/waste/types","/waste/list","/waste","/wasteCategories"]);

      const pricingData: PriceItem[] = pricingRes?.data
        ? Array.isArray(pricingRes.data) ? pricingRes.data : pricingRes.data.data ?? []
        : [];

      let categoriesData: WasteCategory[] = [];
      if (wasteAttempt?.res?.data) {
        const raw = wasteAttempt.res.data;
        if (Array.isArray(raw)) {
          categoriesData = typeof raw[0] === "string"
            ? (raw as string[]).map((s) => ({ name: String(s) }))
            : (raw as any[]).map((r) => ({ key: r._id??r.id??r.key, name: String(r.name??r.wasteType??r.type??r.label??JSON.stringify(r)) }));
        } else if (raw && typeof raw === "object") {
          const list = raw.data??raw.items??raw.categories??[];
          if (Array.isArray(list))
            categoriesData = list.map((r: any) => ({ key: r._id??r.id??r.key, name: String(r.name??r.wasteType??r.type??JSON.stringify(r)) }));
        }
      }

      if (!categoriesData.length) {
        const fromPricing = Array.from(new Set(pricingData.map((p) => (p.wasteType||"").trim()).filter(Boolean)));
        categoriesData = fromPricing.length ? fromPricing.map((n) => ({ name: n })) : SAMPLE_TYPES.map((n) => ({ name: n }));
      }

      const norm: Record<string, WasteCategory> = {};
      categoriesData.forEach((c) => { const k = c.name.trim(); if (!k) return; const lk = k.toLowerCase(); if (!norm[lk]) norm[lk] = { key: c.key, name: k }; });
      pricingData.forEach((p) => { const n = (p.wasteType||"").trim(); if (!n) return; const lk = n.toLowerCase(); if (!norm[lk]) norm[lk] = { name: n }; });
      const merged = Object.values(norm).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

      setPricing(pricingData);
      setCategories(merged);

      const seed: Record<string, string> = {};
      pricingData.forEach((p) => {
        if (p._id) seed[p._id] = String(p.pricePerKg);
        seed[p.wasteType.trim().toLowerCase()] = String(p.pricePerKg);
      });
      setEditingValues(seed);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load pricing or categories");
      setPricing([]); setCategories([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function findPricingByWaste(wasteName: string) {
    const wn = wasteName.trim().toLowerCase();
    return pricing.find((p) => (p.wasteType||"").trim().toLowerCase() === wn);
  }

  function setEditingValue(key: string, v: string) {
    setEditingValues((s) => ({ ...s, [key]: v }));
  }

  async function saveForCategory(categoryName: string) {
    const existing = findPricingByWaste(categoryName);
    const key = existing?._id ?? categoryName.trim().toLowerCase();
    const raw = editingValues[key] ?? editingValues[categoryName.trim().toLowerCase()] ?? "";
    const num = Number(raw);
    if (raw === "" || Number.isNaN(num) || num < 0) { alert("Enter a valid non-negative price"); return; }
    setSaving(true);
    try {
      if (existing && existing._id) {
        await api.patch(`/pricing/${existing._id}`, { pricePerKg: num });
        setPricing((prev) => prev.map((p) => p._id === existing._id ? { ...p, pricePerKg: num } : p));
      } else {
        const res = await api.post("/pricing", { wasteType: categoryName.trim(), pricePerKg: num });
        const created: PriceItem | null = res?.data ?? null;
        if (created?._id) {
          setPricing((prev) => [created, ...prev]);
          setEditingValues((s) => ({ ...s, [created._id!]: String(created.pricePerKg), [categoryName.trim().toLowerCase()]: String(created.pricePerKg) }));
        } else { await load(); }
      }
      setEditingIdOrKey(null);
    } catch (err: any) { alert(err?.response?.data?.message || "Failed to save pricing"); }
    finally { setSaving(false); }
  }

  async function deletePricingById(id: string) {
    if (!confirm("Delete this pricing entry?")) return;
    setDeletingIds((s) => ({ ...s, [id]: true }));
    try {
      await api.delete(`/pricing/${id}`);
      setPricing((s) => s.filter((p) => p._id !== id));
      setEditingValues((s) => { const c = { ...s }; delete c[id]; return c; });
    } catch (err: any) { alert(err?.response?.data?.message || "Failed to delete"); }
    finally { setDeletingIds((s) => { const c = { ...s }; delete c[id]; return c; }); }
  }

  const rows = useMemo(() => {
    return categories
      .map((c) => ({ category: c, price: findPricingByWaste(c.name) }))
      .filter(({ category, price }) => {
        if (q) {
          const s = q.toLowerCase();
          if (!category.name.toLowerCase().includes(s) && !(price?.wasteType??"").toLowerCase().includes(s)) return false;
        }
        if (onlyUnpriced && price) return false;
        return true;
      });
  }, [categories, pricing, q, onlyUnpriced]);

  async function addNewType(typeName: string, priceValue: string) {
    const type = typeName.trim();
    const num  = Number(priceValue);
    if (!type) return alert("Provide a waste type name");
    if (priceValue === "" || Number.isNaN(num) || num < 0) return alert("Enter a valid non-negative price");
    setSaving(true);
    try {
      const res = await api.post("/pricing", { wasteType: type, pricePerKg: num });
      const created: PriceItem | null = res?.data ?? null;
      if (created?._id) {
        setPricing((prev) => [created, ...prev]);
        setCategories((prev) => {
          const lk = type.toLowerCase();
          if (prev.some((c) => c.name.toLowerCase() === lk)) return prev;
          return [...prev, { name: type }].sort((a, b) => a.name.localeCompare(b.name));
        });
        setEditingValues((s) => ({ ...s, [created._id!]: String(created.pricePerKg), [type.toLowerCase()]: String(created.pricePerKg) }));
        setNewType(""); setNewPrice("");
      } else { await load(); }
    } catch (err: any) { alert(err?.response?.data?.message || "Failed to add pricing"); }
    finally { setSaving(false); }
  }

  return (
    <div className="admin-page" style={{ display: "flex", minHeight: "100vh", background: "var(--bg, #fff)" }}>
      <AdminSidebar />

      <main className="admin-main" style={{ flex: 1 }}>
        <div className="pm-page">

          {/* ── Header ── */}
          <div className="pm-header">
            <h2 className="pm-title">Pricing Management</h2>
            <p className="pm-sub">All waste categories are listed below. Set or update price per kg for each type.</p>
          </div>

          {/* ── Toolbar ── */}
          <div className="pm-toolbar">
            <input
              className="pm-search"
              placeholder="Search waste type…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search waste types"
            />

            <label className="pm-toggle">
              <input type="checkbox" checked={onlyUnpriced} onChange={(e) => setOnlyUnpriced(e.target.checked)} />
              Unpriced only
            </label>

            <div className="pm-toolbar__right">
              <span className="pm-count">{rows.length} types</span>
              <button className="pm-btn pm-btn--lg" onClick={load} disabled={loading}>
                ↻ Refresh
              </button>
            </div>
          </div>

          {/* ── States ── */}
          {loading && <div className="pm-loading">Loading pricing…</div>}
          {error   && <div className="pm-error">⚠ {error}</div>}

          {!loading && !error && (
            <>
              {/* ── Table ── */}
              <div className="pm-table-card">
                <table className="pm-table">
                  <thead>
                    <tr>
                      <th>Waste type</th>
                      <th>Price / kg (Rs)</th>
                      <th>Source</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr className="pm-empty"><td colSpan={4}>No waste types found.</td></tr>
                    ) : rows.map(({ category, price }) => {
                      const key     = price?._id ?? category.name.trim().toLowerCase();
                      const editing = editingIdOrKey === key;
                      const value   = editingValues[key] ?? (price ? String(price.pricePerKg) : "");
                      const isBusy  = Boolean(deletingIds[price?._id ?? ""]);

                      return (
                        <tr
                          key={key}
                          className={[editing ? "pm-row--editing" : "", isBusy ? "pm-row--busy" : ""].filter(Boolean).join(" ")}
                        >
                          <td>
                            <span className="pm-type-chip">{category.name}</span>
                          </td>

                          <td>
                            {editing ? (
                              <input
                                type="number"
                                className="pm-edit-input"
                                value={value}
                                onChange={(e) => setEditingValue(key, e.target.value)}
                                min="0" step="0.01"
                                disabled={saving}
                                autoFocus
                                aria-label="Edit price"
                              />
                            ) : price ? (
                              <span className="pm-price">Rs {price.pricePerKg}</span>
                            ) : (
                              <span className="pm-unset">Not set</span>
                            )}
                          </td>

                          <td>
                            {price
                              ? <span className="pm-source pm-source--entry">Pricing entry</span>
                              : <span className="pm-source pm-source--category">Category only</span>
                            }
                          </td>

                          <td>
                            <div className="pm-actions">
                              {editing ? (
                                <>
                                  <button className="pm-btn pm-btn--save" onClick={() => saveForCategory(category.name)} disabled={saving}>
                                    {saving ? "Saving…" : "Save"}
                                  </button>
                                  <button className="pm-btn" onClick={() => setEditingIdOrKey(null)} disabled={saving}>
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className={`pm-btn ${price ? "" : "pm-btn--add-price"}`}
                                    onClick={() => { setEditingIdOrKey(key); setEditingValues((s) => ({ ...s, [key]: value })); }}
                                  >
                                    {price ? "Edit" : "+ Add price"}
                                  </button>
                                  {price && (
                                    <button
                                      className="pm-btn pm-btn--danger"
                                      onClick={() => deletePricingById(price._id!)}
                                      disabled={isBusy}
                                    >
                                      {isBusy ? "Deleting…" : "Delete"}
                                    </button>
                                  )}
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

              {/* ── Add new ── */}
              <div className="pm-add-card">
                <div className="pm-add-title">Add new waste type &amp; price</div>
                <div className="pm-add-row">
                  <input
                    className="pm-add-input pm-add-input--type"
                    placeholder="Waste type (e.g. Plastic)"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    disabled={saving}
                    aria-label="New waste type"
                  />
                  <input
                    className="pm-add-input pm-add-input--price"
                    placeholder="Price (Rs / kg)"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    type="number" min="0" step="0.01"
                    disabled={saving}
                    aria-label="New price per kg"
                  />
                  <button
                    className="pm-btn pm-btn--lg pm-btn--primary"
                    onClick={() => addNewType(newType, newPrice)}
                    disabled={saving}
                  >
                    {saving ? "Adding…" : "+ Add"}
                  </button>

                  <div className="pm-add-divider" />

                  <button
                    className="pm-btn pm-btn--lg"
                    onClick={load}
                    disabled={saving || loading}
                  >
                    ↻ Refresh
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}