import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import api from "../api";
import CollectorSidebar from "../components/CollectorSidebar";
import "./AvailablePickup.css";

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
  status?: string; image?: string | null; imageUrl?: string | null; createdAt?: string; location?: string;
  [k: string]: any;
};

const PAGE_SIZE       = 12;
const DEV_FORCE_SAMPLE = false;

/* Helper to avoid double "/api" when axios baseURL already includes /api */
function apiPath(path: string) {
  if (!path) return path;
  if (!path.startsWith("/")) path = "/" + path;
  const base = (api.defaults && (api.defaults.baseURL as string)) || "";
  if (base.endsWith("/api") && path.startsWith("/api")) {
    return path.replace(/^\/api/, "");
  }
  return path;
}

/* Resolve media URLs — prefer api.defaults.baseURL when provided */
function resolveUrl(src?: string | null): string | null {
  if (!src) return null;
  const s = String(src).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^\/\//.test(s)) return window.location.protocol + s;
  const base = (api.defaults && (api.defaults.baseURL as string)) || "";
  if (base) {
    try {
      const b = base.endsWith("/") ? base.slice(0, -1) : base;
      if (s.startsWith("/")) return `${b}${s}`;
      return `${b}/${s}`;
    } catch {
      // fallback
    }
  }
  if (s.startsWith("/")) return window.location.origin + s;
  return window.location.origin + "/" + s;
}

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
      const res = await api.get(apiPath("/waste/available?limit=100"), {
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
        imageUrl: p.imageUrl ?? p.image ?? null,
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
      const res = await api.post(apiPath(`/waste/${id}/assign`), null, {
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
                    const base = (window as any).__API_BASE__ || ((api.defaults && (api.defaults.baseURL as string)) || "");
                    const baseClean = base ? base.replace(/\/$/, "") : "";
                    const openUrl = baseClean ? baseClean + apiPath("/waste/available?limit=6") : apiPath("/waste/available?limit=6");
                    window.open(openUrl, "_blank");
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
                          <div className="ap-waste-thumbnail" aria-hidden>
                            {p.image || p.imageUrl ? (
                              <img
                                src={resolveUrl(p.image ?? p.imageUrl) ?? (p.image ?? p.imageUrl ?? "")}
                                alt={p.wasteType ?? "waste"}
                                onError={(e) => {
                                  // if image fails, remove it to let emoji fallback show
                                  (e.currentTarget as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div style={{ fontSize: 20 }}>{wasteEmoji(p.wasteType)}</div>
                            )}
                          </div>

                          <div className="ap-card__meta">
                            <div className="ap-card__type">{p.wasteType ?? "Unknown"}</div>
                            <div className="ap-card__details">
                              <span className="ap-card__pill">{p.quantity ?? 0} kg</span>
                              <span className="ap-card__pill ap-card__pill--sep">
                                {p.user?.name ?? "User"}
                              </span>
                              {p.createdAt && (
                                <span className="ap-card__pill ap-card__pill--sep">
                                  {new Date(p.createdAt).toLocaleDateString()}
                                </span>
                              )}
                              {p.location && (
                                <span className="ap-card__pill ap-card__pill--sep">📍 {p.location}</span>
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