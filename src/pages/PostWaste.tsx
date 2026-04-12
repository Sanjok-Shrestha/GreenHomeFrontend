import React, { useEffect, useRef, useState, useContext } from "react";
import type { AxiosProgressEvent } from "axios";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../App";
import Sidebar from "../components/Sidebar";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Default Leaflet icon (ensure marker images show correctly) */
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type FormState = {
  wasteType: string;
  quantity: string;
  location: string;
  description: string;
};

type PricingItem = {
  _id?: string;
  wasteType: string;
  pricePerKg: number;
};

/* Local fallback price map if backend pricing not present */
const FALLBACK_PRICE_PER_KG: Record<string, number> = {
  plastic: 40,
  paper: 15,
  metal: 80,
  glass: 10,
  organic: 5,
  electronic: 200,
};

export default function PostWaste(): React.JSX.Element {
  const navigate = useNavigate();
  const { setAuthState } = useContext(AuthContext);

  const [user] = useState<any>(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  const [formData, setFormData] = useState<FormState>({
    wasteType: "",
    quantity: "",
    location: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  // Pricing & categories
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [pricingLoading, setPricingLoading] = useState<boolean>(true);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Location mode: "text" or "map"
  const [locationMode, setLocationMode] = useState<"text" | "map">("text");

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Geocoding state
  const [geocoding, setGeocoding] = useState(false);

  const wasteTypes = [
    { value: "plastic", label: "Plastic" },
    { value: "paper", label: "Paper" },
    { value: "metal", label: "Metal" },
    { value: "glass", label: "Glass" },
    { value: "organic", label: "Organic" },
    { value: "electronic", label: "Electronic" },
  ];

  // Redirect to login if no token present
  useEffect(() => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // On mount try to center map on user's location (best-effort)
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setMapCenter([20, 0]);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMapCenter([lat, lng]);
      },
      () => {
        setMapCenter([20, 0]);
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  // Load pricing (and poll + listen for storage changes)
  useEffect(() => {
    let mounted = true;
    let poll: number | undefined;

    async function loadPricing() {
      if (!mounted) return;
      setPricingLoading(true);
      setPricingError(null);
      try {
        const res = await api.get("/pricing").catch(() => null);
        const data = res && res.data ? (Array.isArray(res.data) ? res.data : res.data.data ?? []) : [];
        if (mounted) {
          setPricing(data);
          setPricingError(null);
        }
      } catch (err: any) {
        console.error("Failed to load pricing", err);
        if (mounted) setPricingError("Failed to load price guide");
      } finally {
        if (mounted) setPricingLoading(false);
      }
    }

    loadPricing();
    poll = window.setInterval(loadPricing, 20000);

    function onStorage(e: StorageEvent) {
      if (e.key === "pricing:updated") {
        loadPricing();
      }
    }
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      if (poll) window.clearInterval(poll);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // compute estimated price whenever wasteType or quantity or pricing changes
  useEffect(() => {
    const wt = (formData.wasteType || "").trim().toLowerCase();
    const qn = Number(formData.quantity || 0);
    if (!wt || !qn || Number.isNaN(qn) || qn <= 0) {
      setEstimatedPrice(null);
      return;
    }
    const p = pricing.find((x) => (x.wasteType || "").trim().toLowerCase() === wt);
    // server might return pricePerKg or price_per_kg
    const pricePerKg = p ? Number((p as any).pricePerKg || (p as any).price_per_kg || 0) : FALLBACK_PRICE_PER_KG[wt] ?? 0;
    if (!pricePerKg) {
      setEstimatedPrice(null);
      return;
    }
    setEstimatedPrice(Math.round(pricePerKg * qn));
  }, [formData.wasteType, formData.quantity, pricing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (jpg, png, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image too large (max 5MB).");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  // Reverse-geocode lat/lng -> address (Nominatim)
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
          lat
        )}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`
      );
      const json = await res.json();
      if (json && json.display_name) return json.display_name as string;
    } catch (err) {
      console.warn("Reverse geocode failed", err);
    }
    return "";
  };

  // Forward-geocode address -> lat/lng (Nominatim)
  const geocodeAddress = async (address: string) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const arr = await res.json();
      if (Array.isArray(arr) && arr[0]) {
        const lat = Number(arr[0].lat);
        const lon = Number(arr[0].lon);
        setMapCenter([lat, lon]);
        setMarkerPos([lat, lon]);
        setFormData((f) => ({ ...f, location: arr[0].display_name ?? address }));
        try {
          mapRef.current?.setView([lat, lon], 15);
        } catch {}
        return { lat, lon, display_name: arr[0].display_name };
      }
    } catch (err) {
      console.warn("Geocode failed", err);
    } finally {
      setGeocoding(false);
    }
    return null;
  };

  // Map click handler
  function ClickHandler() {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setMarkerPos([lat, lng]);
        const addr = await reverseGeocode(lat, lng);
        if (addr) setFormData((f) => ({ ...f, location: addr }));
      },
    });
    return null;
  }

  function MapSetter({ setter }: { setter: React.MutableRefObject<L.Map | null> }) {
    const map = useMap();
    useEffect(() => {
      setter.current = map;
    }, [map, setter]);
    return null;
  }

  // Helper: try extract id from response object or headers
  async function resolveCreatedIdFromResponse(res: any) {
    if (!res) return null;
    const candidates = [
      res?.data?.createdId,
      res?.data?.waste?._id,
      res?.data?.waste?.id,
      res?.data?._id,
      res?.data?.id,
      res?.data?.data?.waste?._id,
      res?.data?.data?._id,
      res?.data?.data?.id,
    ];
    for (const c of candidates) {
      if (c) return String(c);
    }
    // try Location header
    try {
      const loc = res?.headers?.location;
      if (typeof loc === "string") {
        const parts = loc.split("/").filter(Boolean);
        const last = parts[parts.length - 1];
        if (last) return last;
      }
    } catch {}
    return null;
  }

  // Final fallback: fetch my-posts and pick most recent
  async function findMostRecentMyPostId() {
    try {
      const r = await api.get("/waste/my-posts").catch(() => null);
      const payload = r?.data?.data ?? r?.data ?? r;
      const arr = Array.isArray(payload) ? payload : (Array.isArray(r?.data) ? r.data : []);
      if (!arr || arr.length === 0) return null;
      let best = arr[0];
      for (const it of arr) {
        const a = it.createdAt ? new Date(it.createdAt).getTime() : 0;
        const b = best.createdAt ? new Date(best.createdAt).getTime() : 0;
        if (a > b) best = it;
      }
      return (best._id ?? best.id ?? null) as string | null;
    } catch (e) {
      console.warn("findMostRecentMyPostId failed", e);
      return null;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.wasteType || !formData.quantity) {
      setError("Please fill in all required fields");
      return;
    }
    if (!imageFile) {
      setError("Please upload a photo of the waste (required).");
      return;
    }
    const quantityNum = parseFloat(String(formData.quantity));
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    setLoading(true);
    setUploadProgress(null);
    setError("");

    try {
      const data = new FormData();
      data.append("wasteType", formData.wasteType);
      data.append("quantity", String(quantityNum));
      data.append("location", formData.location);
      data.append("description", formData.description);
      data.append("image", imageFile);

      if (markerPos) {
        data.append("lat", String(markerPos[0]));
        data.append("lng", String(markerPos[1]));
      }

      // NOTE: api.baseURL already contains "/api", so call "/waste/post"
      const res = await api.post("/waste/post", data, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev: AxiosProgressEvent) => {
          const loaded = (ev as any).loaded as number | undefined;
          const total = (ev as any).total as number | undefined;
          if (typeof loaded === "number" && typeof total === "number" && total > 0) {
            setUploadProgress(Math.round((loaded * 100) / total));
          }
        },
      });

      console.debug("[PostWaste] POST response:", res);

      const estimated = res?.data?.estimatedPrice ?? res?.data?.estimated_price;
      setEstimatedPrice(typeof estimated === "number" ? estimated : estimatedPrice);
      setSuccess(true);

      // Try resolving id
      let createdId = await resolveCreatedIdFromResponse(res);
      if (!createdId) {
        console.debug("[PostWaste] createdId not found in POST response, trying /waste/my-posts fallback");
        createdId = await findMostRecentMyPostId();
      }

      console.debug("[PostWaste] resolved createdId:", createdId);

      const goToSchedule = (id?: string | null) => {
        const url = id ? `/schedule-pickup?item=${encodeURIComponent(id)}` : "/schedule-pickup";
        // Try SPA navigation first
        try {
          if (id) navigate(url, { state: { createdId: id } });
          else navigate(url);
        } catch (navErr) {
          console.warn("[PostWaste] navigate error:", navErr);
        }
        // Force full navigation quickly if SPA didn't switch
        setTimeout(() => {
          if (!window.location.pathname.startsWith("/schedule-pickup")) {
            console.warn("[PostWaste] SPA navigation didn't change location — forcing full navigation to", url);
            window.location.href = url;
          }
        }, 300);
      };

      if (createdId) goToSchedule(createdId);
      else goToSchedule(null);

      setTimeout(() => {
        setFormData({ wasteType: "", quantity: "", location: "", description: "" });
        setImageFile(null);
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
          setImagePreview(null);
        }
        setSuccess(false);
        setEstimatedPrice(null);
        setUploadProgress(null);
        setMarkerPos(null);
      }, 1500);
    } catch (err: any) {
      console.error("[PostWaste] submit error:", err);
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err.message || "Failed to post waste.";

      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        try { setAuthState({ isAuth: false, roleState: "" }); } catch {}
        setError("Not authorized — please login again.");
        setTimeout(() => navigate("/login", { replace: true }), 900);
      } else if (status === 403) {
        setError(message || "You don't have permission to post waste.");
      } else if (status === 400) {
        setError(message || "Bad request — please check the fields.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageFile(null);
  };

  const getTodayLocal = () => new Date().toISOString().split("T")[0];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f7fb" }}>
      <Sidebar />

      <div style={{ flex: 1, maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 32, color: "#2c3e50", fontWeight: 700 }}>Post Waste Collection</h1>
            <p style={{ margin: "8px 0 0 0", color: "#7f8c8d", fontSize: 16 }}>Submit your waste for collection and optionally pick location on map</p>
          </div>
          <div style={{ width: 55, height: 55, borderRadius: "50%", backgroundColor: "#19fd0d", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: "bold" }}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
          {/* form card */}
          <div style={{ background: "white", padding: 30, borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: 18, color: "#2c3e50", fontWeight: 600 }}>Waste Details</h3>
            {error && <div style={{ backgroundColor: "#fee", color: "#c33", padding: 12, borderRadius: 8, marginBottom: 12 }}>{error}</div>}
            {success && <div style={{ backgroundColor: "#d4edda", color: "#155724", padding: 12, borderRadius: 8, marginBottom: 12 }}>Waste posted successfully!{estimatedPrice ? ` Estimated: Rs ${estimatedPrice}` : ""}</div>}

            <form onSubmit={handleSubmit}>
              {/* Waste Type */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Waste Type *</label>
                <select name="wasteType" value={formData.wasteType} onChange={handleChange} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd" }} required>
                  <option value="" disabled>Select waste type</option>
                  {wasteTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Quantity */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Quantity (kg) *</label>
                <input type="number" name="quantity" placeholder="Enter quantity in kg" value={formData.quantity} onChange={handleChange} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd" }} min="0.1" step="0.1" required />
              </div>

              {/* Location and map section */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Pickup Location</label>
                <div style={{ marginBottom: 8, display: "flex", gap: 8 }}>
                  <label><input type="radio" checked={locationMode === "text"} onChange={() => setLocationMode("text")} /> Text</label>
                  <label><input type="radio" checked={locationMode === "map"} onChange={() => setLocationMode("map")} /> Pick on map</label>
                </div>

                {locationMode === "text" ? (
                  <>
                    <input type="text" name="location" placeholder="Enter address (or leave blank)" value={formData.location} onChange={handleChange} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd" }} />
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <button type="button" onClick={async () => { if (!formData.location) { setError("Enter an address to center on map."); return; } setError(""); await geocodeAddress(formData.location); }} style={{ padding: "8px 12px", borderRadius: 8 }}>Geocode & preview</button>
                      <div style={{ alignSelf: "center", color: "#666", fontSize: 13 }}>{geocoding ? "Searching..." : markerPos ? `Selected: ${markerPos[0].toFixed(4)}, ${markerPos[1].toFixed(4)}` : ""}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ height: 300, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <MapContainer center={mapCenter ?? [20, 0]} zoom={mapCenter ? 13 : 2} style={{ height: "100%", width: "100%" }}>
                        <MapSetter setter={mapRef} />
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                        <ClickHandler />
                        {markerPos && <Marker position={markerPos} icon={defaultIcon}><Popup>Selected location</Popup></Marker>}
                      </MapContainer>
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <button type="button" onClick={() => { setMarkerPos(null); setFormData((f) => ({ ...f, location: "" })); }} style={{ padding: "8px 12px", borderRadius: 8 }}>Clear selection</button>
                      <button type="button" onClick={() => { navigator.geolocation?.getCurrentPosition(async (pos) => { setMarkerPos([pos.coords.latitude, pos.coords.longitude]); setMapCenter([pos.coords.latitude, pos.coords.longitude]); const addr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude); if (addr) setFormData((f) => ({ ...f, location: addr })); try { mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 15); } catch {} }, () => alert("Unable to access your location.")); }} style={{ padding: "8px 12px", borderRadius: 8 }}>Use my location</button>
                      <div style={{ alignSelf: "center", color: "#666", fontSize: 13 }}>{markerPos ? `Selected: ${markerPos[0].toFixed(4)}, ${markerPos[1].toFixed(4)}` : "No location selected"}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Additional Notes */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Additional Notes</label>
                <textarea name="description" placeholder="Any additional information..." value={formData.description} onChange={handleChange} rows={4} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd" }} />
              </div>

              {/* Photo */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Photo *</label>
                <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>Please upload a clear photo of the waste (required).</div>
                <input type="file" accept="image/*" onChange={handleFileChange} required />
                {imagePreview && (
                  <div style={{ marginTop: 10 }}>
                    <img src={imagePreview} alt="preview" style={{ maxWidth: 180, borderRadius: 8, display: "block", marginBottom: 6 }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={handleRemoveImage} style={{ padding: "8px 12px", borderRadius: 8, background: "#e74c3c", color: "#fff" }}>Remove</button>
                      <span style={{ alignSelf: "center", color: "#666" }}>{Math.round((imageFile?.size ?? 0) / 1024)} KB</span>
                    </div>
                  </div>
                )}
                {uploadProgress != null && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ width: "100%", background: "#eee", height: 8, borderRadius: 6 }}>
                      <div style={{ width: `${uploadProgress}%`, background: "#27ae60", height: 8, borderRadius: 6 }} />
                    </div>
                    <div style={{ fontSize: 12, color: "#333", marginTop: 6 }}>{uploadProgress}%</div>
                  </div>
                )}
              </div>

              {/* FULL WIDTH SUBMIT BUTTON */}
              <button type="submit" style={{ width: "100%", padding: "14px 20px", backgroundColor: "#19fd0d", color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 600 }} disabled={loading}>
                {loading ? "Submitting..." : "Submit Waste"}
              </button>
            </form>
          </div>

          {/* price / tips */}
          <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div style={{ background: "#f8f9fa", padding: 16, borderRadius: 10, marginBottom: 18 }}>
              <h4 style={{ marginTop: 0, fontSize: 15, color: "#2c3e50", fontWeight: 600 }}>Price Guide (per kg)</h4>

              {/* Show pricingError if present */}
              {pricingError && (
                <div style={{ background: "#fff4f4", color: "#b91c1c", padding: 8, borderRadius: 6, marginBottom: 10, fontSize: 13 }}>
                  {pricingError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pricingLoading ? <div style={{ color: "#666" }}>Loading price guide…</div> :
                  (pricing.length === 0 ? Object.keys(FALLBACK_PRICE_PER_KG).map((k) => (<div key={k} style={{ display: "flex", justifyContent: "space-between" }}><span>{k.charAt(0).toUpperCase() + k.slice(1)}</span><span style={{ fontWeight: 600, color: "#27ae60" }}>Rs {FALLBACK_PRICE_PER_KG[k]}</span></div>)) :
                    pricing.map((p) => (<div key={p._id ?? p.wasteType} style={{ display: "flex", justifyContent: "space-between" }}><span>{p.wasteType}</span><span style={{ fontWeight: 600, color: "#27ae60" }}>Rs {p.pricePerKg}</span></div>)))}
              </div>

              <div style={{ marginTop: 12 }}>
                <button onClick={() => { window.localStorage.setItem("pricing:updated", String(Date.now())); api.get("/pricing").then((r) => setPricing(Array.isArray(r.data) ? r.data : r.data?.data ?? [])).catch(() => {}); }} style={{ padding: "8px 12px", borderRadius: 8, background: "#f1f1f1", border: "none" }}>Refresh Price Guide</button>
              </div>
            </div>

            <h3 style={{ margin: "0 0 12px 0", fontSize: 18, color: "#2c3e50", fontWeight: 600 }}>Quick Tips</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 10 }}><div style={{ color: "#27ae60" }}>✅</div><p style={{ margin: 0 }}>Clean and separate waste by type</p></div>
              <div style={{ display: "flex", gap: 10 }}><div style={{ color: "#27ae60" }}>✅</div><p style={{ margin: 0 }}>Remove labels from bottles</p></div>
              <div style={{ display: "flex", gap: 10 }}><div style={{ color: "#27ae60" }}>✅</div><p style={{ margin: 0 }}>Flatten cardboard boxes</p></div>
              <div style={{ display: "flex", gap: 10 }}><div style={{ color: "#27ae60" }}>✅</div><p style={{ margin: 0 }}>Accurate weight = Better pricing</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* helpers */
function formatLocal(iso?: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso ?? "";
  }
}