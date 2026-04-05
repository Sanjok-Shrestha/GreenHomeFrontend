import React, { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import api from "../api";
import CollectorSidebar from "../components/CollectorSidebar";

/* ─────────────────────────── Styles ─────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --bg:           #f2f5f3;
    --surface:      #ffffff;
    --surface-2:    #f7faf8;
    --border:       #e2e8e4;
    --border-2:     #c9d5cc;
    --green:        #18a349;
    --green-hover:  #138038;
    --green-soft:   #e8f5ed;
    --green-glow:   rgba(24,163,73,.18);
    --blue:         #2563eb;
    --blue-soft:    #eff6ff;
    --text-1:       #0c1f13;
    --text-2:       #445c4e;
    --text-3:       #8aaa94;
    --danger:       #dc2626;
    --danger-soft:  #fef2f2;
    --mono:         'JetBrains Mono', monospace;
    --font:         'Outfit', system-ui, sans-serif;
    --ease:         cubic-bezier(.4,0,.2,1);
    --ease-spring:  cubic-bezier(.34,1.26,.64,1);
    --r-sm:         8px;
    --r-md:         12px;
    --r-lg:         16px;
    --r-xl:         20px;
    --sh-sm:        0 1px 4px rgba(0,0,0,.05),0 1px 2px rgba(0,0,0,.04);
    --sh-md:        0 6px 20px rgba(0,0,0,.07),0 2px 6px rgba(0,0,0,.04);
    --sh-lg:        0 20px 48px rgba(0,0,0,.10),0 6px 16px rgba(0,0,0,.05);
  }

  /* ── Root ── */
  .ap-root {
    display: flex;
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--font);
    color: var(--text-1);
    -webkit-font-smoothing: antialiased;
  }

  /* ── Main ── */
  .ap-main {
    flex: 1;
    padding: 32px 28px 56px;
    min-width: 0;
  }

  .ap-inner {
    max-width: 1100px;
    margin: 0 auto;
    animation: ap-in 280ms var(--ease) both;
  }

  @keyframes ap-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Header ── */
  .ap-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .ap-title {
    margin: 0 0 4px;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.4px;
    color: var(--text-1);
  }

  .ap-sub {
    font-size: 13.5px;
    color: var(--text-2);
  }

  .ap-header__right {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  /* ── Count badge ── */
  .ap-count {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 999px;
    background: var(--green-soft);
    border: 1px solid rgba(24,163,73,.2);
    font-size: 12.5px;
    font-weight: 700;
    color: var(--green);
    font-family: var(--mono);
  }

  /* ── Buttons ── */
  .ap-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 15px;
    border-radius: var(--r-md);
    border: 1.5px solid var(--border);
    background: var(--surface);
    color: var(--text-1);
    font-family: var(--font);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 130ms var(--ease), background 130ms, transform 130ms var(--ease), box-shadow 130ms;
    outline: none;
    white-space: nowrap;
    text-decoration: none;
  }

  .ap-btn:hover:not(:disabled) {
    border-color: var(--border-2);
    background: var(--surface-2);
    transform: translateY(-1px);
    box-shadow: var(--sh-sm);
  }

  .ap-btn:active:not(:disabled) { transform: translateY(0); }
  .ap-btn:disabled { opacity: .45; cursor: not-allowed; }

  .ap-btn--primary {
    background: var(--green);
    border-color: var(--green);
    color: #fff;
  }

  .ap-btn--primary:hover:not(:disabled) {
    background: var(--green-hover);
    border-color: var(--green-hover);
    box-shadow: 0 4px 14px var(--green-glow);
  }

  .ap-btn--call {
    background: var(--blue-soft);
    border-color: #bfdbfe;
    color: var(--blue);
  }

  .ap-btn--call:hover:not(:disabled) {
    background: #dbeafe;
    border-color: #93c5fd;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(37,99,235,.12);
  }

  .ap-btn--sm { padding: 5px 11px; font-size: 12px; border-radius: var(--r-sm); }

  /* ── Card grid ── */
  .ap-grid {
    display: grid;
    gap: 10px;
  }

  /* ── Pickup card ── */
  .ap-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 16px 18px;
    box-shadow: var(--sh-sm);
    transition: border-color 150ms, box-shadow 150ms, transform 150ms var(--ease);
    animation: ap-card-in 320ms var(--ease-spring) both;
  }

  .ap-card:hover {
    border-color: var(--border-2);
    box-shadow: var(--sh-md);
    transform: translateY(-1px);
  }

  @keyframes ap-card-in {
    from { opacity: 0; transform: translateY(10px) scale(.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .ap-card__row {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  .ap-card__left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    min-width: 0;
  }

  /* ── Waste icon chip ── */
  .ap-waste-icon {
    width: 46px;
    height: 46px;
    border-radius: var(--r-md);
    background: var(--green-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
    border: 1px solid rgba(24,163,73,.15);
  }

  .ap-card__meta { flex: 1; min-width: 0; }

  .ap-card__type {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.1px;
    color: var(--text-1);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ap-card__details {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .ap-card__pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-2);
    font-family: var(--mono);
  }

  .ap-card__pill--sep::before {
    content: '·';
    color: var(--text-3);
    margin-right: 2px;
  }

  .ap-card__actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  /* ── Status badge ── */
  .ap-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: .2px;
    text-transform: capitalize;
    background: var(--green-soft);
    color: var(--green);
    border: 1px solid rgba(24,163,73,.18);
    white-space: nowrap;
  }

  /* ── Load more ── */
  .ap-loadmore {
    margin-top: 16px;
    display: flex;
    justify-content: center;
  }

  /* ── Empty state ── */
  .ap-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 72px 20px;
    text-align: center;
    gap: 12px;
  }

  .ap-empty__icon {
    font-size: 48px;
    line-height: 1;
    opacity: .5;
  }

  .ap-empty__title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-2);
  }

  .ap-empty__sub {
    font-size: 13.5px;
    color: var(--text-3);
  }

  /* ── Error state ── */
  .ap-error {
    background: var(--danger-soft);
    border: 1px solid #fecaca;
    border-radius: var(--r-lg);
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ap-error__msg {
    font-size: 14px;
    font-weight: 600;
    color: var(--danger);
  }

  .ap-error__code {
    font-size: 12px;
    color: var(--text-3);
    font-family: var(--mono);
  }

  .ap-error__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .ap-error__raw {
    margin-top: 4px;
    max-height: 200px;
    overflow: auto;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: 12px;
    font-family: var(--mono);
    font-size: 11.5px;
    color: var(--text-2);
    line-height: 1.6;
  }

  /* ── Skeleton ── */
  .ap-skeleton {
    background: linear-gradient(90deg, #eaeeed 0%, #f5f8f6 50%, #eaeeed 100%);
    background-size: 200% 100%;
    animation: ap-shimmer 1.3s ease infinite;
    border-radius: var(--r-md);
  }

  @keyframes ap-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }

  .ap-skeleton-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 16px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
`;

/* ─────────────────────────── Helpers ─────────────────────────── */
function wasteEmoji(type?: string): string {
  const t = (type ?? "").toLowerCase();
  if (t.includes("plastic"))   return "♻️";
  if (t.includes("paper"))     return "📄";
  if (t.includes("metal"))     return "🔩";
  if (t.includes("glass"))     return "🫙";
  if (t.includes("organic") || t.includes("food")) return "🌿";
  if (t.includes("e-waste") || t.includes("electronic")) return "💻";
  return "🗑️";
}

/* ─────────────────────────── Types ─────────────────────────── */
type UserRef = { _id?: string; name?: string; phone?: string; address?: string; email?: string };
type Pickup = {
  _id: string; user?: UserRef; wasteType?: string; quantity?: number;
  status?: string; image?: string | null; createdAt?: string; location?: string;
  [k: string]: any;
};

const PAGE_SIZE       = 12;
const DEV_FORCE_SAMPLE = false;

/* ─────────────────────────── Component ─────────────────────────── */
export default function AvailablePickups(): JSX.Element {
  const [items,        setItems]        = useState<Pickup[]>([]);
  const [loading,      setLoading]      = useState<boolean>(true);
  const [error,        setError]        = useState<string | null>(null);
  const [statusCode,   setStatusCode]   = useState<number | null>(null);
  const [rawResponse,  setRawResponse]  = useState<any>(null);
  const [showRaw,      setShowRaw]      = useState(false);
  const [assigningIds, setAssigningIds] = useState<Record<string, boolean>>({});
  const [page,         setPage]         = useState(1);

  const parseResponseToArray = (raw: any): any[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.result)) return raw.result;
    if (raw.data && Array.isArray(raw.data.items)) return raw.data.items;
    return [];
  };

  const fetchAvailable = useCallback(async () => {
    setLoading(true); setError(null); setStatusCode(null); setRawResponse(null);
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    try {
      const res = await api.get("/api/waste/available?limit=100", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setStatusCode(res?.status ?? null);
      setRawResponse(res?.data ?? null);
      const arr = parseResponseToArray(res?.data);
      const mapped: Pickup[] = arr.map((p: any) => ({
        _id: p._id ?? p.id ?? String(Math.random()).slice(2),
        user: p.user ?? p.requester ?? undefined,
        wasteType: p.wasteType ?? p.type ?? "Unknown",
        quantity: p.quantity ?? 0,
        status: p.status ?? "pending",
        image: p.image ?? p.imageUrl ?? null,
        createdAt: p.createdAt ?? p.created_at,
        location: p.location,
        ...p,
      }));
      setItems(mapped);
      if (!mapped.length && DEV_FORCE_SAMPLE) {
        setItems([{ _id: "sample-1", user: { name: "Debug User", phone: "000" }, wasteType: "Plastic", quantity: 4, status: "pending", createdAt: new Date().toISOString() }]);
      }
    } catch (err: any) {
      const resp = err?.response;
      if (resp) {
        setStatusCode(resp.status);
        setRawResponse(resp.data ?? resp);
        setError(resp.data?.message || `Server returned ${resp.status}`);
      } else if (err?.request) {
        setError("No response from server. Is the backend running? (network/CORS issue?)");
      } else {
        setError(err?.message || "Failed to load available pickups");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailable();
    const id = setInterval(fetchAvailable, 30_000);
    return () => clearInterval(id);
  }, [fetchAvailable]);

  const setAssigning = (id: string, v: boolean) =>
    setAssigningIds((s) => { const c = { ...s }; if (v) c[id] = true; else delete c[id]; return c; });

  const claimPickup = async (id: string) => {
    if (!window.confirm("Assign this pickup to yourself?")) return;
    setAssigning(id, true);
    const prev = items;
    setItems((cur) => cur.filter((x) => x._id !== id));
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    try {
      const res = await api.post(`/api/waste/${id}/assign`, null, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res?.data?.error) throw new Error(res.data.error || "Assign failed");
      await fetchAvailable();
      alert("Pickup assigned to you. Check Assigned Pickups.");
    } catch (err: any) {
      setItems(prev);
      setError(err?.response?.data?.message || err?.message || "Failed to assign pickup");
      setTimeout(() => setError(null), 4000);
    } finally {
      setAssigning(id, false);
    }
  };

  const visible = useMemo(() => items.slice(0, page * PAGE_SIZE), [items, page]);

  /* ── Skeleton cards ── */
  const Skeletons = () => (
    <div className="ap-grid">
      {[0,1,2,3,4].map((i) => (
        <div key={i} className="ap-skeleton-card" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="ap-skeleton" style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 12 }} />
          <div style={{ flex: 1 }}>
            <div className="ap-skeleton" style={{ height: 13, marginBottom: 8, width: "45%" }} />
            <div className="ap-skeleton" style={{ height: 11, width: "70%" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div className="ap-skeleton" style={{ width: 76, height: 32, borderRadius: 8 }} />
            <div className="ap-skeleton" style={{ width: 96, height: 32, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="ap-root">
        <CollectorSidebar />

        <main className="ap-main">
          <div className="ap-inner">

            {/* ── Header ── */}
            <div className="ap-header">
              <div>
                <h2 className="ap-title">Available Pickups</h2>
                <p className="ap-sub">Unassigned pickup requests — claim one to get started</p>
              </div>
              <div className="ap-header__right">
                {!loading && !error && items.length > 0 && (
                  <span className="ap-count">{items.length} available</span>
                )}
                <button className="ap-btn" onClick={fetchAvailable} disabled={loading}>
                  {loading ? "Refreshing…" : "↻ Refresh"}
                </button>
              </div>
            </div>

            {/* ── Loading ── */}
            {loading && <Skeletons />}

            {/* ── Error ── */}
            {!loading && error && (
              <div className="ap-error">
                <div className="ap-error__msg">⚠ {error}</div>
                {statusCode && <div className="ap-error__code">HTTP {statusCode}</div>}
                <div className="ap-error__actions">
                  <button className="ap-btn ap-btn--primary" onClick={fetchAvailable}>Retry</button>
                  <button className="ap-btn" onClick={() => {
                    const base = (window as any).__API_BASE__ || "";
                    window.open(`${base}/api/waste/available?limit=6`, "_blank");
                  }}>Open endpoint ↗</button>
                  <button className="ap-btn" onClick={() => setShowRaw((s) => !s)}>
                    {showRaw ? "Hide response" : "Show response"}
                  </button>
                </div>
                {showRaw && (
                  <pre className="ap-error__raw">
                    {JSON.stringify(rawResponse ?? "no response", null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* ── Empty ── */}
            {!loading && !error && items.length === 0 && (
              <div className="ap-empty">
                <div className="ap-empty__icon">📭</div>
                <div className="ap-empty__title">No pickups available right now</div>
                <div className="ap-empty__sub">New requests will appear here automatically</div>
                <button className="ap-btn ap-btn--primary" onClick={fetchAvailable} style={{ marginTop: 4 }}>
                  Refresh
                </button>
              </div>
            )}

            {/* ── Cards ── */}
            {!loading && !error && visible.length > 0 && (
              <>
                <div className="ap-grid">
                  {visible.map((p, idx) => (
                    <div key={p._id} className="ap-card" style={{ animationDelay: `${Math.min(idx * 40, 300)}ms` }}>
                      <div className="ap-card__row">
                        <div className="ap-card__left">
                          <div className="ap-waste-icon">{wasteEmoji(p.wasteType)}</div>

                          <div className="ap-card__meta">
                            <div className="ap-card__type">{p.wasteType ?? "Unknown"}</div>
                            <div className="ap-card__details">
                              <span className="ap-card__pill">{p.quantity ?? 0} kg</span>
                              <span className="ap-card__pill ap-card__pill--sep">
                                {p.user?.name ?? "User"}
                              </span>
                              {p.location && (
                                <span className="ap-card__pill ap-card__pill--sep">📍 {p.location}</span>
                              )}
                              {p.createdAt && (
                                <span className="ap-card__pill ap-card__pill--sep">
                                  {new Date(p.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="ap-card__actions">
                          <span className="ap-badge">{p.status ?? "pending"}</span>

                          <a
                            className="ap-btn ap-btn--call ap-btn--sm"
                            href={p.user?.phone ? `tel:${p.user.phone}` : "#"}
                            onClick={(e) => { if (!p.user?.phone) { e.preventDefault(); alert("No phone number available"); } }}
                          >
                            📞 Call
                          </a>

                          <button
                            className="ap-btn ap-btn--primary ap-btn--sm"
                            onClick={() => claimPickup(p._id)}
                            disabled={!!assigningIds[p._id]}
                          >
                            {assigningIds[p._id] ? "Assigning…" : "Assign to me"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {page * PAGE_SIZE < items.length && (
                  <div className="ap-loadmore">
                    <button className="ap-btn" onClick={() => setPage((s) => s + 1)}>
                      Load more ({items.length - page * PAGE_SIZE} remaining)
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </>
  );
}