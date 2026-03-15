import React, { useEffect, useRef, useState, useContext } from "react";
import type { AxiosProgressEvent } from "axios";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../App";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * PostWaste with optional map picker or text-field location input.
 * - Toggle between "Text address" and "Pick on map".
 * - When using map, click to place marker; reverse-geocode (Nominatim) attempts to fill address.
 * - When using text, you can geocode the address to center the map for preview.
 * - Latitude/longitude are appended to the form (lat,lng) if available.
 *
 * Save/replace: src/pages/PostWaste.tsx
 */

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
  location: string; // human readable address or text
  description: string;
};

export default function PostWaste() {
  const navigate = useNavigate();
  const { setAuthState } = useContext(AuthContext);

  const [user] = useState<any>(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
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
        // fallback to a neutral world view if geolocation fails
        setMapCenter([20, 0]);
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

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
        // set human readable address (normalized)
        setFormData((f) => ({ ...f, location: arr[0].display_name ?? address }));
        // pan map if present
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

  // Small map click handler component to register clicks
  function ClickHandler() {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setMarkerPos([lat, lng]);
        // reverse geocode
        const addr = await reverseGeocode(lat, lng);
        if (addr) setFormData((f) => ({ ...f, location: addr }));
      },
    });
    return null;
  }

  // MapSetter sets mapRef.current using useMap (typed)
  function MapSetter({ setter }: { setter: React.MutableRefObject<L.Map | null> }) {
    const map = useMap();
    useEffect(() => {
      setter.current = map;
    }, [map, setter]);
    return null;
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

      // include lat/lng if selected on map
      if (markerPos) {
        data.append("lat", String(markerPos[0]));
        data.append("lng", String(markerPos[1]));
      }

      const res = await api.post("/api/waste/post", data, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev: AxiosProgressEvent) => {
          const loaded = (ev as any).loaded as number | undefined;
          const total = (ev as any).total as number | undefined;
          if (typeof loaded === "number" && typeof total === "number" && total > 0) {
            setUploadProgress(Math.round((loaded * 100) / total));
          }
        },
      });

      const estimated = res?.data?.estimatedPrice;
      setEstimatedPrice(typeof estimated === "number" ? estimated : null);
      setSuccess(true);

      const createdId =
        res?.data?.waste?._id ??
        res?.data?.waste?.id ??
        res?.data?._id ??
        res?.data?.id ??
        null;

      if (createdId) setTimeout(() => navigate(`/track/${createdId}`), 1200);

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
      }, 2000);
    } catch (err: any) {
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

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setAuthState({ isAuth: false, roleState: "" });
    navigate("/login", { replace: true });
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.logo}><h2 style={styles.logoText}>GreenHome</h2></div>
        <nav style={styles.nav}>
          <button style={styles.navItem} onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button style={{ ...styles.navItem, ...styles.navItemActive }}>Post Waste</button>
          <button style={styles.navItem} onClick={() => navigate("/pickups")}>Pickup Status</button>
          <button style={styles.navItem} onClick={() => navigate("/rewards")}>Rewards</button>
          <button style={styles.navItem} onClick={() => navigate("/profile")}>Profile</button>
          <button style={styles.navItemLogout} onClick={handleLogout}>Logout</button>
        </nav>
      </div>

      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Post Waste Collection</h1>
            <p style={styles.subtitle}>Submit your waste for collection and optionally pick location on map</p>
          </div>
          <div style={styles.profileIcon}>{user?.name?.charAt(0).toUpperCase() || "U"}</div>
        </div>

        <div style={styles.contentGrid}>
          <div style={styles.formCard}>
            <h3 style={styles.cardTitle}>Waste Details</h3>
            {error && <div style={styles.errorBox}><span style={styles.errorIcon}>❌</span>{error}</div>}
            {success && <div style={styles.successBox}><span style={styles.successIcon}>✅</span>Waste posted successfully!{estimatedPrice ? ` Estimated: Rs ${estimatedPrice}` : ""}</div>}

            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Waste Type *</label>
                <select
                  name="wasteType"
                  value={formData.wasteType}
                  onChange={handleChange}
                  style={{ ...styles.select, backgroundColor: "#fff", color: formData.wasteType ? "#13402a" : "#6b7280" }}
                  disabled={loading}
                  required
                >
                  <option value="" disabled>Select waste type</option>
                  {wasteTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Quantity (kg) *</label>
                <input
                  type="number"
                  name="quantity"
                  placeholder="Enter quantity in kg"
                  value={formData.quantity}
                  onChange={handleChange}
                  style={{ ...styles.input, backgroundColor: "#fff", color: "#111" }}
                  disabled={loading}
                  min="0.1"
                  step="0.1"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Pickup Location</label>

                <div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                    <input type="radio" checked={locationMode === "text"} onChange={() => setLocationMode("text")} /> Text
                  </label>
                  <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                    <input type="radio" checked={locationMode === "map"} onChange={() => setLocationMode("map")} /> Pick on map
                  </label>
                </div>

                {locationMode === "text" ? (
                  <div>
                    <input
                      type="text"
                      name="location"
                      placeholder="Enter address (or leave blank)"
                      value={formData.location}
                      onChange={handleChange}
                      style={{ ...styles.input, backgroundColor: "#fff", color: "#111" }}
                      disabled={loading}
                    />
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!formData.location) {
                            setError("Enter an address to center on map.");
                            return;
                          }
                          setError("");
                          await geocodeAddress(formData.location);
                        }}
                        style={{ ...styles.buttonSmall, backgroundColor: "#eef6ff", border: "1px solid #dfe", cursor: "pointer" }}
                      >
                        Geocode & preview on map
                      </button>
                      <div style={{ alignSelf: "center", color: "#666", fontSize: 13 }}>
                        {geocoding ? "Searching..." : markerPos ? `Selected: ${markerPos[0].toFixed(4)}, ${markerPos[1].toFixed(4)}` : ""}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ marginBottom: 8, color: "#666", fontSize: 13 }}>Click on the map to select pickup location</div>
                    <div style={{ height: 300, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <MapContainer
                        center={mapCenter ?? [20, 0]}
                        zoom={mapCenter ? 13 : 2}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <MapSetter setter={mapRef} />
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                        <ClickHandler />
                        {markerPos && (
                          <Marker position={markerPos} icon={defaultIcon}>
                            <Popup>Selected location</Popup>
                          </Marker>
                        )}
                      </MapContainer>
                    </div>

                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setMarkerPos(null);
                          setFormData((f) => ({ ...f, location: "" }));
                        }}
                        style={{ ...styles.buttonSmall, backgroundColor: "#f6f6f6" }}
                      >
                        Clear selection
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!navigator.geolocation) {
                            alert("Geolocation not supported by your browser.");
                            return;
                          }
                          navigator.geolocation.getCurrentPosition(
                            async (pos) => {
                              const lat = pos.coords.latitude;
                              const lon = pos.coords.longitude;
                              setMarkerPos([lat, lon]);
                              setMapCenter([lat, lon]);
                              const addr = await reverseGeocode(lat, lon);
                              if (addr) setFormData((f) => ({ ...f, location: addr }));
                              try {
                                mapRef.current?.setView([lat, lon], 15);
                              } catch {}
                            },
                            () => alert("Unable to access your location."),
                            { enableHighAccuracy: true }
                          );
                        }}
                        style={{ ...styles.buttonSmall, backgroundColor: "#eef6ff" }}
                      >
                        Use my location
                      </button>

                      <div style={{ alignSelf: "center", color: "#666", fontSize: 13 }}>
                        {markerPos ? `Selected: ${markerPos[0].toFixed(4)}, ${markerPos[1].toFixed(4)}` : "No location selected"}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Additional Notes</label>
                <textarea
                  name="description"
                  placeholder="Any additional information..."
                  value={formData.description}
                  onChange={handleChange}
                  style={{ ...styles.textarea, backgroundColor: "#fff", color: "#111" }}
                  disabled={loading}
                  rows={4}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Photo *</label>
                <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>Please upload a clear photo of the waste (required).</div>
                <input type="file" accept="image/*" onChange={handleFileChange} disabled={loading} required />
                {imagePreview && (
                  <div style={{ marginTop: 10 }}>
                    <img src={imagePreview} alt="preview" style={{ maxWidth: 180, borderRadius: 8, display: "block", marginBottom: 6 }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={handleRemoveImage} style={{ ...styles.buttonSmall, backgroundColor: "#e74c3c", color: "#fff" }}>Remove</button>
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

              <button type="submit" style={styles.submitButton} disabled={loading}>{loading ? "Submitting..." : "Submit Waste"}</button>
            </form>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.priceGuide}>
              <h4 style={styles.priceTitle}>Price Guide (per kg)</h4>
              <div style={styles.priceList}>
                <div style={styles.priceItem}><span>Plastic</span><span style={styles.priceValue}>Rs 30-50</span></div>
                <div style={styles.priceItem}><span>Paper</span><span style={styles.priceValue}>Rs 10-20</span></div>
                <div style={styles.priceItem}><span>Metal</span><span style={styles.priceValue}>Rs 60-100</span></div>
                <div style={styles.priceItem}><span>Glass</span><span style={styles.priceValue}>Rs 5-15</span></div>
                <div style={styles.priceItem}><span>Electronic</span><span style={styles.priceValue}>Rs 100-500</span></div>
              </div>
            </div>

            <h3 style={styles.cardTitle}>Quick Tips</h3>
            <div style={styles.tipsList}>
              <div style={styles.tipItem}><span style={styles.tipIcon}>✅</span><p style={styles.tipText}>Clean and separate waste by type</p></div>
              <div style={styles.tipItem}><span style={styles.tipIcon}>✅</span><p style={styles.tipText}>Remove labels from bottles</p></div>
              <div style={styles.tipItem}><span style={styles.tipIcon}>✅</span><p style={styles.tipText}>Flatten cardboard boxes</p></div>
              <div style={styles.tipItem}><span style={styles.tipIcon}>✅</span><p style={styles.tipText}>Accurate weight = Better pricing</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* styles (same as your existing styles, with map-specific additions) */
const styles: { [key: string]: React.CSSProperties } = {
  container: { display: "flex", minHeight: "calc(100vh - 72px)", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: "#f5f7fb" },
  sidebar: { width: "260px", backgroundColor: "#2c3e50", color: "white", display: "flex", flexDirection: "column", padding: "20px 0", boxShadow: "2px 0 10px rgba(0,0,0,0.1)" },
  logo: { padding: "0 20px 30px", borderBottom: "1px solid rgba(255,255,255,0.1)" },
  logoText: { margin: 0, fontSize: "24px", fontWeight: "600" },
  nav: { display: "flex", flexDirection: "column", gap: "5px", padding: "20px 10px", flex: 1 },
  navItem: { background: "transparent", border: "none", color: "white", padding: "14px 18px", textAlign: "left", cursor: "pointer", borderRadius: "8px", fontSize: "15px", transition: "all 0.3s ease", fontWeight: "500" },
  navItemActive: { backgroundColor: "#34495e" },
  navItemLogout: { background: "#e74c3c", border: "none", color: "white", padding: "14px 18px", textAlign: "left", cursor: "pointer", borderRadius: "8px", fontSize: "15px", marginTop: "auto", fontWeight: "600", transition: "all 0.3s ease" },
  main: { flex: 1, padding: "30px", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
  title: { margin: 0, fontSize: "32px", color: "#2c3e50", fontWeight: "700" },
  subtitle: { margin: "8px 0 0 0", color: "#7f8c8d", fontSize: "16px" },
  profileIcon: { width: "55px", height: "55px", borderRadius: "50%", backgroundColor: "#19fd0d", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "bold", boxShadow: "0 4px 12px rgba(25,253,13,0.3)" },
  contentGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" },
  formCard: { backgroundColor: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  infoCard: { backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  cardTitle: { margin: "0 0 15px 0", fontSize: "18px", color: "#2c3e50", fontWeight: "600" },
  errorBox: { backgroundColor: "#fee", color: "#c33", padding: "12px 15px", borderRadius: "8px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" },
  errorIcon: { fontSize: "18px" },
  successBox: { backgroundColor: "#d4edda", color: "#155724", padding: "12px 15px", borderRadius: "8px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: "500" },
  successIcon: { fontSize: "18px" },
  formGroup: { marginBottom: "18px" },
  label: { display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#2c3e50" },
  input: { width: "100%", padding: "12px 15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", outline: "none", transition: "border-color 0.3s ease", boxSizing: "border-box", backgroundColor: "#fff", color: "#111" },
  select: { width: "100%", padding: "12px 15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", outline: "none", transition: "border-color 0.3s ease", backgroundColor: "white", cursor: "pointer", boxSizing: "border-box", height: 44, lineHeight: "20px" },
  textarea: { width: "100%", padding: "12px 15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "15px", outline: "none", transition: "border-color 0.3s ease", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", resize: "vertical", boxSizing: "border-box", backgroundColor: "#fff", color: "#111" },
  submitButton: { width: "100%", padding: "14px 20px", backgroundColor: "#19fd0d", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "600", cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 4px 10px rgba(25,253,13,0.3)", marginTop: "10px" },
  tipsList: { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" },
  tipItem: { display: "flex", alignItems: "flex-start", gap: "10px" },
  tipIcon: { fontSize: "18px", marginTop: "2px", color: "#27ae60" },
  tipText: { margin: 0, fontSize: "14px", color: "#2c3e50", lineHeight: "1.5" },
  priceGuide: { backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "10px", marginBottom: "18px" },
  priceTitle: { margin: "0 0 12px 0", fontSize: "15px", color: "#2c3e50", fontWeight: "600" },
  priceList: { display: "flex", flexDirection: "column", gap: "8px" },
  priceItem: { display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#2c3e50" },
  priceValue: { fontWeight: "600", color: "#27ae60" },
  buttonSmall: { padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer" },
};