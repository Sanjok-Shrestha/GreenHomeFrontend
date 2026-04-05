// src/pages/admin/AdminAssignPickups.tsx
import React, { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import AdminSidebar from "../../components/AdminSidebar";
import "./AdminAssignPickups.css";

type UserRef     = { _id?: string; name?: string; phone?: string; address?: string; email?: string };
type Pickup      = { _id: string; user?: UserRef; wasteType?: string; quantity?: number; status?: string; image?: string | null; createdAt?: string; location?: string };
type Collector   = { _id: string; name?: string; email?: string };
type CollectorRaw= { _id?: string; id?: string; userId?: string; collectorId?: string; name?: string; fullName?: string; displayName?: string; username?: string; email?: string; contactEmail?: string; userEmail?: string; role?: string; tags?: string[] };

export default function AdminAssignPickups(): JSX.Element {
  const navigate = useNavigate();

  const [items,              setItems]              = useState<Pickup[]>([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState<string | null>(null);
  const [toast,              setToast]              = useState<{ text: string; kind?: "success"|"danger" } | null>(null);
  const [openAssignFor,      setOpenAssignFor]      = useState<string | null>(null);
  const [collectors,         setCollectors]         = useState<Collector[]>([]);
  const [loadingCollectors,  setLoadingCollectors]  = useState(false);
  const [collectorsError,    setCollectorsError]    = useState<string | null>(null);
  const [selectedCollector,  setSelectedCollector]  = useState<string | null>(null);
  const [assigning,          setAssigning]          = useState(false);
  const [query,              setQuery]              = useState("");
  const [typeFilter,         setTypeFilter]         = useState("");

  const showToast = (text: string, kind: "success"|"danger" = "success") => {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 3000);
  };

  const loadUnassigned = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await api.get("/waste/available?limit=50");
      const raw  = res?.data;
      const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.items) ? raw.items : [];
      setItems(arr.map((p: any) => ({
        _id:       p._id ?? p.id,
        user:      p.user ?? p.requester ?? undefined,
        wasteType: p.wasteType ?? p.type ?? "Unknown",
        quantity:  p.quantity ?? 0,
        status:    p.status ?? "pending",
        image:     p.image ?? p.imageUrl ?? null,
        createdAt: p.createdAt ?? p.created_at,
        location:  p.location ?? p.address ?? undefined,
      })));
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load unassigned pickups");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadUnassigned(); }, [loadUnassigned]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      if (typeFilter && (p.wasteType ?? "").toLowerCase() !== typeFilter.toLowerCase()) return false;
      if (!q) return true;
      return (p.user?.name ?? "").toLowerCase().includes(q)
          || (p.wasteType ?? "").toLowerCase().includes(q)
          || (p.location ?? "").toLowerCase().includes(q);
    });
  }, [items, query, typeFilter]);

  const normalize = (rawList: CollectorRaw[]): Collector[] =>
    (rawList ?? [])
      .map((c) => ({
        _id:   (c._id ?? c.id ?? c.userId ?? c.collectorId) as string,
        name:  c.name ?? c.fullName ?? c.displayName ?? c.username ?? c.email ?? "",
        email: c.email ?? c.contactEmail ?? c.userEmail ?? "",
      }))
      .filter((c) => !!c._id);

  function openAssignModal(pickupId: string) {
    setOpenAssignFor(pickupId);
    setSelectedCollector(null); setCollectors([]); setCollectorsError(null); setLoadingCollectors(true);
    (async () => {
      try {
        // 1) /users?role=collector
        try {
          const res = await api.get("/users", { params: { role: "collector", limit: 200 } });
          const raw = res?.data;
          const list: CollectorRaw[] = Array.isArray(raw) ? raw : raw?.data ?? raw?.users ?? raw?.results ?? [];
          if (list.length > 0) { setCollectors(normalize(list)); return; }
        } catch {}
        // 2) /admin/collectors
        try {
          const res = await api.get("/admin/collectors");
          const list: CollectorRaw[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
          if (list.length > 0) { setCollectors(normalize(list)); return; }
        } catch {}
        // 3) /collectors
        try {
          const res = await api.get("/collectors");
          const list: CollectorRaw[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
          if (list.length > 0) { setCollectors(normalize(list)); return; }
        } catch {}
        // 4) fallback: filter /users
        try {
          const res = await api.get("/users", { params: { limit: 500 } });
          const list: any[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
          const filtered = list.filter((u: any) => {
            const role = (u?.role ?? "").toLowerCase();
            return role === "collector" || (u?.tags ?? []).includes("collector");
          });
          if (filtered.length > 0) { setCollectors(normalize(filtered)); return; }
        } catch {}
        setCollectorsError("No collectors found. Check API endpoints or ensure collectors exist.");
      } catch (err: any) {
        setCollectorsError(err?.response?.data?.message || err?.message || "Failed to load collectors");
      } finally { setLoadingCollectors(false); }
    })();
  }

  function closeAssignModal() {
    setOpenAssignFor(null); setSelectedCollector(null);
    setCollectors([]); setCollectorsError(null);
  }

  async function submitAssign() {
    if (!openAssignFor || !selectedCollector) return;
    setAssigning(true);
    const prev = items;
    setItems((cur) => cur.filter((i) => i._id !== openAssignFor));
    try {
      const res = await api.post(`/waste/${openAssignFor}/assign`, { collectorId: selectedCollector });
      if (res?.data?.error) throw new Error(res.data.error);
      showToast("Assigned successfully", "success");
      closeAssignModal();
    } catch (err: any) {
      setItems(prev);
      showToast(err?.response?.data?.message || err?.message || "Assignment failed", "danger");
    } finally { setAssigning(false); }
  }

  const wasteTypes = useMemo(() => [...new Set(items.map((i) => i.wasteType).filter(Boolean))], [items]);

  return (
    <div className="aap-root">
      <AdminSidebar />

      <main className="aap-main">

        {/* ── Header ── */}
        <header className="aap-header">
          <div>
            <h1 className="aap-title">Admin — Assign Pickups</h1>
            <p className="aap-sub">View and assign unclaimed pickups to collectors</p>
          </div>
        </header>

        {/* ── Toolbar ── */}
        <div className="aap-toolbar">
          <input
            className="aap-search"
            placeholder="Search user, type, or address…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search pickups"
          />
          <select
            className="aap-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by waste type"
          >
            <option value="">All types</option>
            {wasteTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="aap-toolbar__right">
            <button className="aap-btn aap-btn--primary" onClick={loadUnassigned} disabled={loading}>
              {loading ? "Loading…" : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* ── States ── */}
        {loading && <div className="aap-loading">Loading unassigned pickups…</div>}
        {error   && <div className="aap-error">⚠ {error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="aap-empty">No unassigned pickups found.</div>
        )}

        {/* ── Pickup cards ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="aap-grid">
            {filtered.map((p) => (
              <div key={p._id} className="aap-card">
                <div className="aap-card__info">
                  <div className="aap-card__name">{p.user?.name ?? "Unknown"}</div>
                  <div className="aap-card__meta">
                    <span className="aap-card__type">{p.wasteType}</span>
                    <span className="aap-card__meta-dot" />
                    <span>{p.quantity ?? "—"} kg</span>
                    {p.createdAt && (
                      <>
                        <span className="aap-card__meta-dot" />
                        <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                  {(p.location ?? p.user?.address) && (
                    <div className="aap-card__location">
                      📍 {p.location ?? p.user?.address}
                    </div>
                  )}
                </div>

                <div className="aap-card__actions">
                  <button
                    className="aap-btn aap-btn--sm"
                    onClick={() => navigate(`/track/${p._id}`)}
                  >
                    Track ↗
                  </button>
                  <button
                    className="aap-btn aap-btn--primary aap-btn--sm"
                    onClick={() => openAssignModal(p._id)}
                  >
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Assign modal ── */}
        {openAssignFor && (
          <div className="aap-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeAssignModal(); }}>
            <div className="aap-modal" role="dialog" aria-modal="true" aria-labelledby="aap-modal-title">

              <div className="aap-modal__head">
                <span className="aap-modal__title" id="aap-modal-title">Assign Pickup</span>
                <button className="aap-modal__close" onClick={closeAssignModal} aria-label="Close">✕</button>
              </div>

              <div className="aap-modal__body">
                {loadingCollectors ? (
                  <div className="aap-modal__loading">Loading collectors…</div>
                ) : collectorsError ? (
                  <>
                    <div className="aap-modal__error">⚠ {collectorsError}</div>
                    <button className="aap-btn" onClick={() => openAssignModal(openAssignFor!)}>↻ Retry</button>
                  </>
                ) : collectors.length === 0 ? (
                  <>
                    <div className="aap-modal__error">No collectors found.</div>
                    <button className="aap-btn" onClick={() => openAssignModal(openAssignFor!)}>↻ Retry</button>
                  </>
                ) : (
                  <div className="aap-collector-list">
                    {collectors.map((c) => (
                      <label
                        key={c._id}
                        className={`aap-collector-option${selectedCollector === c._id ? " aap-collector-option--selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="collector"
                          value={c._id}
                          checked={selectedCollector === c._id}
                          onChange={() => setSelectedCollector(c._id)}
                        />
                        <div>
                          <div className="aap-collector-name">{c.name ?? c.email ?? "Collector"}</div>
                          {c.email && <div className="aap-collector-email">{c.email}</div>}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {!loadingCollectors && !collectorsError && collectors.length > 0 && (
                <div className="aap-modal__foot">
                  <button className="aap-btn" onClick={closeAssignModal} disabled={assigning}>Cancel</button>
                  <button
                    className="aap-btn aap-btn--primary"
                    onClick={submitAssign}
                    disabled={!selectedCollector || assigning}
                  >
                    {assigning ? "Assigning…" : "Assign"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Toast ── */}
        {toast && (
          <div className="aap-toast" role="status" aria-live="polite">
            <div className={`aap-toast__inner aap-toast__inner--${toast.kind ?? "success"}`}>
              {toast.text}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}