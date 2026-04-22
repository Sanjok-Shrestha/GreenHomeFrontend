// src/pages/PostWaste.tsx
import React, { useEffect, useRef, useState, useContext } from "react";
import type { AxiosProgressEvent } from "axios";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../App";
import Sidebar from "../components/Sidebar";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ── Design tokens ── */
const T = {
  green:         "#1a7a4a",
  greenDark:     "#135e38",
  greenSoft:     "#eaf7ef",
  greenBorder:   "rgba(26,122,74,0.18)",
  greenGlow:     "rgba(26,122,74,0.14)",
  amber:         "#b45309",
  amberSoft:     "#fef9ec",
  amberBorder:   "#f6d98a",
  danger:        "#c0392b",
  dangerSoft:    "#fdf2f0",
  dangerBorder:  "#f5c6c0",
  bg:            "#f4f5f0",
  surface:       "#ffffff",
  surface2:      "#f9faf6",
  surface3:      "#f0f2ec",
  border:        "rgba(0,0,0,0.07)",
  borderMid:     "rgba(0,0,0,0.11)",
  textPrimary:   "#1a2215",
  textSecondary: "#3d4a35",
  textMuted:     "#8a9482",
  font:          "'Sora', system-ui, sans-serif",
  mono:          "'DM Mono', monospace",
  rMd:           "10px",
  rLg:           "16px",
  rXl:           "22px",
  shadow:        "0 1px 3px rgba(0,0,0,.05), 0 4px 20px rgba(0,0,0,.05)",
};

/* ── Default Leaflet icon ── */
const defaultIcon = L.icon({
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  shadowSize:  [41, 41],
});

type FormState    = { wasteType: string; quantity: string; location: string; description: string };
type PricingItem  = { _id?: string; wasteType: string; pricePerKg: number };

const FALLBACK_PRICES: Record<string, number> = {
  plastic: 40, paper: 15, metal: 80, glass: 10, organic: 5, electronic: 200,
};
const WASTE_TYPES = [
  { value: "plastic",    label: "Plastic" },
  { value: "paper",      label: "Paper" },
  { value: "metal",      label: "Metal" },
  { value: "glass",      label: "Glass" },
  { value: "organic",    label: "Organic" },
  { value: "electronic", label: "Electronic" },
];
const TIPS = [
  "Clean and separate waste by type",
  "Remove labels from bottles",
  "Flatten cardboard boxes",
  "Accurate weight = better pricing",
];

