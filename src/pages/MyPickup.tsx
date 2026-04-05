import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  [k: string]: any;
};

export default function MyPickups(): React.JSX.Element {
  const navigate = useNavigate();
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
      const data = res.data?.data ?? res.data;
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load my pickups", err);
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
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
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
      await api.put(`/waste/schedule/${id}`, { pickupDate: dateValue });
      await fetchItems();
      setEditingId(null);
      setDateValue("");
      showToast("Scheduled");
    } catch (err: any) {
      console.error("Scheduling failed", err);
      alert(err?.response?.data?.message || "Failed to schedule");
      await fetchItems();
      setEditingId(null);
      setDateValue("");
    }
  };

  const showToast = (text: string, ttl = 900) => {
    const n = document.createElement("div");
    n.textContent = text;
    Object.assign(n.style, {
      position: "fixed",
      right: "12px",
      bottom: "12px",
      background: "#27ae60",
      color: "#fff",
      padding: "6px 10px",
      borderRadius: "6px",
      fontSize: "12px",
      zIndex: 9999,
    });
    document.body.appendChild(n);
    setTimeout(() => {
      try {
        document.body.removeChild(n);
      } catch {}
    }, ttl);
  };

  return (
    <div style={pageStyles.root}>
      <Sidebar />
      <main style={pageStyles.main}>
        <header style={pageStyles.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Pickups Status</h2>
            <div style={{ color: "#666", marginTop: 6, fontSize: 13 }}>
              Manage your posted waste and schedule pickups
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link to="/post-waste" style={pageStyles.postButton}>
              + Post waste
            </Link>
            <button onClick={() => fetchItems()} style={pageStyles.refreshButton}>
              Refresh
            </button>
          </div>
        </header>

        {loading ? (
          <div style={{ padding: 12, color: "#444" }}>Loading your pickups…</div>
        ) : error ? (
          <div style={{ padding: 12, color: "crimson" }}>Error: {error}</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 12 }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <p style={{ margin: 0, fontSize: 14 }}>
                No waste posts yet.{" "}
                <Link to="/post-waste" style={pageStyles.postInline}>
                  Post waste
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div style={{ padding: 12 }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((w) => (
                <div key={w._id} style={cardConstrained}>
                  <div style={{ width: 56, height: 44, flex: "0 0 56px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {w.imageUrl ? (
                      <Thumbnail imageUrl={w.imageUrl} size={{ w: 56, h: 44 }} />
                    ) : (
                      <div style={{ width: 56, height: 44, background: "#f1f1f1", borderRadius: 6 }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                          {(w.wasteType ?? "Unknown").toString().toUpperCase()}
                        </div>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                          {w.quantity ?? "—"} kg • {w.createdAt ? new Date(w.createdAt).toLocaleString() : "—"}
                        </div>
                      </div>

                      <div style={{ textAlign: "right", flex: "0 0 auto", marginLeft: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Rs {w.price ?? "—"}</div>
                        <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{w.status ?? "—"}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <Link to={`/track/${w._id}`} style={linkTiny}>
                        View
                      </Link>

                      {editingId === w._id ? (
                        <>
                          <input type="datetime-local" value={dateValue} onChange={(e) => setDateValue(e.target.value)} style={inputTiny} />
                          <button onClick={() => saveSchedule(w._id)} style={buttonTinyPrimary}>
                            Save
                          </button>
                          <button onClick={cancelEdit} style={buttonTiny}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startSchedule(w._id, w.pickupDate ?? null)} style={buttonTiny}>
                            Schedule
                          </button>

                          <button
                            onClick={() => {
                              const link = window.location.origin + `/track/${w._id}`;
                              navigator.clipboard?.writeText(link);
                              showToast("Copied");
                            }}
                            style={buttonTiny}
                          >
                            Copy
                          </button>

                          <Link to="/post-waste" style={buttonTinyLink}>
                            Post similar
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ------------------- Thumbnail (defensive, avoids duplicate prefixes) ------------------- */
function Thumbnail({ imageUrl, size = { w: 56, h: 44 } }: { imageUrl?: string | null; size?: { w: number; h: number } }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;
    let mounted = true;
    let objectUrl: string | null = null;

    // Get axios baseURL (likely "http://localhost:5000/api")
    const apiBase = (api.defaults && (api.defaults.baseURL as string)) || "";
    let apiBaseOrigin = "";
    let apiBasePath = "";
    try {
      if (apiBase && /^https?:\/\//i.test(apiBase)) {
        const u = new URL(apiBase);
        apiBaseOrigin = u.origin; // e.g. "http://localhost:5000"
        apiBasePath = u.pathname.replace(/\/+$/, ""); // e.g. "/api" or ""
      } else {
        apiBaseOrigin = window.location.origin;
        apiBasePath = apiBase ? apiBase.replace(/\/+$/, "") : "";
      }
    } catch {
      apiBaseOrigin = window.location.origin;
      apiBasePath = "";
    }

    const origin = window.location.origin;
    const raw = String(imageUrl).trim();

    // Build candidates (ordered, safe, no blind concatenation)
    const candidates: string[] = [];

    if (/^https?:\/\//i.test(raw)) {
      candidates.push(raw);
    } else {
      const path = raw.startsWith("/") ? raw : "/" + raw;
      if (apiBasePath && path.startsWith(apiBasePath)) {
        // path already contains the api prefix (e.g. "/api/uploads/...")
        candidates.push(path);
      } else {
        if (apiBase) candidates.push(apiBase + path); // absolute
        if (apiBase) candidates.push(apiBase.replace(/\/api$/, "") + path); // try host without /api
        candidates.push(path); // relative
      }

      // try common upload locations based on filename
      const parts = path.split("/");
      const filename = parts[parts.length - 1] || "";
      if (filename) {
        candidates.push(`/uploads/${filename}`);
        candidates.push(`/uploads/images/${filename}`);
        candidates.push(`/${filename}`);
      }
    }

    // dedupe & normalize multiple slashes for keying (preserve original candidate strings)
    const uniq: string[] = [];
    const seen = new Set<string>();
    for (const c of candidates) {
      const key = c.replace(/\/+/g, "/");
      if (!seen.has(key)) {
        seen.add(key);
        uniq.push(c);
      }
    }

    console.debug("[Thumbnail] candidates for", imageUrl, uniq);

    // Convert a candidate into a path usable with api.get (removes apiBasePath so axios won't double prefix)
    function pathForApi(candidate: string): string | null {
      try {
        if (/^https?:\/\//i.test(candidate)) {
          const u = new URL(candidate);
          if (u.origin === apiBaseOrigin) {
            let p = u.pathname + (u.search || "");
            if (apiBasePath && p.startsWith(apiBasePath)) p = p.slice(apiBasePath.length) || "/";
            if (!p.startsWith("/")) p = "/" + p;
            return p;
          }
          // cross-origin absolute -> cannot use api.get
          return null;
        } else {
          let p = candidate.startsWith("/") ? candidate : "/" + candidate;
          if (apiBasePath && p.startsWith(apiBasePath)) {
            p = p.slice(apiBasePath.length) || "/";
          }
          if (!p.startsWith("/")) p = "/" + p;
          return p;
        }
      } catch {
        return null;
      }
    }

    async function tryCandidates() {
      for (const cand of uniq) {
        if (!mounted) return;
        try {
          if (/^https?:\/\//i.test(cand)) {
            const candUrl = new URL(cand);
            let apiOrigin = origin;
            try {
              if (api.defaults && typeof api.defaults.baseURL === "string") apiOrigin = new URL(api.defaults.baseURL).origin;
              else if (apiBase) apiOrigin = new URL(apiBase).origin;
            } catch {}
            if (candUrl.origin === apiOrigin) {
              const p = pathForApi(cand);
              if (!p) continue;
              try {
                const resp = await api.get(p, { responseType: "blob" });
                objectUrl = URL.createObjectURL(resp.data);
                if (mounted) {
                  setSrc(objectUrl);
                  console.debug("[Thumbnail] loaded blob (same-origin absolute) from", cand);
                  return;
                }
              } catch (err) {
                console.debug("[Thumbnail] api.get for same-origin absolute failed", cand, err);
                continue;
              }
            } else {
              if (mounted) {
                setSrc(cand);
                console.debug("[Thumbnail] using external absolute URL", cand);
                return;
              }
            }
          } else {
            const p = pathForApi(cand);
            if (p === null) {
              continue;
            }
            try {
              const resp = await api.get(p, { responseType: "blob" });
              objectUrl = URL.createObjectURL(resp.data);
              if (mounted) {
                setSrc(objectUrl);
                console.debug("[Thumbnail] fetched blob for candidate", cand, "via api.get", p);
                return;
              }
            } catch (err) {
              console.debug("[Thumbnail] relative candidate failed", cand, err);
              continue;
            }
          }
        } catch (outerErr) {
          console.debug("[Thumbnail] candidate outer error", cand, outerErr);
          continue;
        }
      }

      if (mounted) {
        setError(true);
        console.debug("[Thumbnail] all candidates failed for", imageUrl);
      }
    }

    tryCandidates();

    return () => {
      mounted = false;
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
      }
    };
  }, [imageUrl]);

  if (error || !src) {
    return (
      <div
        style={{
          width: size.w,
          height: size.h,
          background: "#f1f1f1",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#869089",
          fontSize: 12,
        }}
      >
        {error ? "Image unavailable" : "No image"}
      </div>
    );
  }

  return <img src={src} alt="thumb" style={{ width: size.w, height: size.h, objectFit: "cover", borderRadius: 6 }} onError={() => setError(true)} />;
}

/* ------------------- Styles & helpers ------------------- */
const cardConstrained: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  background: "#fff",
  padding: "10px 12px",
  borderRadius: 8,
  boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
  fontSize: 13,
  width: "100%",
  maxWidth: "100%",
};

const linkTiny: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 6,
  background: "#f0f0f0",
  color: "#111",
  textDecoration: "none",
  fontSize: 12,
  display: "inline-block",
};

const buttonTiny: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 6,
  border: "none",
  background: "#f0f0f0",
  cursor: "pointer",
  fontSize: 12,
};

const buttonTinyPrimary: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 6,
  border: "none",
  background: "#0b6efd",
  color: "#fff",
  cursor: "pointer",
  fontSize: 12,
};

const inputTiny: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #ddd",
  fontSize: 12,
};

const buttonTinyLink: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 6,
  background: "transparent",
  color: "#0b6efd",
  textDecoration: "none",
  border: "1px dashed #dfefff",
  fontSize: 12,
};

const pageStyles: { [k: string]: React.CSSProperties } = {
  root: { display: "flex", minHeight: "100vh", fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial", background: "#f5f7fb" },
  sidebar: { width: 240, background: "linear-gradient(180deg,#16382f,#123023)", color: "#fff", display: "flex", flexDirection: "column", padding: 18, boxShadow: "2px 0 12px rgba(0,0,0,0.06)" },
  brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  brandIcon: { fontSize: 20 },
  brandText: { fontWeight: 800, fontSize: 18 },
  nav: { display: "flex", flexDirection: "column", gap: 8 },
  navButton: { background: "transparent", border: "none", color: "#e6eef0", padding: "10px 8px", textAlign: "left", borderRadius: 8, cursor: "pointer", fontWeight: 700 },
  navButtonActive: { background: "rgba(255,255,255,0.06)", color: "#fff" },
  logoutButton: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "#c0392b", color: "#fff", cursor: "pointer", fontWeight: 700 },

  main: { flex: 1, padding: 18 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  postButton: { padding: "8px 12px", borderRadius: 8, background: "#19fd0d", color: "#063", textDecoration: "none", fontWeight: 800 },
  refreshButton: { padding: "8px 12px", borderRadius: 8, background: "#eef6ff", border: "none", cursor: "pointer" },
  postInline: { padding: "6px 8px", borderRadius: 6, background: "#19fd0d", color: "#fff", textDecoration: "none", fontWeight: 700 },
};