import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import Sidebar from "../components/Sidebar";
import CollectorSidebar from "../components/CollectorSidebar";
import AdminSidebar from "../components/AdminSidebar";
import api from "../api";

/* ─────────────────────────── Styles ─────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --bg: #f1f4f2;
    --surface: #ffffff;
    --surface-2: #f7faf8;
    --border: #e2e9e5;
    --green: #18a349;
    --green-soft: #e8f5ed;
    --text-1: #0c1f13;
    --text-2: #3d5c47;
    --text-3: #89a894;
    --danger: #dc2626;
    --mono: 'JetBrains Mono', monospace;
    --font: 'Plus Jakarta Sans', system-ui, sans-serif;
    --r-md: 12px;
    --r-lg: 16px;
    --sh-sm: 0 1px 4px rgba(0,0,0,.05);
  }

  .tp-page { padding: 28px 24px 56px; max-width: 1160px; margin: 0 auto; font-family: var(--font); color: var(--text-1); -webkit-font-smoothing: antialiased; }
  .tp-header { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:20px; flex-wrap:wrap; }
  .tp-back { background:none; border:none; color:var(--green); font-size:13px; font-weight:600; cursor:pointer; padding:0; margin-bottom:6px; }
  .tp-title { margin:0 0 3px; font-size:21px; font-weight:800; }
  .tp-subtitle { font-size:13px; color:var(--text-3); text-transform:capitalize; }

  .tp-controls { display:flex; gap:14px; align-items:center; flex-wrap:wrap; }
  .tp-meta { display:flex; gap:16px; flex-wrap:wrap; }
  .tp-meta-item { display:flex; flex-direction:column; gap:2px; }
  .tp-meta-label { font-size:10.5px; font-weight:700; text-transform:uppercase; color:var(--text-3); }
  .tp-meta-value { font-size:13.5px; font-weight:600; color:var(--text-1); font-family:var(--mono); }

  .tp-btn-group { display:flex; gap:7px; align-items:center; flex-wrap:wrap; }
  .tp-btn { display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:12px; border:1.5px solid var(--border); background:var(--surface); color:var(--text-1); font-weight:600; cursor:pointer; }
  .tp-btn--primary { background:var(--green); border-color:var(--green); color:#fff; }
  .tp-btn--active { background:var(--green-soft); border-color:var(--green); color:var(--green); }

  .tp-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:20px 22px; box-shadow:var(--sh-sm); }
  .tp-content { display:flex; gap:18px; align-items:flex-start; }
  .tp-content--mobile { flex-direction:column; }

  .tp-info { flex:0 0 340px; min-width:0; }
  .tp-image { width:100%; height:170px; object-fit:cover; border-radius:12px; margin-bottom:14px; display:block; border:1px solid var(--border); }
  .tp-info-title { margin:0 0 14px; font-size:16px; font-weight:800; text-transform:capitalize; }

  .tp-stats { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
  .tp-stat { background:var(--surface-2); border:1px solid var(--border); border-radius:12px; padding:10px 12px; }
  .tp-stat-label { font-size:10.5px; font-weight:700; text-transform:uppercase; color:var(--text-3); margin-bottom:4px; }
  .tp-stat-value { font-size:14px; font-weight:700; color:var(--text-1); font-family:var(--mono); }

  .tp-status { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:600; text-transform:capitalize; background:var(--green-soft); color:var(--green); border:1px solid rgba(24,163,73,.18); }

  .tp-divider { height:1px; background:var(--border); margin:14px 0; }
  .tp-notes-label { font-size:10.5px; font-weight:700; text-transform:uppercase; color:var(--text-3); margin:14px 0 5px; }
  .tp-notes-text { margin:0; font-size:13.5px; color:var(--text-2); line-height:1.65; }

  .tp-map-area { flex:1; min-width:0; display:flex; flex-direction:column; gap:10px; }
  .tp-map-wrapper { height:440px; border-radius:12px; overflow:hidden; border:1px solid var(--border); box-shadow:var(--sh-sm); }

  .tp-no-map { padding:20px; border-radius:12px; background:var(--surface-2); border:1.5px dashed var(--border); display:flex; flex-direction:column; gap:10px; }
  .tp-no-map__title { font-size:14px; font-weight:700; color:var(--text-2); }
  .tp-no-map__address { font-size:13px; color:var(--text-3); font-family:var(--mono); }

  .tp-poll-indicator { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-3); font-family:var(--mono); }
  .tp-poll-dot { width:7px; height:7px; border-radius:50%; background:var(--green); animation:tp-pulse 2s ease infinite; flex-shrink:0; }
  @keyframes tp-pulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.7);} }

  .tp-loading { display:flex; align-items:center; justify-content:center; gap:10px; min-height:40vh; font-size:14px; color:var(--text-2); font-family:var(--font); }
  .tp-loading::before { content:''; width:20px; height:20px; border:2.5px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:tp-spin 600ms linear infinite; flex-shrink:0; }
  @keyframes tp-spin { to { transform: rotate(360deg); } }

  .tp-error { display:flex; align-items:center; gap:10px; padding:16px 18px; border-radius:12px; background:#fff0f0; border:1px solid #fecaca; color:var(--danger); font-size:14px; max-width:560px; margin:48px auto; font-family:var(--font); }
  .tp-empty { padding:48px 20px; text-align:center; color:var(--text-3); font-size:14px; font-family:var(--font); }
`;

/* ─────────────────────────── Types & Helpers ─────────────────────────── */
type Pickup = {
  _id?: string;
  wasteType?: string;
  quantity?: number;
  price?: number;
  status?: string;
  pickupDate?: string | null;
  collector?: { id?: string; name?: string; email?: string } | null;
  user?: { _id?: string; name?: string } | null;
  lat?: number;
  lng?: number;
  location?: { lat?: number; lng?: number; address?: string } | null;
  address?: string;
  imageUrl?: string;
  description?: string;
  createdAt?: string;
  [k: string]: any;
};

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function haversine(a: [number, number], b: [number, number]) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const R = 6371e3;
  const φ1 = toRad(lat1),
    φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1),
    Δλ = toRad(lon2 - lon1);
  const aa = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))) / 1000;
}