/* ── Static style objects (referencing T tokens) ── */
const S: Record<string, React.CSSProperties> = {
  layout: {
    display: "flex", minHeight: "100vh", background: T.bg,
    fontFamily: T.font, color: T.textPrimary, WebkitFontSmoothing: "antialiased",
  },
  page: {
    flex: 1, minWidth: 0, maxWidth: 1100, margin: "0 auto", padding: "32px 28px 64px",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 32, gap: 16,
  },
  headerTitle: {
    margin: 0, fontSize: 28, fontWeight: 700, color: T.textPrimary,
    letterSpacing: "-0.5px", lineHeight: 1.15, marginBottom: 6,
  },
  headerSub: { margin: 0, fontSize: 14, color: T.textMuted, fontWeight: 400 },
  avatar: {
    width: 48, height: 48, borderRadius: "50%", background: T.green,
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 700, flexShrink: 0, border: `2px solid ${T.greenBorder}`,
  },
  grid: {
    display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "start",
  },
  card: {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: T.rXl, padding: 28, boxShadow: T.shadow,
  },
  cardTitle: {
    fontSize: 15, fontWeight: 600, color: T.textPrimary, letterSpacing: "-0.2px",
    marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${T.border}`,
  },
  alertError: {
    display: "flex", alignItems: "flex-start", gap: 10,
    padding: "12px 14px", borderRadius: T.rMd, fontSize: 13.5, lineHeight: 1.5,
    marginBottom: 18, background: T.dangerSoft, color: T.danger,
    border: `1px solid ${T.dangerBorder}`,
  },
  alertSuccess: {
    display: "flex", alignItems: "flex-start", gap: 10,
    padding: "12px 14px", borderRadius: T.rMd, fontSize: 13.5, lineHeight: 1.5,
    marginBottom: 18, background: T.greenSoft, color: T.greenDark,
    border: `1px solid ${T.greenBorder}`,
  },
  field: { marginBottom: 20 },
  label: {
    display: "block", fontSize: 13, fontWeight: 600,
    color: T.textSecondary, marginBottom: 7, letterSpacing: "0.02em",
  },
  req: { color: T.green, marginLeft: 2 },
  input: {
    width: "100%", padding: "11px 14px", border: `1px solid ${T.borderMid}`,
    borderRadius: T.rMd, fontSize: 14, fontFamily: T.font, color: T.textPrimary,
    background: T.surface, outline: "none", boxSizing: "border-box",
  },
  select: {
    width: "100%", padding: "11px 38px 11px 14px", border: `1px solid ${T.borderMid}`,
    borderRadius: T.rMd, fontSize: 14, fontFamily: T.font, color: T.textPrimary,
    background: `${T.surface} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a9482' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 12px center`,
    appearance: "none", WebkitAppearance: "none", outline: "none",
    cursor: "pointer", boxSizing: "border-box",
  },
  textarea: {
    width: "100%", padding: "11px 14px", border: `1px solid ${T.borderMid}`,
    borderRadius: T.rMd, fontSize: 14, fontFamily: T.font, color: T.textPrimary,
    background: T.surface, outline: "none", resize: "vertical",
    minHeight: 96, lineHeight: 1.55, boxSizing: "border-box",
  },
  locationToggle: { display: "flex", gap: 6, marginBottom: 10 },
  mapWrap: {
    borderRadius: T.rLg, overflow: "hidden",
    border: `1px solid ${T.border}`, height: 280,
  },
  mapActions: { display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" },
  mapHint: { fontSize: 12, color: T.textMuted, fontFamily: T.mono, marginLeft: "auto" },
  geocodeRow: { display: "flex", gap: 8, marginTop: 8, alignItems: "center" },
  geocodeHint: { fontSize: 12, color: T.textMuted, fontFamily: T.mono },
  uploadHint: { fontSize: 12.5, color: T.textMuted, marginBottom: 8 },
  fileInput: {
    width: "100%", padding: "10px 12px", border: `1px dashed ${T.borderMid}`,
    borderRadius: T.rMd, fontFamily: T.font, fontSize: 13, color: T.textMuted,
    background: T.surface2, cursor: "pointer", boxSizing: "border-box",
  },
  previewRow: { display: "flex", alignItems: "flex-start", gap: 12, marginTop: 12 },
  previewImg: {
    width: 100, height: 80, objectFit: "cover",
    borderRadius: T.rMd, border: `1px solid ${T.border}`, flexShrink: 0,
  },
  previewMeta: { display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 },
  previewSize: { fontSize: 12, fontFamily: T.mono, color: T.textMuted },
  progressWrap: { marginTop: 10 },
  progressBar: {
    width: "100%", height: 6, background: T.surface3, borderRadius: 6, overflow: "hidden",
  },
  progressLabel: { fontSize: 11, fontFamily: T.mono, color: T.textMuted, marginTop: 5 },
  btn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 6, height: 34, padding: "0 14px", borderRadius: T.rMd,
    border: `1px solid ${T.borderMid}`, background: T.surface2,
    fontFamily: T.font, fontSize: 13, fontWeight: 500,
    color: T.textSecondary, cursor: "pointer", whiteSpace: "nowrap",
  },
  btnDanger: {
    display: "inline-flex", alignItems: "center", height: 34, padding: "0 14px",
    borderRadius: T.rMd, border: `1px solid ${T.dangerBorder}`, background: T.dangerSoft,
    fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.danger, cursor: "pointer",
  },
  priceGuide: {
    background: T.surface2, border: `1px solid ${T.border}`,
    borderRadius: T.rLg, padding: 16, marginBottom: 20,
  },
  priceGuideTitle: {
    fontSize: 11, fontWeight: 600, textTransform: "uppercase",
    letterSpacing: "0.07em", color: T.textMuted, marginBottom: 12,
  },
  priceRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "7px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13.5,
  },
  priceLabel: { color: T.textSecondary, textTransform: "capitalize" },
  priceValue: { fontWeight: 600, color: T.green, fontFamily: T.mono, fontSize: 13 },
  priceError: {
    fontSize: 12.5, color: T.danger, background: T.dangerSoft,
    border: `1px solid ${T.dangerBorder}`, borderRadius: T.rMd,
    padding: "8px 10px", marginBottom: 10,
  },
  estimate: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: T.greenSoft, border: `1px solid ${T.greenBorder}`,
    borderRadius: T.rMd, padding: "10px 14px", marginTop: 14,
  },
  estimateLabel: { fontSize: 12, color: T.greenDark, fontWeight: 500 },
  estimateValue: {
    fontSize: 18, fontWeight: 700, color: T.green,
    fontFamily: T.mono, letterSpacing: "-0.3px",
  },
  tipsTitle: {
    fontSize: 11, fontWeight: 600, textTransform: "uppercase",
    letterSpacing: "0.07em", color: T.textMuted, marginBottom: 12,
  },
  tip: {
    display: "flex", alignItems: "flex-start", gap: 10,
    padding: "8px 0", borderBottom: `1px solid ${T.border}`,
    fontSize: 13, color: T.textSecondary, lineHeight: 1.5,
  },
  tipDot: {
    width: 18, height: 18, borderRadius: "50%", background: T.greenSoft,
    border: `1px solid ${T.greenBorder}`, display: "flex",
    alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
  },
  tipDotInner: { width: 6, height: 6, borderRadius: "50%", background: T.green },
};

