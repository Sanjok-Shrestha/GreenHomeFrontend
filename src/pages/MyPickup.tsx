import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";

type Waste = {
  _id: string;
  wasteType?: string;
  quantity?: number;
  price?: number;
  status?: string;
  pickupDate?: string | null;
  imageUrl?: string;
  createdAt?: string;
  completedAt?: string | null;
  [k: string]: any;
};

/* ── Small inline SVG icons (no external deps) ── */
const IconStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  display: "inline-block",
  verticalAlign: "middle",
  marginRight: 8,
  flexShrink: 0,
};

const RefreshIcon: React.FC<{ spin?: boolean }> = ({ spin }) => (
  <svg
    style={{ ...IconStyle, transform: spin ? "rotate(90deg)" : undefined }}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M20 12a8 8 0 1 0-2.3 5.3" />
    <polyline points="20 12 20 6 14 6" />
  </svg>
);

const WarningIcon: React.FC = () => (
  <svg
    style={IconStyle}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#c0392b"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12" y2="17" />
  </svg>
);

/* ── New alternative icons ── */

/* Package / Box (for empty state) */
const PackageIcon: React.FC = () => (
  <svg
    style={{ ...IconStyle, width: 40, height: 40, marginRight: 0 }}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73L12 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L11 21.73a2 2 0 0 0 2 0l7-4.99A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="12" x2="12" y2="22" />
  </svg>
);

/* Truck icon (for thumbnail fallback) */
const TruckIcon: React.FC = () => (
  <svg
    style={{ ...IconStyle, width: 28, height: 28, marginRight: 0 }}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <path d="M16 8h5l2 4v5" />
    <circle cx="5.5" cy="19.5" r="1.5" />
    <circle cx="18.5" cy="19.5" r="1.5" />
  </svg>
);