const NEPAL_BOUNDS: [[number, number], [number, number]] = [
  [26.347, 80.058],
  [30.422, 88.201],
];
const NEPAL_CENTER: [number, number] = [28.385, 84.129];
const NEPAL_DEFAULT_ZOOM = 7;

function clampToBounds(lat: number, lng: number): [number, number] {
  const [sw, ne] = NEPAL_BOUNDS;
  return [Math.max(sw[0], Math.min(ne[0], lat)), Math.max(sw[1], Math.min(ne[1], lng))];
}

function MapAutoPan({ position, follow }: { position: [number, number] | null; follow: boolean }) {
  const map = useMap();
  useEffect(() => {
    map.whenReady(() => {
      try {
        map.invalidateSize({ animate: false });
      } catch {}
      if (!position || !follow) return;
      try {
        map.setView(position, map.getZoom(), { animate: true });
      } catch {}
    });
  }, [position, follow, map]);
  return null;
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
const TrackPickup: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pickup, setPickup] = useState<Pickup | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [path, setPath] = useState<[number, number][]>([]);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(true);
  const [lastSeen, setLastSeen] = useState<number | null>(null);
  const [geoBlocked, setGeoBlocked] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 900 : false));

  const markerRef = useRef<L.Marker | null>(null);
  const pollRef = useRef<number | null>(null);
  const pollIntervalMs = 8000;

  // image handling
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!("permissions" in navigator)) return;
    let mounted = true;
    (navigator as any)
      .permissions.query({ name: "geolocation" })
      .then((status: any) => {
        if (!mounted) return;
        setGeoBlocked(status.state === "denied");
        status.onchange = () => setGeoBlocked(status.state === "denied");
      })
      .catch(() => {});
    return () => {
      // nothing
    };
  }, []);

  useEffect(() => {
    if (!id) {
      setError("No pickup id provided");
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchOnce = async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/waste/track/${id}`, { signal });
        const raw = res?.data;
        let body: any = null;

        if (!raw) body = null;
        else if (Array.isArray(raw)) body = raw[0] ?? null;
        else if (raw.pickup) body = raw.pickup;
        else if (raw.data && (Array.isArray(raw.data) ? raw.data[0] : raw.data)) body = Array.isArray(raw.data) ? raw.data[0] ?? raw.data : raw.data;
        else if (raw.payload) body = raw.payload;
        else body = raw;

        if (!body) {
          if (mounted) {
            setError("No pickup data returned from server");
            setLoading(false);
          }
          return;
        }

        if (mounted) setPickup(body as Pickup);

        // load image handling separately
        // image loading handled in a different effect

        const latVal =
          (body.location && (body.location.lat ?? body.location.latitude ?? body.location.latitude_deg)) ??
          body.lat ??
          body.latitude ??
          body.latitude_deg ??
          null;
        const lngVal =
          (body.location && (body.location.lng ?? body.location.longitude ?? body.location.longitude_deg)) ??
          body.lng ??
          body.longitude ??
          body.longitude_deg ??
          null;

        if (latVal != null && lngVal != null) {
          const pos = clampToBounds(Number(latVal), Number(lngVal));
          setPosition((prev) => {
            if (!prev || Math.abs(prev[0] - pos[0]) > 1e-6 || Math.abs(prev[1] - pos[1]) > 1e-6) {
              setPath((p) => [...p, pos].slice(-200));
            }
            return pos;
          });
          setLastSeen(Date.now());
          if (mounted) setLoading(false);
          return;
        }

        const address = body.address ?? body.location?.address ?? null;
        if (address) {
          try {
            const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`).then((r) => r.json());
            const first = geo?.[0];
            if (first?.lat && first?.lon) {
              const pos: [number, number] = [Number(first.lat), Number(first.lon)];
              setPosition(pos);
              setPath((p) => [...p, pos].slice(-200));
              setLastSeen(Date.now());
              if (mounted) setLoading(false);
              return;
            }
          } catch (geErr) {
            console.warn("[TrackPickup] Geocoding error:", geErr);
          }
        }

        setPosition(null);
        if (mounted) setLoading(false);
      } catch (err: any) {
        console.error("[TrackPickup] fetch error:", err);
        if (err?.response) setError(`Server error: ${err.response.status} ${err.response?.data?.message ?? ""}`);
        else if (err?.request) setError("No response from server (network/CORS issue?)");
        else setError(err?.message || "Unknown error");
        if (mounted) setLoading(false);
      }
    };

    fetchOnce();
    pollRef.current = window.setInterval(fetchOnce, pollIntervalMs);
    return () => {
      mounted = false;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [id]);

  // load image when pickup.imageUrl changes
  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;
    setImageSrc(null);
    setImageLoadError(false);

    async function loadImage() {
      if (!pickup?.imageUrl) return;
      const resolved = resolveUrl(pickup.imageUrl) ?? pickup.imageUrl;
      if (!resolved) return;

      const absolute = /^https?:\/\//i.test(resolved);
      const base = (api.defaults && (api.defaults.baseURL as string)) || "";
      const onApiHost = base && resolved.startsWith(base.replace(/\/$/, ""));

      try {
        if (!absolute || onApiHost || pickup.imageUrl.startsWith("/")) {
          // fetch using api (auth-aware)
          let path = pickup.imageUrl;
          if (absolute && base && resolved.startsWith(base.replace(/\/$/, ""))) {
            path = resolved.replace(base.replace(/\/$/, ""), "");
            if (!path.startsWith("/")) path = "/" + path;
          } else if (pickup.imageUrl.startsWith("/")) {
            path = pickup.imageUrl;
          }
          const resp = await api.get(path, { responseType: "blob" });
          objectUrl = URL.createObjectURL(resp.data);
          if (mounted) setImageSrc(objectUrl);
        } else {
          if (mounted) setImageSrc(resolved);
        }
      } catch (e) {
        console.warn("Image fetch failed, falling back to direct URL:", e);
        if (mounted) setImageSrc(resolved);
      }
    }

    loadImage();

    return () => {
      mounted = false;
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
      }
    };
  }, [pickup?.imageUrl]);

  useEffect(() => {
    if (!markerRef.current || !position) return;
    const marker = markerRef.current;
    try {
      const from = marker.getLatLng();
      const to = L.latLng(position[0], position[1]);
      const frames = 12;
      let frame = 0;
      const latDiff = (to.lat - from.lat) / frames;
      const lngDiff = (to.lng - from.lng) / frames;
      const step = () => {
        frame++;
        marker.setLatLng(L.latLng(from.lat + latDiff * frame, from.lng + lngDiff * frame));
        if (frame < frames) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    } catch {
      try {
        marker.setLatLng(position);
      } catch {}
    }
  }, [position]);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = clampToBounds(p.coords.latitude, p.coords.longitude);
        setUserLoc(pos);
        if (!position) setPosition(pos);
      },
      (err: GeolocationPositionError) => {
        if (err.code === err.PERMISSION_DENIED) setGeoBlocked(true);
        alert("Unable to get your location. Check browser permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  const roleRaw = (typeof window !== "undefined" ? localStorage.getItem("role") ?? "" : "") as string;
  const role = roleRaw.toString().trim().toLowerCase();
  const SidebarToRender = role === "admin" ? AdminSidebar : role === "collector" ? CollectorSidebar : Sidebar;

  const mapCenter: [number, number] = position ?? userLoc ?? NEPAL_CENTER;
  const mapZoom = position ? 13 : userLoc ? 12 : NEPAL_DEFAULT_ZOOM;
  const distanceKm = position && userLoc ? haversine(position, userLoc) : null;
  const lastSeenText = lastSeen ? `${Math.round((Date.now() - lastSeen) / 1000)}s ago` : "—";

  if (loading)
    return (
      <>
        <style>{css}</style>
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
          <SidebarToRender />
          <main className="tp-page" style={{ flex: 1 }}>
            <div className="tp-loading">Loading pickup…</div>
          </main>
        </div>
      </>
    );

  if (error)
    return (
      <>
        <style>{css}</style>
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
          <SidebarToRender />
          <main className="tp-page" style={{ flex: 1 }}>
            <div className="tp-error">⚠ {error}</div>
          </main>
        </div>
      </>
    );

  if (!pickup)
    return (
      <>
        <style>{css}</style>
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
          <SidebarToRender />
          <main className="tp-page" style={{ flex: 1 }}>
            <div className="tp-empty">No pickup data available.</div>
          </main>
        </div>
      </>
    );

  return (
    <>
      <style>{css}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }} role="application">
        <SidebarToRender />
        <main className="tp-page" style={{ flex: 1 }}>
          <div className="tp-header">
            <div>
              <button className="tp-back" onClick={() => navigate(-1)}>
                ← Back
              </button>
              <h2 className="tp-title">Track Pickup</h2>
              <div className="tp-subtitle">{pickup?.wasteType ?? "Pickup details"}</div>
            </div>

            <div className="tp-controls">
              <div className="tp-meta">
                <div className="tp-meta-item">
                  <span className="tp-meta-label">Collector</span>
                  <span className="tp-meta-value">{pickup?.collector?.name ?? "—"}</span>
                </div>
                <div className="tp-meta-item">
                  <span className="tp-meta-label">Last seen</span>
                  <span className="tp-meta-value">{lastSeenText}</span>
                </div>
                {distanceKm !== null && (
                  <div className="tp-meta-item">
                    <span className="tp-meta-label">Distance</span>
                    <span className="tp-meta-value">{distanceKm.toFixed(2)} km</span>
                  </div>
                )}
              </div>

              <div className="tp-btn-group">
                <button className={`tp-btn ${following ? "tp-btn--active" : ""}`} onClick={() => setFollowing((s) => !s)}>
                  {following ? "● Following" : "Follow"}
                </button>
                <button className="tp-btn tp-btn--primary" onClick={requestUserLocation}>
                  📍 My location
                </button>
              </div>
            </div>
          </div>

          <div className="tp-card">
            <div className={`tp-content${isMobile ? " tp-content--mobile" : ""}`}>
              <div className="tp-info">
                {imageSrc && !imageLoadError ? (
                  <img src={imageSrc} alt={pickup.wasteType ?? "waste"} className="tp-image" onError={() => setImageLoadError(true)} />
                ) : (
                  <div
                    className="tp-image"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7a72", fontWeight: 700 }}
                  >
                    {imageLoadError ? "Image unavailable" : "No image"}
                  </div>
                )}

                <h3 className="tp-info-title">{pickup?.wasteType ?? "Waste"}</h3>

                <div className="tp-stats">
                  <div className="tp-stat">
                    <div className="tp-stat-label">Quantity</div>
                    <div className="tp-stat-value">{pickup?.quantity ?? "—"} kg</div>
                  </div>
                  <div className="tp-stat">
                    <div className="tp-stat-label">Price</div>
                    <div className="tp-stat-value">₹{pickup?.price ?? "—"}</div>
                  </div>
                  <div className="tp-stat">
                    <div className="tp-stat-label">Status</div>
                    <div className="tp-stat-value">
                      <span className="tp-status">{pickup?.status ?? "—"}</span>
                    </div>
                  </div>
                  <div className="tp-stat">
                    <div className="tp-stat-label">Pickup date</div>
                    <div className="tp-stat-value" style={{ fontSize: 12 }}>
                      {pickup?.pickupDate ? new Date(pickup.pickupDate).toLocaleDateString() : "Not scheduled"}
                    </div>
                  </div>
                </div>

                {pickup?.description && (
                  <>
                    <div className="tp-divider" />
                    <div className="tp-notes-label">Notes</div>
                    <p className="tp-notes-text">{pickup.description}</p>
                  </>
                )}
              </div>

              <div className="tp-map-area">
                {lastSeen && (
                  <div className="tp-poll-indicator">
                    <div className="tp-poll-dot" />
                    Live · updated {lastSeenText}
                  </div>
                )}

                <div className="tp-map-wrapper">
                  <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false} maxBounds={NEPAL_BOUNDS} maxBoundsViscosity={0.8}>
                    <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {position && (
                      <>
                        <Marker
                          position={position}
                          icon={defaultIcon}
                          ref={(m) => {
                            markerRef.current = (m as unknown) as L.Marker | null;
                          }}
                        >
                          <Popup>
                            <strong>{pickup?.collector?.name ?? "Collector"}</strong>
                            <div style={{ marginTop: 4, color: "#666", fontSize: 12 }}>{pickup?.wasteType ?? ""}</div>
                          </Popup>
                        </Marker>

                        {path.length >= 2 && <Polyline positions={path} color="var(--green)" weight={4} opacity={0.85} />}

                        <MapAutoPan position={position} follow={following} />
                      </>
                    )}

                    {userLoc && <Circle center={userLoc} radius={50} pathOptions={{ color: "#2563eb", fillColor: "#93c5fd", fillOpacity: 0.35 }} />}
                  </MapContainer>
                </div>

                {!position && (
                  <div className="tp-no-map">
                    <div className="tp-no-map__title">No live location available</div>
                    {pickup?.address && <div className="tp-no-map__address">📍 {pickup.address}</div>}

                    {geoBlocked ? (
                      <div className="tp-geo-blocked">
                        Geolocation is blocked in your browser. Enable it in site settings (click the lock icon near the URL bar).
                        <div style={{ marginTop: 10 }}>
                          <button className="tp-btn" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
                            Copy tracking link
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="tp-btn tp-btn--primary" onClick={requestUserLocation}>
                        📍 Use my location
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default TrackPickup;

/* inject spinner keyframes once */
(() => {
  if (typeof document === "undefined") return;
  const id = "trackpickup-spinner";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `@keyframes tp-spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
})();