/* ── Dynamic styles (depend on props / state) ── */
const D = {
  modeBtn: (active: boolean): React.CSSProperties => ({
    height: 30, padding: "0 14px", borderRadius: 20,
    border: `1px solid ${active ? T.green : T.borderMid}`,
    background: active ? T.green : T.surface2,
    fontFamily: T.font, fontSize: 12.5, fontWeight: 500,
    color: active ? "#fff" : T.textMuted, cursor: "pointer",
  }),
  progressFill: (pct: number): React.CSSProperties => ({
    height: "100%", width: `${pct}%`, background: T.green,
    borderRadius: 6, transition: "width 0.2s ease",
  }),
  btnSubmit: (disabled: boolean): React.CSSProperties => ({
    width: "100%", height: 48, fontSize: 15, fontWeight: 600,
    fontFamily: T.font, background: disabled ? T.surface3 : T.green,
    color: disabled ? T.textMuted : "#fff", border: "none",
    borderRadius: T.rLg, boxShadow: disabled ? "none" : `0 2px 10px ${T.greenGlow}`,
    cursor: disabled ? "not-allowed" : "pointer", marginTop: 6, opacity: disabled ? 0.6 : 1,
  }),
  priceRowLast: (): React.CSSProperties => ({ ...S.priceRow, borderBottom: "none" }),
  tipLast: (): React.CSSProperties => ({ ...S.tip, borderBottom: "none" }),
};

