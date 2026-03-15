import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

/*
  TrackPickup.tsx
  - Polls API for pickup info and shows a Leaflet map
  - Map view constrained to Nepal only (maxBounds)
  - Prefers explicit coordinates, falls back to geocoding address (Nominatim)
  - Robust map operations (whenReady), scrollWheelZoom disabled
  - Geolocation permission detection + clear UI for blocked state
  - Smooth marker movement and path polyline
*/

/* -------------------- Types -------------------- */
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

/* -------------------- Leaflet icon -------------------- */
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/* -------------------- Helpers -------------------- */
function haversine(a: [number, number], b: [number, number]) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const R = 6371e3;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const aa = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return (R * c) / 1000;
}

function API_BASE_ORIGIN() {
  return (typeof window !== "undefined" && (window as any).__API_BASE__) || "";
}

/* Nepal bounding box (approx) — typed as explicit tuple to satisfy TypeScript */
const NEPAL_BOUNDS: [[number, number], [number, number]] = [
  [26.347, 80.058], // southwest (lat, lng)
  [30.422, 88.201], // northeast
];
const NEPAL_CENTER: [number, number] = [28.385, 84.129]; // approximate center
const NEPAL_DEFAULT_ZOOM = 7;

/* Clamp position into Nepal bounds */
function clampToBounds(lat: number, lng: number) {
  const sw = NEPAL_BOUNDS[0];
  const ne = NEPAL_BOUNDS[1];
  const clampedLat = Math.max(sw[0], Math.min(ne[0], lat));
  const clampedLng = Math.max(sw[1], Math.min(ne[1], lng));
  return [clampedLat, clampedLng] as [number, number];
}

/* MapAutoPan - uses whenReady to avoid calling map methods too early */
function MapAutoPan({ position, follow }: { position: [number, number] | null; follow: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!position || !follow) return;
    map.whenReady(() => {
      try {
        map.setView(position, map.getZoom(), { animate: true });
      } catch (e) {
        // swallow map errors
      }
    });
  }, [position, follow, map]);
  return null;
}

