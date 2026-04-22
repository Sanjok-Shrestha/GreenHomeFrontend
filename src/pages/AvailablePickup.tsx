import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import api from "../api";
import CollectorSidebar from "../components/CollectorSidebar";
import "./AvailablePickup.css";

/* ─────────────────────────── Small inline SVG icons ─────────────────────────── */
const smallIconStyle: React.CSSProperties = { width: 16, height: 16, display: "inline-block", verticalAlign: "middle", marginRight: 8, flexShrink: 0 };

const RefreshIcon: React.FC<{ spin?: boolean }> = ({ spin }) => (
  <svg style={{ ...smallIconStyle, transform: spin ? "rotate(90deg)" : undefined }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 12a8 8 0 1 0-2.3 5.3" />
    <polyline points="20 12 20 6 14 6" />
  </svg>
);

const WarningIcon: React.FC = () => (
  <svg style={{ width: 18, height: 18, marginRight: 8 }} viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12" y2="17" />
  </svg>
);

const InboxIcon: React.FC = () => (
  <svg style={{ width: 36, height: 36, display: "block" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6" />
    <polyline points="7 10 12 15 17 10" />
    <path d="M22 7H2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
  </svg>
);

const PhoneIcon: React.FC = () => (
  <svg style={smallIconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 3.08 4.18 2 2 0 0 1 5 2h3a2 2 0 0 1 2 1.72c.12.9.37 1.77.73 2.6a2 2 0 0 1-.45 2.11L9.91 9.91a16 16 0 0 0 6 6l1.48-1.48a2 2 0 0 1 2.11-.45c.83.36 1.7.61 2.6.73A2 2 0 0 1 22 16.92z" />
  </svg>
);

const PinIcon: React.FC = () => (
  <svg style={smallIconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 10c0 6-9 11-9 11S3 16 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

/* Waste-type icons (replaces emoji) */
function wasteIcon(type?: string): React.ReactNode {
  const t = (type ?? "").toLowerCase();
  const baseProps = { width: 28, height: 28, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (t.includes("plastic")) {
    return (
      <svg {...baseProps} aria-hidden>
        <path d="M21 15v4h-4" />
        <path d="M3 9v-4h4" />
        <path d="M14 3l-2 4" />
        <path d="M10 21l2-4" />
      </svg>
    );
  }
  if (t.includes("paper")) {
    return (
      <svg {...baseProps} aria-hidden>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    );
  }
  if (t.includes("metal")) {
    return (
      <svg {...baseProps} aria-hidden>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    );
  }
  if (t.includes("glass")) {
    return (
      <svg {...baseProps} aria-hidden>
        <path d="M7 21h10" />
        <path d="M9 21V7a3 3 0 0 1 6 0v14" />
        <path d="M9 7h6" />
      </svg>
    );
  }
  if (t.includes("organic") || t.includes("food")) {
    return (
      <svg {...baseProps} aria-hidden>
        <path d="M21 7c0 7-9 13-9 13S3 13 3 6a9 9 0 0 1 18 1z" />
        <path d="M8.5 10.5c2.2-1.8 4.2-2.1 6.5-2.4" />
      </svg>
    );
  }
  if (t.includes("e-waste") || t.includes("electronic") || t.includes("laptop") || t.includes("phone")) {
    return (
      <svg {...baseProps} aria-hidden>
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <path d="M2 18h20" />
      </svg>
    );
  }
  // fallback
  return (
    <svg {...baseProps} aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

/* ─────────────────────────── Helpers ─────────────────────────── */
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

/* ─────────────────────────── Types ─────────────────────────── */
type UserRef = { _id?: string; name?: string; phone?: string; address?: string; email?: string };
type Pickup = {
  _id: string; user?: UserRef; wasteType?: string; quantity?: number;
  status?: string; image?: string | null; imageUrl?: string | null; createdAt?: string; location?: string;
  [k: string]: any;
};

const PAGE_SIZE = 12;
const DEV_FORCE_SAMPLE = false;

/* ─────────────────────────── Component ─────────────────────────── */
export default function AvailablePickups(): JSX.Element {
  const [items, setItems] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [assigningIds, setAssigningIds] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);

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
                <button className="ap-btn" onClick={fetchAvailable} disabled={loading} aria-label="Refresh available pickups">
                  <RefreshIcon spin={loading} />
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
              </div>
            </div>

            {/* ── Loading ── */}
            {loading && <Skeletons />}

            {/* ── Error ── */}
            {!loading && error && (
              <div className="ap-error" role="alert">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <WarningIcon />
                  <div className="ap-error__msg">{error}</div>
                </div>
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
              <div className="ap-empty" role="status">
                <div className="ap-empty__icon" aria-hidden>
                  <InboxIcon />
                </div>
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
                                  // if image fails, hide it so icon fallback shows
                                  (e.currentTarget as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="ap-waste-thumbnail__icon" aria-hidden>
                                {wasteIcon(p.wasteType)}
                              </div>
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
                                <span className="ap-card__pill ap-card__pill--sep" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                  <PinIcon />
                                  <span style={{ marginLeft: 0 }}>{p.location}</span>
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
                            aria-label={p.user?.phone ? `Call ${p.user?.name ?? "user"}` : "No phone"}
                          >
                            <PhoneIcon />
                            Call
                          </a>

                          <button
                            className="ap-btn ap-btn--primary ap-btn--sm"
                            onClick={() => claimPickup(p._id)}
                            disabled={!!assigningIds[p._id]}
                            aria-label={`Assign pickup ${p._id} to me`}
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