export default function PostWaste(): React.JSX.Element {
  const navigate = useNavigate();
  const { setAuthState } = useContext(AuthContext);

  const [user] = useState<any>(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  const [formData,       setFormData]        = useState<FormState>({ wasteType: "", quantity: "", location: "", description: "" });
  const [imageFile,      setImageFile]        = useState<File | null>(null);
  const [imagePreview,   setImagePreview]     = useState<string | null>(null);
  const [loading,        setLoading]          = useState(false);
  const [uploadProgress, setUploadProgress]   = useState<number | null>(null);
  const [error,          setError]            = useState("");
  const [success,        setSuccess]          = useState(false);
  const [estimatedPrice, setEstimatedPrice]   = useState<number | null>(null);
  const [pricing,        setPricing]          = useState<PricingItem[]>([]);
  const [pricingLoading, setPricingLoading]   = useState(true);
  const [pricingError,   setPricingError]     = useState<string | null>(null);
  const [locationMode,   setLocationMode]     = useState<"text" | "map">("text");
  const [mapCenter,      setMapCenter]        = useState<[number, number] | null>(null);
  const [markerPos,      setMarkerPos]        = useState<[number, number] | null>(null);
  const [geocoding,      setGeocoding]        = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Use import.meta.env (Vite) or a window fallback; avoids TypeScript needing Node types.
  const MAX_QTY = Number(
    (typeof (import.meta as any) !== "undefined" && (import.meta as any).env && (import.meta as any).env.VITE_MAX_WASTE_QTY)
      ?? (window as any).__MAX_WASTE_QTY__
      ?? 10000
  );

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => { return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }; }, [imagePreview]);

  useEffect(() => {
    if (!("geolocation" in navigator)) { setMapCenter([20, 0]); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => setMapCenter([p.coords.latitude, p.coords.longitude]),
      ()  => setMapCenter([20, 0]),
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    let poll: number | undefined;
    async function load() {
      if (!mounted) return;
      setPricingLoading(true); setPricingError(null);
      try {
        const res  = await api.get("/pricing").catch(() => null);
        const data = res?.data ? (Array.isArray(res.data) ? res.data : (res.data.data ?? [])) : [];
        if (mounted) { setPricing(data); setPricingError(null); }
      } catch { if (mounted) setPricingError("Failed to load price guide"); }
      finally   { if (mounted) setPricingLoading(false); }
    }
    load();
    poll = window.setInterval(load, 20000);
    const onStorage = (e: StorageEvent) => { if (e.key === "pricing:updated") load(); };
    window.addEventListener("storage", onStorage);
    return () => { mounted = false; if (poll) clearInterval(poll); window.removeEventListener("storage", onStorage); };
  }, []);

  // normalize quantity input: transform commas to dots and trim, strip trailing 'kg'
  const normalizeQuantityString = (raw: string) => (typeof raw === "string" ? raw.trim().replace(/kg$/i, "").replace(/,/g, ".").trim() : "");

  useEffect(() => {
    const wt = formData.wasteType.trim().toLowerCase();
    const qStr = normalizeQuantityString(formData.quantity);
    const qn = Number(qStr);
    if (!wt || !qn || Number.isNaN(qn) || qn <= 0) { setEstimatedPrice(null); return; }
    const p          = pricing.find((x) => x.wasteType.trim().toLowerCase() === wt);
    const pricePerKg = p ? Number((p as any).pricePerKg || (p as any).price_per_kg || 0) : (FALLBACK_PRICES[wt] ?? 0);
    setEstimatedPrice(pricePerKg ? Math.round(pricePerKg * qn) : null);
  }, [formData.wasteType, formData.quantity, pricing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as any;
    if (name === "quantity") {
      const sanitized = String(value).replace(/[^\d.,+\-eE]/g, "");
      setFormData((prev) => ({ ...prev, quantity: sanitized }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) { setImageFile(null); if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(null); return; }
    if (!file.type.startsWith("image/")) { setError("Please upload an image file (jpg, png, etc.)"); return; }
    if (file.size > 5 * 1024 * 1024)    { setError("Image too large (max 5 MB)."); return; }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file); setImagePreview(URL.createObjectURL(file)); setError("");
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null); setImageFile(null);
  };

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
      const json = await res.json();
      return json?.display_name ?? "";
    } catch { return ""; }
  };

  const geocodeAddress = async (address: string) => {
    setGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      const arr = await res.json();
      if (Array.isArray(arr) && arr[0]) {
        const lat = Number(arr[0].lat), lon = Number(arr[0].lon);
        setMapCenter([lat, lon]); setMarkerPos([lat, lon]);
        setFormData((f) => ({ ...f, location: arr[0].display_name ?? address }));
        mapRef.current?.setView([lat, lon], 15);
      }
    } catch {}
    finally { setGeocoding(false); }
  };

  function ClickHandler() {
    useMapEvents({
      click: async ({ latlng: { lat, lng } }) => {
        setMarkerPos([lat, lng]);
        const addr = await reverseGeocode(lat, lng);
        if (addr) setFormData((f) => ({ ...f, location: addr }));
      },
    });
    return null;
  }

  function MapSetter({ setter }: { setter: React.MutableRefObject<L.Map | null> }) {
    const map = useMap();
    useEffect(() => { setter.current = map; }, [map, setter]);
    return null;
  }

  async function resolveCreatedId(res: any): Promise<string | null> {
    const candidates = [res?.data?.createdId, res?.data?.waste?._id, res?.data?.waste?.id, res?.data?._id, res?.data?.id, res?.data?.data?.waste?._id, res?.data?.data?._id, res?.data?.data?.id];
    for (const c of candidates) if (c) return String(c);
    const loc = res?.headers?.location as string | undefined;
    if (loc) { const parts = loc.split("/").filter(Boolean); if (parts.at(-1)) return parts.at(-1)!; }
    return null;
  }

  async function findMostRecentPostId(): Promise<string | null> {
    try {
      const r   = await api.get("/waste/my-posts").catch(() => null);
      const arr = Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : [];
      if (!arr.length) return null;
      return arr.reduce((a: any, b: any) => (new Date(a.createdAt) > new Date(b.createdAt) ? a : b))._id ?? null;
    } catch { return null; }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.wasteType || !formData.quantity) { setError("Please fill in all required fields."); return; }
    if (!imageFile)                                 { setError("Please upload a photo of the waste (required)."); return; }

    const normalized = normalizeQuantityString(formData.quantity);
    const validNumberRegex = /^\s*[+-]?\d+(\.\d+)?\s*$/;
    if (!validNumberRegex.test(normalized)) {
      setError("Quantity must be a positive number (use digits and a dot for decimals).");
      return;
    }
    const qty = Number(normalized);
    if (Number.isNaN(qty)) { setError("Quantity must be a valid number."); return; }

    if (qty <= 0) { setError("Quantity must be greater than zero."); return; }
    if (qty > MAX_QTY) { setError(`Quantity exceeds the maximum allowed limit (${MAX_QTY.toLocaleString()} kg).`); return; }
    if (qty > 1e7) { setError("Quantity is unreasonably large."); return; }

    setLoading(true); setUploadProgress(null);
    try {
      const data = new FormData();
      data.append("wasteType",   formData.wasteType);
      data.append("quantity",    String(qty));
      data.append("location",    formData.location);
      data.append("description", formData.description);
      data.append("image",       imageFile as Blob);
      if (markerPos) { data.append("lat", String(markerPos[0])); data.append("lng", String(markerPos[1])); }

      // IMPORTANT: do NOT set Content-Type manually — axios will set with boundary.
      const res = await api.post("/waste/post", data, {
        onUploadProgress: (ev: AxiosProgressEvent) => {
          const { loaded, total } = ev as any;
          if (typeof loaded === "number" && total > 0)
            setUploadProgress(Math.round((loaded * 100) / total));
        },
      });

      const estimated = res?.data?.estimatedPrice ?? res?.data?.estimated_price;
      if (typeof estimated === "number") setEstimatedPrice(estimated);
      setSuccess(true);

      let createdId = await resolveCreatedId(res);
      if (!createdId) createdId = await findMostRecentPostId();

      const goSchedule = (id?: string | null) => {
        const url = id ? `/schedule-pickup?item=${encodeURIComponent(id)}` : "/schedule-pickup";
        try { navigate(url, id ? { state: { createdId: id } } : undefined); } catch {}
        setTimeout(() => { if (!window.location.pathname.startsWith("/schedule-pickup")) window.location.href = url; }, 300);
      };
      goSchedule(createdId);

      setTimeout(() => {
        setFormData({ wasteType: "", quantity: "", location: "", description: "" });
        setImageFile(null);
        if (imagePreview) { URL.revokeObjectURL(imagePreview); setImagePreview(null); }
        setSuccess(false); setEstimatedPrice(null); setUploadProgress(null); setMarkerPos(null);
      }, 1500);

    } catch (err: any) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message || err.message || "Failed to post waste.";
      if (status === 401) {
        ["token", "accessToken", "user", "role"].forEach((k) => localStorage.removeItem(k));
        try { setAuthState({ isAuth: false, roleState: "" }); } catch {}
        setError("Not authorised — please login again.");
        setTimeout(() => navigate("/login", { replace: true }), 900);
      } else { setError(message); }
    } finally { setLoading(false); }
  };

  // Ensure fallback rows conform to PricingItem so TS knows _id may be present (even undefined)
  const pricingRows: PricingItem[] = pricing.length > 0
    ? pricing
    : WASTE_TYPES.map(({ value }) => ({
        _id: undefined,
        wasteType: value,
        pricePerKg: FALLBACK_PRICES[value] ?? 0,
      }));

  /* ── Render ── */
  return (
    <div style={S.layout}>
      <Sidebar />

      <div style={S.page}>

        {/* Header */}
        <div style={S.header}>
          <div>
            <h1 style={S.headerTitle}>Post Waste Collection</h1>
            <p style={S.headerSub}>Submit recyclable waste for collection and pin your pickup location on the map.</p>
          </div>
          <div style={S.avatar}>{user?.name?.charAt(0).toUpperCase() ?? "U"}</div>
        </div>

        <div style={S.grid}>

          {/* ── Form card ── */}
          <div style={S.card}>
            <div style={S.cardTitle}>Waste details</div>

            {error   && <div style={S.alertError}>{error}</div>}
            {success && (
              <div style={S.alertSuccess}>
                Waste posted successfully!{estimatedPrice ? ` Estimated value: Rs ${estimatedPrice}` : ""}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* Waste type */}
              <div style={S.field}>
                <label style={S.label}>Waste type <span style={S.req}>*</span></label>
                <select name="wasteType" value={formData.wasteType} onChange={handleChange} style={S.select} required>
                  <option value="" disabled>Select waste type…</option>
                  {WASTE_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div style={S.field}>
                <label style={S.label}>Quantity (kg) <span style={S.req}>*</span></label>
                <input
                  type="text"
                  name="quantity"
                  placeholder="e.g. 2.5"
                  value={formData.quantity}
                  onChange={handleChange}
                  style={S.input}
                  inputMode="decimal"
                  pattern="[0-9]*([.,][0-9]+)?"
                  required
                />
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>
                  Use digits and a dot for decimals (e.g. 2.5). Commas will be converted to dots.
                </div>
              </div>

              {/* Location */}
              <div style={S.field}>
                <label style={S.label}>Pickup location</label>

                <div style={S.locationToggle}>
                  <button type="button" style={D.modeBtn(locationMode === "text")} onClick={() => setLocationMode("text")}>
                    Text address
                  </button>
                  <button type="button" style={D.modeBtn(locationMode === "map")} onClick={() => setLocationMode("map")}>
                    Pick on map
                  </button>
                </div>

                {locationMode === "text" ? (
                  <>
                    <input
                      type="text" name="location" placeholder="Street address, landmark…"
                      value={formData.location} onChange={handleChange} style={S.input}
                    />
                    <div style={S.geocodeRow}>
                      <button
                        type="button" style={S.btn}
                        onClick={async () => {
                          if (!formData.location) { setError("Enter an address to preview on map."); return; }
                          setError(""); await geocodeAddress(formData.location);
                        }}
                      >
                        {geocoding ? "Searching…" : "Preview on map"}
                      </button>
                      {markerPos && (
                        <span style={S.geocodeHint}>{markerPos[0].toFixed(4)}, {markerPos[1].toFixed(4)}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={S.mapWrap}>
                      <MapContainer center={mapCenter ?? [20, 0]} zoom={mapCenter ? 13 : 2} style={{ height: "100%", width: "100%" }}>
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
                    <div style={S.mapActions}>
                      <button
                        type="button" style={S.btn}
                        onClick={() =>
                          navigator.geolocation?.getCurrentPosition(
                            async ({ coords: { latitude: lat, longitude: lng } }) => {
                              setMarkerPos([lat, lng]); setMapCenter([lat, lng]);
                              const addr = await reverseGeocode(lat, lng);
                              if (addr) setFormData((f) => ({ ...f, location: addr }));
                              mapRef.current?.setView([lat, lng], 15);
                            },
                            () => setError("Unable to access your location.")
                          )
                        }
                      >
                        Use my location
                      </button>
                      <button
                        type="button" style={S.btn}
                        onClick={() => { setMarkerPos(null); setFormData((f) => ({ ...f, location: "" })); }}
                      >
                        Clear
                      </button>
                      <span style={S.mapHint}>
                        {markerPos
                          ? `${markerPos[0].toFixed(4)}, ${markerPos[1].toFixed(4)}`
                          : "Tap the map to drop a pin"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Notes */}
              <div style={S.field}>
                <label style={S.label}>Additional notes</label>
                <textarea
                  name="description" placeholder="Access instructions, special handling notes…"
                  value={formData.description} onChange={handleChange}
                  style={S.textarea} rows={3}
                />
              </div>

              {/* Photo */}
              <div style={S.field}>
                <label style={S.label}>Photo <span style={S.req}>*</span></label>
                <p style={S.uploadHint}>Upload a clear photo of the waste item (jpg, png — max 5 MB).</p>
                <input type="file" accept="image/*" onChange={handleFileChange} style={S.fileInput} required />

                {imagePreview && (
                  <div style={S.previewRow}>
                    <img src={imagePreview} alt="Waste preview" style={S.previewImg} />
                    <div style={S.previewMeta}>
                      <span style={S.previewSize}>{Math.round((imageFile?.size ?? 0) / 1024)} KB</span>
                      <button type="button" style={S.btnDanger} onClick={handleRemoveImage}>Remove</button>
                    </div>
                  </div>
                )}

                {uploadProgress != null && (
                  <div style={S.progressWrap}>
                    <div style={S.progressBar}>
                      <div style={D.progressFill(uploadProgress)} />
                    </div>
                    <div style={S.progressLabel}>{uploadProgress}% uploaded</div>
                  </div>
                )}
              </div>

              <button type="submit" style={D.btnSubmit(loading)} disabled={loading}>
                {loading ? "Submitting…" : "Submit waste"}
              </button>
            </form>
          </div>

          {/* ── Sidebar card ── */}
          <div style={S.card}>

            {/* Price guide */}
            <div style={S.priceGuide}>
              <div style={S.priceGuideTitle}>Price guide · per kg</div>

              {pricingError && <div style={S.priceError}>{pricingError}</div>}

              {pricingLoading ? (
                <div style={{ fontSize: 13, color: T.textMuted, padding: "8px 0" }}>Loading prices…</div>
              ) : (
                pricingRows.map((p, i) => (
                  <div
                    key={p._id ?? p.wasteType}
                    style={i === pricingRows.length - 1 ? D.priceRowLast() : S.priceRow}
                  >
                    <span style={S.priceLabel}>{p.wasteType}</span>
                    <span style={S.priceValue}>Rs {p.pricePerKg}</span>
                  </div>
                ))
              )}

              <div style={{ marginTop: 12 }}>
                <button
                  type="button" style={S.btn}
                  onClick={() => {
                    window.localStorage.setItem("pricing:updated", String(Date.now()));
                    api.get("/pricing")
                      .then((r) => setPricing(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
                      .catch(() => {});
                  }}
                >
                  Refresh prices
                </button>
              </div>
            </div>

            {/* Live estimate */}
            {estimatedPrice != null && (
              <div style={S.estimate}>
                <span style={S.estimateLabel}>Estimated value</span>
                <span style={S.estimateValue}>Rs {estimatedPrice}</span>
              </div>
            )}

            {/* Tips */}
            <div style={{ marginTop: estimatedPrice != null ? 20 : 0 }}>
              <div style={S.tipsTitle}>Preparation tips</div>
              {TIPS.map((tip, i) => (
                <div key={tip} style={i === TIPS.length - 1 ? D.tipLast() : S.tip}>
                  <span style={S.tipDot}><span style={S.tipDotInner} /></span>
                  {tip}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}