/* Pin / location icon */
const PinIcon: React.FC = () => (
  <svg
    style={IconStyle}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M21 10c0 6-9 11-9 11S3 16 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

/* Calendar-alt icon (alternative to simple calendar) */
const CalendarAltIcon: React.FC = () => (
  <svg
    style={IconStyle}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <rect x="7" y="11" width="3" height="3" />
    <rect x="14" y="11" width="3" height="3" />
  </svg>
);

/* Link / chain icon for copy link button */
const LinkIcon: React.FC = () => (
  <svg
    style={IconStyle}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M10 13a5 5 0 0 0 7 0l1-1a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 11a5 5 0 0 0-7 0l-1 1a5 5 0 0 0 7 7l1-1" />
  </svg>
);

/* Trash / fallback icon (alternative) */
const BinIcon: React.FC = () => (
  <svg
    style={{ ...IconStyle, width: 20, height: 20 }}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

/* ── Component ── */
export default function MyPickups(): React.JSX.Element {
  const [items, setItems] = useState<Waste[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dateValue, setDateValue] = useState<string>("");

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/waste/my-posts");
      const data = res.data?.data ?? res.data ?? [];
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const startSchedule = (id: string, current?: string | null) => {
    setEditingId(id);
    if (current) {
      const d = new Date(current);
      const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDateValue(localISO);
    } else {
      setDateValue("");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDateValue("");
  };

  const saveSchedule = async (id: string) => {
    if (!dateValue) {
      alert("Please choose date/time");
      return;
    }
    try {
      await api.put(`/waste/schedule/${id}`, {
        pickupDate: new Date(dateValue).toISOString(),
      });
      await fetchItems();
      setEditingId(null);
      setDateValue("");
      showToast("Scheduled ✓");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to schedule");
      await fetchItems();
      setEditingId(null);
      setDateValue("");
    }
  };

  const showToast = (text: string, ttl = 1200) => {
    const n = document.createElement("div");
    n.textContent = text;
    Object.assign(n.style, {
      position: "fixed",
      right: "18px",
      bottom: "22px",
      background: "#1a6b45",
      color: "#fff",
      padding: "9px 14px",
      borderRadius: "9px",
      fontSize: "13px",
      fontWeight: "500",
      zIndex: "9999",
      boxShadow: "0 4px 16px rgba(26,107,69,0.25)",
    });
    document.body.appendChild(n);
    setTimeout(() => {
      try {
        document.body.removeChild(n);
      } catch {}
    }, ttl);
  };

  // Show pending + scheduled + picked
  // Hide only final/closed states
  const hiddenStatuses = new Set(["collected", "completed", "cancelled"]);
  const visible = items.filter((w) => {
    const s = (w.status ?? "").toString().trim().toLowerCase();
    return !hiddenStatuses.has(s);
  });

  return (
    <>
      <style>{css}</style>
      <div className="mp-root">
        <Sidebar />
        <main className="mp-main">
          <div className="mp-inner">
            {/* Header */}
            <div className="mp-header">
              <div>
                <h2 id="rc-user-title" className="mp-title">
                  Pickup Status
                </h2>
                <p className="mp-sub">
                  Manage your posted waste and schedule pickups
                </p>
              </div>
              <div className="mp-header__right">
                <Link to="/post-waste" className="mp-btn mp-btn--primary">
                  + Post waste
                </Link>
                <button
                  onClick={fetchItems}
                  className="mp-btn"
                  disabled={loading}
                  aria-label="Refresh pickups"
                >
                  {loading ? (
                    <>
                      <RefreshIcon spin />
                      Refreshing…
                    </>
                  ) : (
                    <>
                      <RefreshIcon />
                      Refresh
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="mp-list">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="mp-skeleton-card"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div
                      className="mp-skel"
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 10,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        className="mp-skel"
                        style={{ height: 13, width: "30%", marginBottom: 8 }}
                      />
                      <div
                        className="mp-skel"
                        style={{ height: 11, width: "50%", marginBottom: 8 }}
                      />
                      <div
                        className="mp-skel"
                        style={{
                          height: 28,
                          width: "60%",
                          borderRadius: 8,
                        }}
                      />
                    </div>
                    <div
                      className="mp-skel"
                      style={{ width: 52, height: 20, borderRadius: 6 }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="mp-error">
                <WarningIcon />
                <span style={{ flex: 1 }}>{error}</span>
                <button className="mp-btn mp-btn--primary" onClick={fetchItems}>
                  Retry
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && visible.length === 0 && (
              <div className="mp-empty">
                <div className="mp-empty__icon" aria-hidden>
                  <PackageIcon />
                </div>
                <div className="mp-empty__title">No pending pickups</div>
                <div className="mp-empty__sub">
                  Posts you've made will appear here until a collector picks them
                  up
                </div>
                <Link
                  to="/post-waste"
                  className="mp-btn mp-btn--primary"
                  style={{ marginTop: 8 }}
                >
                  + Post waste
                </Link>
              </div>
            )}

            {/* List */}
            {!loading && !error && visible.length > 0 && (
              <div className="mp-list" aria-label="My pickups">
                {visible.map((w, idx) => (
                  <div
                    key={w._id}
                    className="mp-card"
                    style={{ animationDelay: `${Math.min(idx * 35, 280)}ms` }}
                  >
                    {/* Thumbnail */}
                    <div className="mp-thumb">
                      {w.imageUrl ? (
                        <Thumbnail imageUrl={w.imageUrl} />
                      ) : (
                        <span className="mp-thumb__fallback" aria-hidden>
                          <TruckIcon />
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="mp-card__meta">
                      <div className="mp-card__type">
                        {(w.wasteType ?? "Unknown").toString()}
                      </div>
                      <div className="mp-card__details">
                        <span className="mp-pill">{w.quantity ?? "—"} kg</span>
                        <span className="mp-pill mp-pill--muted">
                          {w.createdAt
                            ? new Date(w.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </span>
                        <span
                          className={`mp-badge mp-badge--${(w.status ?? "pending")
                            .toLowerCase()
                            .trim()}`}
                        >
                          {w.status ?? "pending"}
                        </span>
                      </div>

                      {w.pickupDate && (
                        <div className="mp-scheduled">
                          <CalendarAltIcon />
                          <PinIcon />
                          <span>
                            Scheduled:{" "}
                            {new Date(w.pickupDate).toLocaleDateString(
                              undefined,
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mp-card__actions">
                        <Link to={`/track/${w._id}`} className="mp-action-btn">
                          View
                        </Link>

                        {editingId === w._id ? (
                          <>
                            <input
                              type="datetime-local"
                              value={dateValue}
                              onChange={(e) => setDateValue(e.target.value)}
                              className="mp-date-input"
                            />
                            <button
                              onClick={() => saveSchedule(w._id)}
                              className="mp-action-btn mp-action-btn--save"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="mp-action-btn"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                startSchedule(w._id, w.pickupDate ?? null)
                              }
                              className="mp-action-btn"
                            >
                              {w.pickupDate ? "Reschedule" : "Schedule"}
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard?.writeText(
                                  window.location.origin + `/track/${w._id}`
                                );
                                showToast("Link copied");
                              }}
                              className="mp-action-btn"
                            >
                              <LinkIcon />
                              Copy link
                            </button>
                            <Link
                              to="/post-waste"
                              className="mp-action-btn mp-action-btn--ghost"
                            >
                              Post similar
                            </Link>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mp-card__right">
                      <div className="mp-price">
                        Rs{" "}
                        {w.price != null
                          ? Number(w.price).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

/* ── Thumbnail ── */
function Thumbnail({ imageUrl }: { imageUrl?: string | null }) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;
    let mounted = true;
    let objectUrl: string | null = null;
    const apiBase = (api.defaults?.baseURL as string) || "";
    const raw = String(imageUrl).trim();
    const candidates: string[] = [];

    if (/^https?:\/\//i.test(raw)) {
      candidates.push(raw);
    } else {
      const path = raw.startsWith("/") ? raw : "/" + raw;
      if (apiBase) candidates.push(apiBase + path);
      candidates.push(path);
      const filename = path.split("/").pop() || "";
      if (filename) {
        candidates.push(`/uploads/${filename}`);
        candidates.push(`/uploads/images/${filename}`);
        candidates.push(`/${filename}`);
      }
    }

    const seen = new Set<string>();
    const uniq = candidates.filter((c) => {
      const k = c.replace(/\/+/g, "/");
      return seen.has(k) ? false : (seen.add(k), true);
    });

    async function tryCandidates() {
      for (const cand of uniq) {
        if (!mounted) return;
        try {
          if (/^https?:\/\//i.test(cand)) {
            let apiOrigin = window.location.origin;
            try {
              if (typeof api.defaults.baseURL === "string")
                apiOrigin = new URL(api.defaults.baseURL).origin;
            } catch {}
            const candUrl = new URL(cand);
            if (candUrl.origin === apiOrigin) {
              const resp = await api.get(
                candUrl.pathname + (candUrl.search || ""),
                { responseType: "blob" }
              );
              objectUrl = URL.createObjectURL(resp.data);
              if (mounted) {
                setSrc(objectUrl);
                return;
              }
            } else {
              if (mounted) {
                setSrc(cand);
                return;
              }
            }
          } else {
            const resp = await api.get(cand.startsWith("/") ? cand : "/" + cand, {
              responseType: "blob",
            });
            objectUrl = URL.createObjectURL(resp.data);
            if (mounted) {
              setSrc(objectUrl);
              return;
            }
          }
        } catch {
          continue;
        }
      }
      if (mounted) setErr(true);
    }

    tryCandidates();
    return () => {
      mounted = false;
      if (objectUrl)
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
    };
  }, [imageUrl]);

  if (err || !src)
    return (
      <span className="mp-thumb__fallback" aria-hidden>
        <BinIcon />
      </span>
    );
  return (
    <img
      src={src}
      alt="waste"
      className="mp-thumb__img"
      onError={() => setErr(true)}
    />
  );
}

/* ── CSS ── */
const css = `
  .mp-root {
    display: flex;
    min-height: 100vh;
    background: #f4faf6;
    font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }

  .mp-main {
    flex: 1;
    min-width: 0;
    padding: 32px 28px;
    box-sizing: border-box;
  }

  .mp-inner {
    max-width: 860px;
    margin: 0 auto;
  }

  /* ── Header ── */
  .mp-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .mp-title {
    font-size: 20px;
    font-weight: 500;
    color: #0f1f16;
    letter-spacing: -0.3px;
    margin: 0 0 4px;
  }

  .mp-sub {
    font-size: 13.5px;
    color: #6b7f73;
    margin: 0;
  }

  .mp-header__right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .mp-link {
    font-size: 13px;
    font-weight: 500;
    color: #1a6b45;
    text-decoration: none;
    padding: 4px 2px;
    transition: color 0.12s;
  }
  .mp-link:hover { color: #0f4a2e; }

  /* ── Buttons ── */
  .mp-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 14px;
    border-radius: 8px;
    border:  1px solid #dde8e2;
    background: #ffffff;
    color: #2a3d31;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
    text-decoration: none;
    transition: background 0.12s, border-color 0.12s;
    line-height: 1;
  }
  .mp-btn:hover:not(:disabled) { background: #f0f7f3; border-color: #c4d9cc; }
  .mp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .mp-btn--primary {
    background: #2c9e6a;
    border-color: #2c9e6a;
    color: #fff;
  }
  .mp-btn--primary:hover:not(:disabled) { background: #249060; border-color: #249060; }

  /* ── List ── */
  .mp-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* ── Card ── */
  .mp-card {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: #ffffff;
    border: 1px solid #dde8e2;
    border-radius: 12px;
    padding: 14px 16px;
    box-sizing: border-box;
    animation: mp-fade-in 0.22s ease both;
    transition: border-color 0.15s;
  }
  .mp-card:hover { border-color: #b8d4c4; }

  /* ── Thumbnail ── */
  .mp-thumb {
    width: 52px;
    height: 52px;
    border-radius: 10px;
    background: #f0f7f3;
    border: 1px solid #dde8e2;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    margin-top: 2px;
  }
  .mp-thumb__img {
    width: 100%; height: 100%;
    object-fit: cover; border-radius: 9px; display: block;
  }
  .mp-thumb__fallback { font-size: 20px; line-height: 1; display: inline-flex; align-items: center; justify-content: center; }

  /* ── Card meta ── */
  .mp-card__meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .mp-card__type {
    font-size: 14px;
    font-weight: 500;
    color: #0f1f16;
    text-transform: capitalize;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  .mp-card__details {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
  }

  /* ── Pills ── */
  .mp-pill {
    font-size: 11.5px;
    color: #4a6b56;
    background: #f0f7f3;
    border: 1px solid #dde8e2;
    border-radius: 20px;
    padding: 2px 8px;
    white-space: nowrap;
    line-height: 1.5;
  }
  .mp-pill--muted { background: #f5f8f6; color: #5a7364; }

  /* ── Badge ── */
  .mp-badge {
    font-size: 11px;
    font-weight: 500;
    text-transform: capitalize;
    letter-spacing: 0.3px;
    padding: 2px 9px;
    border-radius: 20px;
    white-space: nowrap;
    line-height: 1.5;
    border: 1px solid;
  }
  .mp-badge--pending  { background: #fef9ec; color: #92610a; border-color: #fde9a2; }
  .mp-badge--scheduled { background: #e6f4ec; color: #1a6b45; border-color: #c3e0d0; }

  /* ── Scheduled date ── */
  .mp-scheduled {
    font-size: 12px;
    color: #1a6b45;
    font-weight: 500;
    background: #f0f9f4;
    border: 1px solid #c3e0d0;
    border-radius: 7px;
    padding: 5px 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
  }

  /* ── Action row ── */
  .mp-card__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .mp-action-btn {
    padding: 5px 11px;
    border-radius: 7px;
    border: 1px solid #dde8e2;
    background: #f7fbf8;
    color: #2a3d31;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    transition: background 0.12s, border-color 0.12s;
  }
  .mp-action-btn:hover { background: #eaf4ef; border-color: #c4d9cc; color: #1a6b45; }

  .mp-action-btn--save {
    background: #2c9e6a;
    border-color: #2c9e6a;
    color: #fff;
  }
  .mp-action-btn--save:hover { background: #249060; border-color: #249060; color: #fff; }

  .mp-action-btn--ghost {
    background: transparent;
    border-style: dashed;
    color: #3d7a52;
  }
  .mp-action-btn--ghost:hover { background: #f0f7f3; border-style: solid; }

  /* ── Date input ── */
  .mp-date-input {
    padding: 5px 9px;
    border-radius: 7px;
    border: 1px solid #dde8e2;
    background: #f7fbf8;
    font-size: 12px;
    font-family: inherit;
    color: #111;
    outline: none;
    transition: border-color 0.14s, box-shadow 0.14s;
  }
  .mp-date-input:focus {
    border-color: #2c9e6a;
    box-shadow: 0 0 0 3px rgba(44,158,106,0.1);
  }

  /* ── Price ── */
  .mp-card__right {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding-top: 2px;
  }
  .mp-price {
    font-size: 14px;
    font-weight: 500;
    color: #0f1f16;
    white-space: nowrap;
  }

  /* ── Error ── */
  .mp-error {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff8f7;
    border: 1px solid #f5c4b3;
    border-radius: 12px;
    padding: 14px 18px;
    font-size: 13.5px;
    font-weight: 500;
    color: #712b13;
    flex-wrap: wrap;
  }

  /* ── Empty ── */
  .mp-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 64px 24px;
    gap: 8px;
    text-align: center;
  }
  .mp-empty__icon { margin-bottom: 4px; line-height: 1; display:flex; align-items:center; justify-content:center; width:48px; height:48px; }
  .mp-empty__title { font-size: 15px; font-weight: 500; color: #1a3326; }
  .mp-empty__sub { font-size: 13px; color: #6b7f73; }

  /* ── Skeleton ── */
  .mp-skeleton-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #ffffff;
    border: 1px solid #dde8e2;
    border-radius: 12px;
    padding: 14px 16px;
    animation: mp-fade-in 0.2s ease both;
  }
  .mp-skel {
    background: linear-gradient(90deg, #edf3ef 25%, #e0ece5 50%, #edf3ef 75%);
    background-size: 200% 100%;
    border-radius: 6px;
    animation: mp-shimmer 1.4s infinite;
    flex-shrink: 0;
  }

  /* ── Animations ── */
  @keyframes mp-fade-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mp-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Responsive ── */
  @media (max-width: 560px) {
    .mp-main { padding: 20px 16px; }
    .mp-card { flex-wrap: wrap; }
    .mp-card__right { width: 100%; flex-direction: row; justify-content: flex-end; }
    .mp-header { flex-direction: column; gap: 10px; }
    .mp-header__right { width: 100%; }
  }
`;