/* -------------------- Component -------------------- */
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
  const [useSatellite, setUseSatellite] = useState(false);
  const [lastSeen, setLastSeen] = useState<number | null>(null);

  const markerRef = useRef<L.Marker | null>(null);
  const pollRef = useRef<number | null>(null);
  const pollIntervalMs = 8000;

  const [geoBlocked, setGeoBlocked] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => (typeof window !== "undefined" ? window.innerWidth < 900 : false));

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* check geolocation permission state (to show helpful message if blocked) */
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
      mounted = false;
    };
  }, []);

  /* fetch pickup (initial + polling) */
  useEffect(() => {
    if (!id) {
      setError("No pickup id provided");
      setLoading(false);
      return;
    }

    let mounted = true;
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || "";

    const fetchOnce = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_ORIGIN()}/api/waste/track/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const body = res.data && typeof res.data === "object" ? (res.data.data ?? res.data) : res.data;
        if (!body) {
          if (!mounted) return;
          setError("No pickup data returned");
          setPickup(null);
          setLoading(false);
          return;
        }
        if (!mounted) return;
        setPickup(body as Pickup);

        // Prefer explicit coordinates
        const lat =
          (body.location && (body.location.lat ?? body.location.latitude)) ?? body.lat ?? body.latitude ?? null;
        const lng =
          (body.location && (body.location.lng ?? body.location.longitude)) ?? body.lng ?? body.longitude ?? null;

        if (lat != null && lng != null) {
          // clamp to Nepal bounds so marker stays inside visible country area
          const [clampedLat, clampedLng] = clampToBounds(Number(lat), Number(lng));
          const pos: [number, number] = [clampedLat, clampedLng];
          setPosition((prev) => {
            const prevPos = prev;
            if (!prevPos || Math.abs(prevPos[0] - pos[0]) > 0.00001 || Math.abs(prevPos[1] - pos[1]) > 0.00001) {
              setPath((p) => [...p, pos].slice(-100));
            }
            return pos;
          });
          setLastSeen(Date.now());
          setLoading(false);
          return;
        }

        // No explicit coords: try geocoding address (best-effort)
        const address = body.address ?? body.location?.address ?? null;
        if (address) {
          try {
            const geo = await axios.get("https://nominatim.openstreetmap.org/search", {
              params: { q: address, format: "json", limit: 1 },
              headers: { "Accept-Language": "en" },
            });
            const first = geo.data && geo.data[0];
            if (first && first.lat && first.lon) {
              const [latG, lonG] = [Number(first.lat), Number(first.lon)];
              const [clampedLat, clampedLng] = clampToBounds(latG, lonG);
              const pos: [number, number] = [clampedLat, clampedLng];
              setPosition(pos);
              setPath((p) => [...p, pos].slice(-100));
              setLastSeen(Date.now());
              setLoading(false);
              return;
            } else {
              console.warn("Nominatim returned no results for address:", address);
            }
          } catch (geErr) {
            console.warn("Geocoding error:", geErr);
          }
        }

        // Nothing available -> no position (map will show Nepal overview)
        setPosition(null);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching pickup:", err);
        if (err.response) setError(`Server error: ${err.response.status}`);
        else if (err.request) setError("No response from server");
        else setError(err.message || "Unknown error");
        setLoading(false);
      }
    };

    // initial fetch & start polling
    fetchOnce();
    pollRef.current = window.setInterval(fetchOnce, pollIntervalMs);

    return () => {
      mounted = false;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* Smooth marker movement */
  useEffect(() => {
    if (!markerRef.current || !position) return;
    try {
      const marker = markerRef.current;
      const from = marker.getLatLng();
      const to = L.latLng(position[0], position[1]);
      const frames = 12;
      let frame = 0;
      const latDiff = (to.lat - from.lat) / frames;
      const lngDiff = (to.lng - from.lng) / frames;
      const step = () => {
        frame++;
        const next = L.latLng(from.lat + latDiff * frame, from.lng + lngDiff * frame);
        marker.setLatLng(next);
        if (frame < frames) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    } catch {
      markerRef.current.setLatLng(position);
    }
  }, [position]);

  /* Request user's browser location (explicit) */
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const [lat, lng] = [p.coords.latitude, p.coords.longitude];
        // clamp to Nepal so map doesn't jump outside (user may be elsewhere; we still clamp)
        const [clampedLat, clampedLng] = clampToBounds(lat, lng);
        setUserLoc([clampedLat, clampedLng]);
        if (!position) setPosition([clampedLat, clampedLng]);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        if (err.code === err.PERMISSION_DENIED) setGeoBlocked(true);
        alert("Unable to get your location. Check browser permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  const distanceKm = position && userLoc ? haversine(position, userLoc) : null;
  const lastSeenText = lastSeen ? `${Math.round((Date.now() - lastSeen) / 1000)}s ago` : "now";

  if (loading) return <div style={styles.loading}>Loading pickup…</div>;
  if (error) return <div style={styles.errorBox}>Error: {error}</div>;
  if (!pickup) return <div style={styles.container}><div style={styles.card}>No pickup data available.</div></div>;

  /* Map center logic:
     - If position present -> center on it (already clamped to Nepal)
     - Else if userLoc present -> center on userLoc (clamped)
     - Else -> show Nepal center and default zoom
  */
  const mapCenter: [number, number] = position ?? userLoc ?? NEPAL_CENTER;
  const mapZoom = position ? 13 : userLoc ? 12 : NEPAL_DEFAULT_ZOOM;

  return (
    <div style={{ ...styles.container, padding: isMobile ? 10 : 16 }}>
      <div style={styles.header}>
        <div>
          <button onClick={() => navigate(-1)} style={styles.back}>← Back</button>
          <h2 style={styles.title}>Track Pickup</h2>
          <div style={styles.subtitle}>{pickup?.wasteType ?? "Pickup details"}</div>
        </div>

        <div style={styles.controls}>
          <div style={styles.meta}>
            <div style={styles.metaRow}><strong style={styles.metaLabel}>Collector</strong><span style={styles.metaValue}>{pickup?.collector?.name ?? "—"}</span></div>
            <div style={styles.metaRow}><strong style={styles.metaLabel}>Last seen</strong><span style={styles.metaValue}>{lastSeen ? lastSeenText : "—"}</span></div>
            <div style={styles.metaRow}><strong style={styles.metaLabel}>Distance</strong><span style={styles.metaValue}>{distanceKm ? `${distanceKm.toFixed(2)} km` : "—"}</span></div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setFollowing((s) => !s)} style={styles.btn}>{following ? "Unfollow" : "Follow"}</button>
            <button onClick={() => setUseSatellite((s) => !s)} style={styles.btn}>{useSatellite ? "Street" : "Satellite"}</button>
            <button onClick={() => requestUserLocation()} style={styles.btnAlt}>Use my location</button>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={isMobile ? styles.contentMobile : styles.content}>
          <div style={styles.info}>
            {pickup?.imageUrl && <img src={pickup.imageUrl} alt="waste" style={styles.image} />}
            <h3 style={styles.infoTitle}>{pickup?.wasteType ?? "Waste"}</h3>
            <div style={styles.grid}>
              <div><div style={styles.label}>Quantity</div><div style={styles.value}>{pickup?.quantity ?? "—"} kg</div></div>
              <div><div style={styles.label}>Price</div><div style={styles.value}>Rs {pickup?.price ?? "—"}</div></div>
              <div><div style={styles.label}>Status</div><div style={styles.value}>{pickup?.status ?? "—"}</div></div>
              <div><div style={styles.label}>Pickup</div><div style={styles.value}>{pickup?.pickupDate ? new Date(pickup.pickupDate).toLocaleString() : "Not scheduled"}</div></div>
            </div>
            {pickup?.description && (
              <div style={{ marginTop: 10 }}>
                <div style={styles.label}>Notes</div>
                <p style={{ margin: "6px 0", color: "#333" }}>{pickup.description}</p>
              </div>
            )}
          </div>

          <div style={styles.mapArea}>
            <div style={styles.mapWrapper}>
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
                maxBounds={NEPAL_BOUNDS}
                maxBoundsViscosity={0.8}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url={useSatellite ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                />

                {position && (
                  <>
                    <Marker
                      position={position}
                      icon={defaultIcon}
                      ref={(ref) => {
                        if (!ref) return;
                        // react-leaflet v3: the internal leaflet instance may be under .leafletElement
                        // @ts-ignore
                        markerRef.current = (ref as any).leafletElement ?? (ref as unknown as L.Marker);
                      }}
                    >
                      <Popup>
                        <strong>{pickup?.collector ? pickup.collector.name : "Collector"}</strong>
                        <div>{pickup?.wasteType ?? ""}</div>
                      </Popup>
                    </Marker>

                    {path.length >= 2 && <Polyline positions={path} color="#2c9f4a" weight={4} opacity={0.9} />}

                    <MapAutoPan position={position} follow={following} />
                  </>
                )}

                {userLoc && <Circle center={userLoc} radius={50} pathOptions={{ color: "#2b7" }} />}
              </MapContainer>
            </div>

            {!position && (
              <div style={styles.noMap}>
                <div style={{ fontWeight: 700, color: "#222" }}>No live location available.</div>
                {pickup?.address && <div style={{ marginTop: 8, color: "#444" }}>Address: {pickup.address}</div>}
                <div style={{ marginTop: 12 }}>
                  {geoBlocked ? (
                    <div style={{ padding: 8, background: "#fff7e6", borderRadius: 6 }}>
                      Geolocation is blocked in your browser. Enable it in site settings (click the lock icon near the URL), or copy this track link:
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => navigator.clipboard?.writeText(window.location.href)} style={styles.btnAlt}>Copy link</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => requestUserLocation()} style={styles.btnAlt}>Use my location</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackPickup;

/* -------------------- Styles -------------------- */
const styles: { [k: string]: React.CSSProperties } = {
  container: { padding: 16, maxWidth: 1100, margin: "0 auto", fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 },
  back: { background: "transparent", border: "none", color: "#0b6efd", cursor: "pointer", fontWeight: 700 },
  title: { margin: 0, fontSize: 20, color: "#0b2a1a" },
  subtitle: { marginTop: 4, color: "#2f4f3f", fontSize: 13 },
  controls: { display: "flex", gap: 12, alignItems: "center" },
  meta: { display: "flex", flexDirection: "column", gap: 6, marginRight: 12 },
  metaRow: { display: "flex", justifyContent: "space-between", minWidth: 160, gap: 8 },
  metaLabel: { color: "#2f4f3f", fontWeight: 700 },
  metaValue: { color: "#20382b" },
  btn: { padding: "8px 10px", borderRadius: 8, border: "none", background: "#2c9f4a", color: "#fff", cursor: "pointer", fontWeight: 700 },
  btnAlt: { padding: "8px 10px", borderRadius: 8, border: "1px solid #e6e6e6", background: "#fff", cursor: "pointer", color: "#20382b" },

  card: { background: "#fff", padding: 14, borderRadius: 10, boxShadow: "0 10px 30px rgba(11,36,18,0.04)" },
  content: { display: "flex", gap: 12 },
  contentMobile: { display: "flex", flexDirection: "column", gap: 12 },
  info: { flex: "0 0 360px" },
  image: { width: "100%", height: 160, objectFit: "cover", borderRadius: 8, marginBottom: 8 },
  infoTitle: { color: "#0b3e23", marginTop: 8 },
  grid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 8 },
  label: { color: "#6b7a72", fontSize: 13, marginBottom: 6 },
  value: { fontWeight: 700, color: "#20382b" },

  mapArea: { flex: 1, minHeight: 420 },
  mapWrapper: { height: 420, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)" },
  noMap: { padding: 12, borderRadius: 8, background: "#fff", border: "1px dashed rgba(0,0,0,0.06)" },

  loading: { padding: 20, textAlign: "center" },
  errorBox: { padding: 20, color: "crimson", background: "#fff1f1", borderRadius: 8 },
};