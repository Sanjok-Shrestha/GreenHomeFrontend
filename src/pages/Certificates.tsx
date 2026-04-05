import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import Sidebar from "../components/Sidebar";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --bg:          #f4f5f7;
    --surface:     #ffffff;
    --surface-alt: #f9fafb;
    --border:      #e5e7eb;
    --border-hover:#c7cbd4;
    --text-primary:#111827;
    --text-secondary:#6b7280;
    --text-tertiary:#9ca3af;
    --accent:      #2563eb;
    --accent-hover:#1d4ed8;
    --accent-soft: #eff6ff;
    --danger:      #dc2626;
    --danger-soft: #fef2f2;
    --success:     #16a34a;
    --shadow-sm:   0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
    --shadow-md:   0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04);
    --shadow-lg:   0 20px 48px rgba(0,0,0,.12), 0 8px 16px rgba(0,0,0,.06);
    --radius-sm:   6px;
    --radius-md:   10px;
    --radius-lg:   14px;
    --font:        'DM Sans', system-ui, sans-serif;
    --font-mono:   'DM Mono', monospace;
    --transition:  150ms cubic-bezier(.4,0,.2,1);
  }

  /* ── Layout ── */
  .ct-layout {
    display: flex;
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--font);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
  }

  .ct-page {
    flex: 1;
    padding: 32px 36px;
    max-width: 1160px;
    animation: ct-fadein 280ms ease both;
  }

  @keyframes ct-fadein {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Top bar ── */
  .ct-topbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    gap: 16px;
  }

  .ct-topbar__title {
    margin: 0 0 4px;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: var(--text-primary);
  }

  .ct-topbar__sub {
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.5;
    max-width: 480px;
  }

  .ct-topbar__actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    align-items: center;
  }

  /* ── Controls bar ── */
  .ct-controls {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    align-items: center;
    flex-wrap: wrap;
  }

  .ct-search {
    padding: 9px 14px;
    border-radius: var(--radius-md);
    border: 1.5px solid var(--border);
    background: var(--surface);
    font-family: var(--font);
    font-size: 14px;
    color: var(--text-primary);
    min-width: 260px;
    transition: border-color var(--transition), box-shadow var(--transition);
    outline: none;
  }

  .ct-search::placeholder { color: var(--text-tertiary); }

  .ct-search:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(37,99,235,.12);
  }

  .ct-controls__right {
    margin-left: auto;
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .ct-controls__label {
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .ct-controls__select {
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--surface);
    font-family: var(--font);
    font-size: 14px;
    color: var(--text-primary);
    outline: none;
    cursor: pointer;
    transition: border-color var(--transition);
  }

  .ct-controls__select:focus {
    border-color: var(--accent);
  }

  /* ── Grid ── */
  .ct-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }

  /* ── Card ── */
  .ct-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 16px;
    box-shadow: var(--shadow-sm);
    transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
    cursor: default;
  }

  .ct-card:hover {
    border-color: var(--border-hover);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .ct-card__inner {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }

  .ct-card__thumb {
    width: 80px;
    height: 80px;
    flex-shrink: 0;
    background: var(--surface-alt);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .ct-card__thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }

  .ct-card__thumb-empty {
    text-align: center;
    color: var(--text-tertiary);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: .3px;
    text-transform: uppercase;
    line-height: 1.3;
    padding: 4px;
  }

  .ct-card__info {
    flex: 1;
    min-width: 0;
  }

  .ct-card__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.1px;
  }

  .ct-card__recipient {
    color: var(--text-secondary);
    font-size: 13px;
    margin-top: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ct-card__date {
    color: var(--text-tertiary);
    margin-top: 4px;
    font-size: 12px;
    font-family: var(--font-mono);
  }

  .ct-card__actions {
    margin-top: 10px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .ct-card__qr {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    padding-top: 2px;
  }

  .ct-card__qr img {
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    display: block;
  }

  /* ── Pagination ── */
  .ct-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }

  .ct-pagination__controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .ct-pagination__page {
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: 500;
    padding: 0 4px;
  }

  .ct-pagination__info {
    color: var(--text-tertiary);
    font-size: 13px;
  }

  /* ── Buttons ── */
  .ct-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: var(--radius-md);
    background: var(--accent);
    color: #fff;
    border: none;
    cursor: pointer;
    font-family: var(--font);
    font-size: 14px;
    font-weight: 500;
    letter-spacing: -0.1px;
    transition: background var(--transition), box-shadow var(--transition), transform var(--transition);
    outline: none;
  }

  .ct-btn:hover:not(:disabled) {
    background: var(--accent-hover);
    box-shadow: 0 2px 8px rgba(37,99,235,.30);
    transform: translateY(-1px);
  }

  .ct-btn:active:not(:disabled) { transform: translateY(0); }

  .ct-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .ct-btn-alt {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text-primary);
    border: 1.5px solid var(--border);
    cursor: pointer;
    font-family: var(--font);
    font-size: 14px;
    font-weight: 500;
    transition: border-color var(--transition), background var(--transition), transform var(--transition);
    outline: none;
  }

  .ct-btn-alt:hover:not(:disabled) {
    border-color: var(--border-hover);
    background: var(--surface-alt);
    transform: translateY(-1px);
  }

  .ct-btn-alt:active:not(:disabled) { transform: translateY(0); }

  .ct-btn-alt:disabled { opacity: 0.45; cursor: not-allowed; }

  /* Small action buttons */
  .ct-btn-sm {
    display: inline-flex;
    align-items: center;
    padding: 5px 10px;
    border-radius: var(--radius-sm);
    border: none;
    background: var(--text-primary);
    color: #fff;
    cursor: pointer;
    font-family: var(--font);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: .1px;
    transition: background var(--transition), transform var(--transition);
    outline: none;
    white-space: nowrap;
  }

  .ct-btn-sm:hover:not(:disabled) {
    background: #374151;
    transform: translateY(-1px);
  }

  .ct-btn-sm:active:not(:disabled) { transform: translateY(0); }

  .ct-btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }

  .ct-btn-sm-alt {
    display: inline-flex;
    align-items: center;
    padding: 5px 10px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    font-family: var(--font);
    font-size: 12px;
    font-weight: 500;
    transition: border-color var(--transition), color var(--transition), background var(--transition), transform var(--transition);
    outline: none;
    white-space: nowrap;
  }

  .ct-btn-sm-alt:hover:not(:disabled) {
    border-color: var(--border-hover);
    color: var(--text-primary);
    background: var(--surface-alt);
    transform: translateY(-1px);
  }

  .ct-btn-sm-alt:active:not(:disabled) { transform: translateY(0); }

  /* ── Status states ── */
  .ct-loading {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-secondary);
    font-size: 14px;
    padding: 48px 0;
    justify-content: center;
  }

  .ct-loading::before {
    content: '';
    width: 18px;
    height: 18px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: ct-spin 600ms linear infinite;
    flex-shrink: 0;
  }

  @keyframes ct-spin { to { transform: rotate(360deg); } }

  .ct-error {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--danger);
    font-size: 14px;
    background: var(--danger-soft);
    border: 1px solid #fecaca;
    border-radius: var(--radius-md);
    padding: 14px 16px;
  }

  .ct-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-tertiary);
    font-size: 14px;
  }

  /* ── Modal ── */
  .ct-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(17, 24, 39, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
    animation: ct-overlay-in 180ms ease both;
  }

  @keyframes ct-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .ct-modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    width: min(1000px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
    animation: ct-modal-in 220ms cubic-bezier(.34,1.2,.64,1) both;
    padding: 22px;
  }

  @keyframes ct-modal-in {
    from { opacity: 0; transform: scale(.96) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .ct-modal__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }

  .ct-modal__title {
    margin: 0;
    font-size: 17px;
    font-weight: 650;
    letter-spacing: -0.2px;
    color: var(--text-primary);
  }

  .ct-modal__header-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .ct-modal__body {
    margin-top: 18px;
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .ct-modal__preview {
    flex: 1;
    min-width: 0;
  }

  .ct-modal__preview-img {
    width: 100%;
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    display: block;
  }

  .ct-modal__preview-frame {
    width: 100%;
    height: 480px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .ct-modal__preview-fallback {
    padding: 24px;
    border-radius: var(--radius-md);
    background: var(--surface-alt);
    border: 1px solid var(--border);
  }

  .ct-modal__fallback-title {
    font-weight: 700;
    font-size: 16px;
  }

  .ct-modal__fallback-row {
    margin-top: 8px;
    font-size: 14px;
    color: var(--text-secondary);
  }

  .ct-modal__fallback-notes {
    margin-top: 14px;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.6;
  }

  /* ── Aside panel ── */
  .ct-aside {
    width: 264px;
    flex-shrink: 0;
  }

  .ct-aside__panel {
    background: var(--surface-alt);
    border: 1px solid var(--border);
    padding: 16px;
    border-radius: var(--radius-md);
  }

  .ct-aside__label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .6px;
    text-transform: uppercase;
    color: var(--text-tertiary);
    margin-bottom: 4px;
  }

  .ct-aside__value {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .ct-aside__row {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }

  .ct-aside__row > *:not(.ct-aside__label) {
    font-size: 14px;
    color: var(--text-secondary);
    margin-top: 3px;
  }

  .ct-aside__qr {
    margin-top: 10px;
    text-align: center;
  }

  .ct-aside__qr-img {
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    background: #fff;
    display: inline-block;
  }

  .ct-aside__verify-link {
    margin-top: 10px;
    font-size: 12px;
    font-family: var(--font-mono);
    word-break: break-all;
    color: var(--accent);
    line-height: 1.5;
  }

  .ct-aside__verify-link a {
    color: inherit;
    text-decoration: none;
  }

  .ct-aside__verify-link a:hover { text-decoration: underline; }

  .ct-aside__actions {
    margin-top: 12px;
    display: flex;
    gap: 8px;
  }

  /* ── Toast ── */
  .ct-toast {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 9999;
    animation: ct-toast-in 220ms cubic-bezier(.34,1.2,.64,1) both;
  }

  @keyframes ct-toast-in {
    from { opacity: 0; transform: translateY(12px) scale(.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .ct-toast__inner {
    padding: 11px 18px;
    border-radius: var(--radius-md);
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    font-family: var(--font);
    box-shadow: var(--shadow-md);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ct-toast__inner--info   { background: var(--text-primary); }
  .ct-toast__inner--danger { background: var(--danger); }

  /* ── Scrollbar ── */
  .ct-modal::-webkit-scrollbar { width: 6px; }
  .ct-modal::-webkit-scrollbar-track { background: transparent; }
  .ct-modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
`;

/* ============================================================
   TYPES
   ============================================================ */
type Certificate = {
  _id: string;
  title?: string;
  recipient?: string;
  issuedAt?: string;
  validUntil?: string | null;
  imageUrl?: string;
  pdfUrl?: string;
  verifyUrl?: string;
  notes?: string;
  // optional owner-like fields
  owner?: string | { _id?: string; name?: string };
  userId?: string;
  recipientId?: string;
  recipientEmail?: string;
  email?: string;
  createdBy?: string;
  [k: string]: any;
};

type Profile = {
  _id?: string;
  name?: string;
  email?: string;
  [k: string]: any;
};

const PAGE_SIZES = [8, 20, 50];

/* ============================================================
   COMPONENT
   ============================================================ */
export default function Certificates(): React.ReactElement {
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [selected, setSelected] = useState<Certificate | null>(null);
  const [toast, setToast] = useState<{ text: string; danger?: boolean } | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Strict ownership check: only show certificates that clearly belong to current profile.
  function certBelongsToProfile(cert: Certificate, prof: Profile | null) {
    if (!prof) return false;

    const profId = String(prof._id ?? "").trim().toLowerCase();
    const profName = String(prof.name ?? "").trim().toLowerCase();
    const profEmail = String(prof.email ?? "").trim().toLowerCase();

    const maybe = (v: any) => {
      if (v === undefined || v === null) return "";
      if (typeof v === "string") return v.trim().toLowerCase();
      if (typeof v === "object") {
        // owner could be object { _id, name }
        if (v._id) return String(v._id).trim().toLowerCase();
        if (v.name) return String(v.name).trim().toLowerCase();
        return JSON.stringify(v).trim().toLowerCase();
      }
      return String(v).trim().toLowerCase();
    };

    // ID-based exact checks
    if (profId) {
      if (maybe(cert.owner) === profId) return true;
      if (maybe(cert.userId) === profId) return true;
      if (maybe(cert.recipientId) === profId) return true;
      if (maybe(cert.createdBy) === profId) return true;
    }

    // Email-based exact checks
    if (profEmail) {
      if (maybe((cert as any).recipientEmail) === profEmail) return true;
      if (maybe((cert as any).email) === profEmail) return true;
    }

    // Name/title/recipient checks (strict-ish)
    if (profName) {
      if (maybe(cert.title) === profName) return true; // title equals account name
      if (maybe(cert.recipient) === profName) return true; // recipient equals account name

      // loose containment: if recipient or title contains the full profile name
      const recip = maybe(cert.recipient);
      if (recip && recip.includes(profName)) return true;
      const title = maybe(cert.title);
      if (title && title.includes(profName)) return true;
    }

    return false;
  }

  const fetchList = useCallback(async () => {
    // abort previous
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      // fetch profile first (strict behavior: only show certificates for this profile)
      let prof: Profile | null = null;
      try {
        const pRes = await api.get("/users/profile", { signal: controller.signal });
        prof = pRes.data?.data ?? pRes.data ?? null;
        setProfile(prof);
      } catch (pErr: any) {
        // If profile fetch fails (not authenticated), show none.
        console.warn("Failed to fetch profile; certificates will be filtered out:", pErr);
        setProfile(null);
        setItems([]);
        setLoading(false);
        return;
      }

      // fetch certificates (keep compatibility)
      const res = await api.get("/certificates", { signal: controller.signal });
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];

      // filter to only those that belong to the signed-in profile
      const owned = (Array.isArray(data) ? data : []).filter((c: Certificate) => certBelongsToProfile(c, prof));

      setItems(owned);
      setPage(1);
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.message === "canceled") return;
      console.error("Failed to load certificates", err);
      setError(err?.response?.data?.message || "Failed to load certificates");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
    return () => {
      abortRef.current?.abort();
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, [fetchList]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return items.slice();
    return items.filter((c) =>
      (c.title ?? "").toLowerCase().includes(ql) ||
      (c.recipient ?? "").toLowerCase().includes(ql) ||
      (c._id ?? "").toLowerCase().includes(ql)
    );
  }, [items, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const showToast = (text: string, danger = false, ttl = 3000) => {
    setToast({ text, danger });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), ttl);
  };

  async function handleDownload(cert: Certificate) {
    const fnameBase = `${(cert.recipient ?? "certificate").replace(/\s+/g, "_")}_${cert._id}`;
    const url = cert.pdfUrl ?? cert.imageUrl ?? null;

    if (url) {
      try {
        const resp = await fetch(url, { credentials: "include" });
        if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
        const blob = await resp.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        const type = blob.type || "";
        const ext = type.includes("pdf") ? "pdf" : type.startsWith("image/") ? type.split("/")[1] : "bin";
        a.download = `${fnameBase}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
        showToast("Download started");
        return;
      } catch (err) {
        console.warn("Direct fetch/download failed, falling back to open:", err);
        window.open(url, "_blank");
        showToast("Opened file in new tab (save manually)");
        return;
      }
    }

    const verify = cert.verifyUrl ?? `${window.location.origin}/certificates/${cert._id}`;
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(verify)}`;
    const a = document.createElement("a");
    a.href = qr;
    a.download = `${fnameBase}_qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast("Downloaded QR image (verification link)");
  }

  function handlePrint(cert: Certificate) {
    const w = window.open("", "_blank", "noopener");
    if (!w) {
      showToast("Unable to open print window (popup blocked)", true);
      return;
    }
    const verify = cert.verifyUrl ?? `${window.location.origin}/certificates/${cert._id}`;
    const html = `
      <html>
        <head>
          <title>Certificate - ${escapeHtml(cert.recipient ?? "Certificate")}</title>
          <style>
            body { font-family: system-ui, sans-serif; margin:0; padding:20px; background:#f6f7f9; }
            .card { max-width:900px; margin:20px auto; background:white; padding:28px; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.08); }
            h1 { margin:0 0 10px; font-size:24px; }
            .meta { color:#555; margin-top:8px; font-size:14px; }
            .qr { margin-top:18px; }
            .footer { margin-top:26px; font-size:12px; color:#666; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${escapeHtml(cert.title ?? "Certificate")}</h1>
            <div class="meta">Recipient: <strong>${escapeHtml(cert.recipient ?? "—")}</strong></div>
            <div class="meta">Issued: ${cert.issuedAt ? new Date(cert.issuedAt).toLocaleString() : "—"}</div>
            <div class="meta">Valid until: ${cert.validUntil ?? "—"}</div>
            <div style="margin-top:18px;">${escapeHtml(cert.notes ?? "")}</div>
            <div class="qr">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(verify)}" alt="QR code" width="240" height="240" />
            </div>
            <div class="footer">Verification: <a href="${encodeURI(verify)}" target="_blank" rel="noopener">${escapeHtml(verify)}</a></div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  async function handleCopyLink(cert: Certificate) {
    const verify = cert.verifyUrl ?? `${window.location.origin}/certificates/${cert._id}`;
    try {
      await navigator.clipboard.writeText(verify);
      showToast("Verification link copied");
    } catch {
      showToast("Copy failed — open and copy manually", true);
    }
  }

  function escapeHtml(str: string) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const verifyUrl = (cert: Certificate) => cert.verifyUrl ?? `${window.location.origin}/certificates/${cert._id}`;

  const qrSrc = (cert: Certificate, size = 200) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(verifyUrl(cert))}`;

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <>
      <style>{css}</style>

      <div className="ct-layout">
        <Sidebar />

        <div className="ct-page">
          {/* ── Top bar ── */}
          <div className="ct-topbar">
            <div>
              <h2 className="ct-topbar__title">Certificates</h2>
              <div className="ct-topbar__sub">
                List, view and download digital certificates. Each certificate includes a QR code for verification.
              </div>
            </div>

            <div className="ct-topbar__actions">
              <button className="ct-btn" onClick={fetchList} disabled={loading}>
                Refresh
              </button>
              <button
                className="ct-btn-alt"
                onClick={() => {
                  if (!filtered.length) {
                    alert("No certificates to export");
                    return;
                  }
                  const header = ["id", "title", "recipient", "issuedAt", "validUntil", "verifyUrl"];
                  const rowsCsv = filtered.map((c) =>
                    [c._id, c.title ?? "", c.recipient ?? "", c.issuedAt ?? "", c.validUntil ?? "", c.verifyUrl ?? ""]
                      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                      .join(",")
                  );
                  const csv = [header.join(","), ...rowsCsv].join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `certificates_${new Date().toISOString().slice(0, 10)}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* ── Controls ── */}
          <div className="ct-controls">
            <input
              className="ct-search"
              placeholder="Search title, recipient or ID…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
            <div className="ct-controls__right">
              <label className="ct-controls__label">Per page</label>
              <select
                className="ct-controls__select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="ct-loading">Loading certificates…</div>
          ) : error ? (
            <div className="ct-error">{error}</div>
          ) : pageItems.length === 0 ? (
            <div className="ct-empty">No certificates found.</div>
          ) : (
            <>
              <div className="ct-grid">
                {pageItems.map((c) => (
                  <div key={c._id} className="ct-card">
                    <div className="ct-card__inner">
                      <div className="ct-card__thumb">
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt="certificate" className="ct-card__thumb-img" />
                        ) : (
                          <div className="ct-card__thumb-empty">No
                            <br />
                            image
                          </div>
                        )}
                      </div>

                      <div className="ct-card__info">
                        <div className="ct-card__title">{c.title ?? "Certificate"}</div>
                        <div className="ct-card__recipient">{c.recipient ?? "—"}</div>
                        <div className="ct-card__date">{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : "—"}</div>
                        <div className="ct-card__actions">
                          <button className="ct-btn-sm" onClick={() => setSelected(c)}>
                            View
                          </button>
                          <button className="ct-btn-sm" onClick={() => handleDownload(c)}>
                            Download
                          </button>
                          <button className="ct-btn-sm" onClick={() => handlePrint(c)}>
                            Print
                          </button>
                          <button className="ct-btn-sm-alt" onClick={() => handleCopyLink(c)}>
                            Copy link
                          </button>
                        </div>
                      </div>

                      <div className="ct-card__qr">
                        <img src={qrSrc(c, 200)} alt="QR code" width={72} height={72} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ct-pagination">
                <div className="ct-pagination__controls">
                  <button className="ct-btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    ← Prev
                  </button>
                  <span className="ct-pagination__page">
                    {currentPage} / {pageCount}
                  </span>
                  <button className="ct-btn-sm" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={currentPage === pageCount}>
                    Next →
                  </button>
                </div>
                <div className="ct-pagination__info">
                  {pageItems.length} of {filtered.length} certificates
                </div>
              </div>
            </>
          )}

          {/* ── Modal ── */}
          {selected && (
            <div className="ct-modal-overlay" role="dialog" aria-modal="true">
              <div className="ct-modal">
                <div className="ct-modal__header">
                  <h3 className="ct-modal__title">{selected.title ?? "Certificate"}</h3>
                  <div className="ct-modal__header-actions">
                    <button className="ct-btn-sm" onClick={() => handleDownload(selected)}>
                      Download
                    </button>
                    <button className="ct-btn-sm" onClick={() => handlePrint(selected)}>
                      Print
                    </button>
                    <button className="ct-btn-alt" onClick={() => setSelected(null)}>
                      Close
                    </button>
                  </div>
                </div>

                <div className="ct-modal__body">
                  <div className="ct-modal__preview">
                    {selected.imageUrl ? (
                      <img src={selected.imageUrl} alt="certificate" className="ct-modal__preview-img" />
                    ) : selected.pdfUrl ? (
                      <iframe src={selected.pdfUrl} title="certificate" className="ct-modal__preview-frame" />
                    ) : (
                      <div className="ct-modal__preview-fallback">
                        <div className="ct-modal__fallback-title">{selected.title}</div>
                        <div className="ct-modal__fallback-row">Recipient: {selected.recipient}</div>
                        <div className="ct-modal__fallback-row">Issued: {selected.issuedAt ? new Date(selected.issuedAt).toLocaleDateString() : "—"}</div>
                        <div className="ct-modal__fallback-notes">{selected.notes}</div>
                      </div>
                    )}
                  </div>

                  <aside className="ct-aside">
                    <div className="ct-aside__panel">
                      <div className="ct-aside__label">Recipient</div>
                      <div className="ct-aside__value">{selected.recipient}</div>

                      <div className="ct-aside__row">
                        <div className="ct-aside__label">Issued</div>
                        <div>{selected.issuedAt ? new Date(selected.issuedAt).toLocaleString() : "—"}</div>
                      </div>

                      <div className="ct-aside__row">
                        <div className="ct-aside__label">Valid until</div>
                        <div>{selected.validUntil ?? "—"}</div>
                      </div>

                      <div className="ct-aside__row">
                        <div className="ct-aside__label">Verification QR</div>
                        <div className="ct-aside__qr">
                          <img src={qrSrc(selected, 240)} alt="QR code" width={200} height={200} className="ct-aside__qr-img" />
                        </div>
                        <div className="ct-aside__verify-link">
                          <a href={verifyUrl(selected)} target="_blank" rel="noopener noreferrer">
                            {verifyUrl(selected)}
                          </a>
                        </div>
                        <div className="ct-aside__actions">
                          <button className="ct-btn-sm-alt" onClick={() => handleCopyLink(selected)}>
                            Copy link
                          </button>
                          <button className="ct-btn-sm" onClick={() => handleDownload(selected)}>
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          )}

          {/* ── Toast ── */}
          {toast && (
            <div className="ct-toast" role="status" aria-live={toast.danger ? "assertive" : "polite"}>
              <div className={`ct-toast__inner ${toast.danger ? "ct-toast__inner--danger" : "ct-toast__inner--info"}`}>{toast.text}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}