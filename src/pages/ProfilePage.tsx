/**
 * ProfilePage — Waste collection platform (with sidebar and reduced gutter)
 *
 * Notes:
 * - I preserved your original GLOBAL_CSS unchanged.
 * - Sidebar is added via inline styles only.
 * - The pp-wrap element has an inline style marginLeft: 12 and maxWidth calc to reduce empty area.
 *
 * Save as: src/pages/ProfilePage.tsx
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios, { AxiosError, type AxiosInstance } from "axios";
import { useNavigate, NavLink } from "react-router-dom";
import api from "../api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

type Vehicle = {
  make?: string;
  model?: string;
  plate?: string;
};

type User = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  points?: number;
  createdAt?: string;
  avatarUrl?: string;
  bio?: string;
  address?: Address;
  social?: { facebook?: string; instagram?: string; twitter?: string };
  bankAccount?: string;
  vehicle?: Vehicle;
  receiveEmails?: boolean;
  receiveSMS?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// API client — isolated instance, never mutates axios.defaults
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE =
  (typeof window !== "undefined" && (window as any).__API_BASE__) ||
  "http://localhost:5000";

function createApiClient(): AxiosInstance {
  const instance = axios.create({ baseURL: API_BASE });
  instance.interceptors.request.use((config) => {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  });
  return instance;
}

const localApi = api || createApiClient();

// ─────────────────────────────────────────────────────────────────────────────
// Global styles — unchanged from original (kept exactly)
// ─────────────────────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --forest:       #1a3a2a;
    --forest-mid:   #2d5a3d;
    --forest-light: #3d7a52;
    --sage:         #8aab94;
    --sage-light:   #b8d4be;
    --cream:        #f5f0e8;
    --cream-dark:   #ede7d9;
    --parchment:    #faf7f2;
    --sienna:       #c4622d;
    --sienna-light: #e8956a;
    --text-primary:   #1a2a1e;
    --text-secondary: #4a6355;
    --text-muted:     #8aab94;
    --border:         rgba(26,58,42,0.11);
    --border-strong:  rgba(26,58,42,0.2);
    --shadow-sm: 0 1px 3px rgba(26,58,42,0.08);
    --shadow-md: 0 4px 18px rgba(26,58,42,0.10), 0 1px 4px rgba(26,58,42,0.06);
    --shadow-lg: 0 12px 40px rgba(26,58,42,0.14);
    --r-sm: 8px;
    --r-md: 12px;
    --r-lg: 18px;
    --r-xl: 22px;
    --font-display: 'Fraunces', Georgia, serif;
    --font-body:    'DM Sans', system-ui, sans-serif;
    --ease: cubic-bezier(0.4,0,0.2,1);
  }

  .pp * { box-sizing: border-box; margin: 0; padding: 0; }
  .pp { font-family: var(--font-body); color: var(--text-primary); line-height: 1.5; }

  @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn    { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
  @keyframes toastIn  { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }

  /* ── Page ── */
  .pp-page {
    min-height: 100vh;
    background: var(--parchment);
    padding: 20px 16px 64px;
  }
  .pp-wrap {
    max-width: 920px;
    margin: 0 auto;
    animation: fadeUp 0.28s var(--ease) both;
  }

  /* ── Card ── */
  .pp-card {
    background: #fff;
    border-radius: var(--r-xl);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    animation: popIn 0.26s var(--ease) both;
  }

  /* ── Hero ── */
  .pp-hero {
    background: var(--forest);
    padding: 26px 22px 20px;
    position: relative;
    overflow: hidden;
  }
  .pp-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 55% 90% at 85% -10%, rgba(61,122,82,0.45) 0%, transparent 65%),
      radial-gradient(ellipse 40% 60% at 10% 110%, rgba(26,58,42,0.6) 0%, transparent 60%);
    pointer-events: none;
  }
  .pp-hero-inner {
    position: relative;
    display: flex;
    gap: 18px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .pp-avatar {
    width: 82px; height: 82px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--forest-mid);
    border: 2.5px solid rgba(255,255,255,0.16);
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 18px rgba(0,0,0,0.28);
  }
  .pp-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pp-avatar-initials {
    font-family: var(--font-display);
    font-size: 26px; font-weight: 700;
    color: var(--sage-light);
    letter-spacing: -1px;
  }

  .pp-hero-meta { flex: 1; min-width: 170px; }
  .pp-name {
    font-family: var(--font-display);
    font-size: clamp(20px, 3.5vw, 28px);
    font-weight: 600; color: #fff;
    line-height: 1.15; letter-spacing: -0.3px;
    margin-bottom: 5px;
  }
  .pp-hero-sub {
    display: flex; align-items: center; gap: 6px;
    font-size: 12.5px; color: var(--sage-light);
    flex-wrap: wrap; margin-bottom: 10px;
    font-weight: 300;
  }
  .pp-role-badge {
    padding: 2px 9px; border-radius: 20px;
    font-size: 10.5px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.07em;
    background: rgba(138,171,148,0.2);
    color: var(--sage-light);
    border: 1px solid rgba(138,171,148,0.28);
  }
  .pp-bio {
    font-size: 13px; color: rgba(255,255,255,0.6);
    line-height: 1.6; font-weight: 300;
  }
  .pp-bio-edit {
    width: 100%; margin-top: 6px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: var(--r-sm);
    color: #fff; font-family: var(--font-body);
    font-size: 13px; padding: 8px 11px;
    resize: vertical; transition: border-color 0.18s var(--ease);
  }
  .pp-bio-edit:focus { outline: none; border-color: var(--sage); }
  .pp-bio-edit::placeholder { color: rgba(255,255,255,0.28); }

  .pp-points {
    background: rgba(196,98,45,0.16);
    border: 1px solid rgba(196,98,45,0.28);
    border-radius: var(--r-md);
    padding: 13px 18px; min-width: 84px;
    text-align: center; align-self: flex-start;
  }
  .pp-points-num {
    font-family: var(--font-display);
    font-size: 24px; font-weight: 700;
    color: var(--sienna-light); line-height: 1;
    letter-spacing: -1px;
  }
  .pp-points-label {
    font-size: 10px; text-transform: uppercase;
    letter-spacing: 0.1em; font-weight: 500;
    color: rgba(232,149,106,0.65); margin-top: 3px;
  }

  .pp-hero-row {
    position: relative;
    display: flex; gap: 8px;
    margin-top: 16px; flex-wrap: wrap;
    align-items: center;
  }
  .pp-hero-spacer { flex: 1; min-width: 8px; }

  /* ── Stat strip ── */
  .pp-stats {
    display: grid; grid-template-columns: repeat(3,1fr);
    background: var(--cream);
    border-bottom: 1px solid var(--border);
  }
  .pp-stat {
    padding: 13px 10px; text-align: center;
    border-right: 1px solid var(--border);
  }
  .pp-stat:last-child { border-right: none; }
  .pp-stat-val {
    font-family: var(--font-display);
    font-size: 19px; font-weight: 600;
    color: var(--forest); line-height: 1;
  }
  .pp-stat-label {
    font-size: 10.5px; color: var(--text-secondary);
    margin-top: 3px;
  }

  /* ── Section grid ── */
  .pp-sections {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
  .pp-section {
    padding: 20px;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .pp-section:nth-child(even)   { border-right: none; }
  .pp-section:nth-last-child(-n+2) { border-bottom: none; }

  @media (max-width: 560px) {
    .pp-sections { grid-template-columns: 1fr; }
    .pp-section { border-right: none; border-bottom: 1px solid var(--border); }
    .pp-section:last-child { border-bottom: none; }
    .pp-page { padding: 10px 10px 60px; }
    .pp-hero { padding: 18px 14px 16px; }
    .pp-name { font-size: 20px; }
    .pp-avatar { width: 66px; height: 66px; }
    .pp-avatar-initials { font-size: 21px; }
  }

  .pp-section-head {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 13px;
  }
  .pp-section-icon {
    width: 26px; height: 26px; border-radius: 7px;
    background: var(--cream);
    display: flex; align-items: center; justify-content: center;
    color: var(--forest-mid); flex-shrink: 0;
  }
  .pp-section-title {
    font-size: 10.5px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--text-secondary);
  }

  /* ── Info rows ── */
  .pp-info-row {
    display: flex; align-items: baseline; gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid rgba(26,58,42,0.05);
  }
  .pp-info-row:last-of-type { border-bottom: none; }
  .pp-info-label {
    font-size: 10.5px; color: var(--text-muted);
    min-width: 60px; font-weight: 500; flex-shrink: 0;
  }
  .pp-info-val {
    font-size: 13px; color: var(--text-primary);
    font-weight: 400; flex: 1; word-break: break-all;
  }
  .pp-info-action {
    font-size: 10.5px; color: var(--forest-light);
    background: none; border: none; cursor: pointer;
    padding: 1px 6px; border-radius: 4px; font-weight: 600;
    transition: background 0.15s;
  }
  .pp-info-action:hover { background: var(--cream); }

  /* ── Inputs ── */
  .pp-input {
    display: block; width: 100%;
    padding: 7px 10px; margin: 2px 0;
    border-radius: var(--r-sm);
    border: 1px solid var(--border-strong);
    font-family: var(--font-body); font-size: 13px;
    color: var(--text-primary);
    background: var(--parchment);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .pp-input:focus {
    outline: none;
    border-color: var(--forest-light);
    box-shadow: 0 0 0 3px rgba(61,122,82,0.1);
    background: #fff;
  }
  .pp-input::placeholder { color: var(--text-muted); }
  .pp-input-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }

  /* ── Toggle ── */
  .pp-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; padding: 3px 0; }
  .pp-toggle-track {
    width: 32px; height: 18px; border-radius: 9px;
    position: relative; flex-shrink: 0;
    transition: background 0.18s var(--ease);
  }
  .pp-toggle-track-on  { background: var(--forest-light); }
  .pp-toggle-track-off { background: var(--border-strong); }
  .pp-toggle-thumb {
    position: absolute; top: 2px; width: 14px; height: 14px;
    border-radius: 50%; background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.18);
    transition: left 0.18s var(--ease);
  }
  .pp-toggle-lbl { font-size: 12.5px; color: var(--text-secondary); }

  /* ── Notification prefs (edit) ── */
  .pp-notif { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); }
  .pp-notif-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); margin-bottom: 7px; }
  .pp-notif-row { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 8px; }
  .pp-push-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    width: 100%; padding: 7px 12px;
    font-family: var(--font-body); font-size: 12px; font-weight: 500;
    color: var(--text-secondary);
    background: transparent;
    border: 1px dashed var(--border-strong);
    border-radius: var(--r-sm);
    cursor: pointer; transition: all 0.15s;
  }
  .pp-push-btn:hover { background: var(--cream); border-style: solid; }
  .pp-push-btn-on { border-color: var(--forest-light); color: var(--forest-light); border-style: solid; }

  /* ── Pref chips (read) ── */
  .pp-prefs { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
  .pp-pref-chip {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 3px 8px; border-radius: 20px;
    font-size: 11px; font-weight: 500;
  }
  .pp-pref-on  { background: #dcfce7; color: #15803d; }
  .pp-pref-off { background: var(--cream-dark); color: var(--text-muted); }

  /* ── Social ── */
  .pp-social-link {
    display: block; font-size: 13px; font-weight: 500;
    color: var(--forest-light); text-decoration: none;
    padding: 2px 0; transition: color 0.14s;
  }
  .pp-social-link:hover { color: var(--forest); }

  /* ── Collector badge ── */
  .pp-collector-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 11px; border-radius: var(--r-sm);
    background: var(--cream); border: 1px solid var(--border);
    font-size: 12.5px; color: var(--text-secondary);
    margin-bottom: 10px;
  }

  /* ── Empty / muted ── */
  .pp-empty { font-size: 13px; color: var(--text-muted); font-style: italic; padding: 3px 0; }

  /* ── Buttons ── */
  .btn { border: none; cursor: pointer; font-family: var(--font-body); font-weight: 500;
    display: inline-flex; align-items: center; gap: 5px;
    white-space: nowrap; transition: all 0.16s var(--ease); }
  .btn:active { transform: scale(0.97); }

  /* Hero buttons */
  .btn-hero {
    background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.88);
    border: 1px solid rgba(255,255,255,0.18) !important;
    padding: 7px 13px; border-radius: var(--r-sm); font-size: 12.5px;
  }
  .btn-hero:hover { background: rgba(255,255,255,0.18); }
  .btn-hero-cta {
    background: var(--sienna); color: #fff;
    border: none !important;
    padding: 8px 16px; border-radius: var(--r-sm);
    font-size: 12.5px; font-weight: 600;
    box-shadow: 0 2px 10px rgba(196,98,45,0.38);
  }
  .btn-hero-cta:hover { background: #b05626; }
  .btn-hero-danger { color: #fca5a5 !important; border-color: rgba(252,165,165,0.3) !important; }
  .btn-hero-danger:hover { background: rgba(220,38,38,0.12) !important; }

  /* Body buttons */
  .btn-primary {
    background: var(--forest); color: #fff;
    padding: 9px 18px; border-radius: var(--r-sm);
    font-size: 13px; font-weight: 600;
  }
  .btn-primary:hover { background: var(--forest-mid); }
  .btn-ghost {
    background: transparent; color: var(--text-secondary);
    border: 1px solid var(--border-strong) !important;
    padding: 8px 14px; border-radius: var(--r-sm); font-size: 13px;
  }
  .btn-ghost:hover { background: var(--cream); }

  /* ── Skeleton ── */
  .skel {
    background: linear-gradient(90deg,#ece7db 25%,#ddd7cc 50%,#ece7db 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 5px;
  }

  /* ── Address ── */
  address.pp-address { font-style: normal; font-size: 13.5px; color: var(--text-primary); line-height: 1.75; }

  /* ── Toast ── */
  .pp-toast {
    position: fixed; right: 18px; bottom: 22px;
    background: var(--forest); color: #fff;
    padding: 10px 15px; border-radius: var(--r-md);
    font-size: 13px; font-weight: 500;
    box-shadow: var(--shadow-lg);
    display: flex; align-items: center; gap: 9px;
    animation: toastIn 0.2s var(--ease) both;
    z-index: 9999; max-width: 300px;
    border: 1px solid rgba(138,171,148,0.18);
  }
  .pp-toast-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--sage); flex-shrink: 0; }

  /* ── Error ── */
  .pp-error { text-align: center; padding: 52px 28px; }
  .pp-error-icon { font-size: 34px; margin-bottom: 10px; }
  .pp-error-msg { color: #c53030; font-size: 14px; font-weight: 500; margin-bottom: 18px; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar nav links (simple)
// ─────────────────────────────────────────────────────────────────────────────

const SIDEBAR_LINKS = [
  { to: "/", label: "Home", key: "home" },
  { to: "/post-waste", label: "Post waste", key: "post" },
  { to: "/collector/assigned", label: "Assigned Pickups", key: "assigned" },
  { to: "/rewards", label: "Rewards", key: "rewards" },
  { to: "/profile", label: "Profile", key: "profile" },
];

function iconFor(key: string) {
  switch (key) {
    case "home": return "🏠";
    case "post": return "➕";
    case "assigned": return "📦";
    case "rewards": return "🎁";
    case "profile": return "👤";
    default: return "•";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function maskBank(account?: string): string {
  if (!account) return "—";
  return `•••• ${account.slice(-4)}`;
}

function normalizeSocial(input: string): string {
  if (/^https?:\/\//i.test(input)) return input;
  if (input.startsWith("@")) return `https://twitter.com/${input.slice(1)}`;
  return `https://instagram.com/${input}`;
}

function displaySocial(href: string): string {
  try {
    const u = new URL(href);
    return u.hostname.replace("www.", "") + u.pathname;
  } catch {
    return href;
  }
}

function normalizeAvatarUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

function getInitials(name?: string): string {
  if (!name) return "U";
  return name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
}

// Fixed: return ArrayBuffer which is valid BufferSource for subscription
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output.buffer;
}

// ─────────────────────────────────────────────────────────────────────────────
// Small components (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="pp-toggle" onClick={() => onChange(!checked)}>
      <span className={`pp-toggle-track pp-toggle-track-${checked ? "on" : "off"}`}>
        <span className="pp-toggle-thumb" style={{ left: checked ? 16 : 2 }} />
      </span>
      <span className="pp-toggle-lbl">{label}</span>
    </label>
  );
}

function PrefChip({ label, on }: { label: string; on: boolean }) {
  return <span className={`pp-pref-chip pp-pref-${on ? "on" : "off"}`}>{on ? "✓" : "○"} {label}</span>;
}

function SectionHead({ icon, title }: { icon?: React.ReactNode; title: string }) {
  return (
    <div className="pp-section-head">
      {icon && <div className="pp-section-icon">{icon}</div>}
      <span className="pp-section-title">{title}</span>
    </div>
  );
}

function InfoRow({ label, value, action, onAction }: {
  label: string; value?: React.ReactNode;
  action?: string; onAction?: () => void;
}) {
  return (
    <div className="pp-info-row">
      <span className="pp-info-label">{label}</span>
      <span className="pp-info-val">{value || <span style={{ color: "var(--text-muted)" }}>—</span>}</span>
      {action && onAction && <button className="pp-info-action" onClick={onAction}>{action}</button>}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="pp-stat">
      <div className="pp-stat-val">{value}</div>
      <div className="pp-stat-label">{label}</div>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="pp-toast" role="status" aria-live="polite">
      <span className="pp-toast-dot" />
      {message}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="pp-card">
      <div className="pp-hero" style={{ minHeight: 160 }}>
        <div className="pp-hero-inner">
          <div className="pp-avatar skel" />
          <div style={{ flex: 1 }}>
            <div className="skel" style={{ width: 148, height: 24, marginBottom: 8 }} />
            <div className="skel" style={{ width: 94, height: 12, marginBottom: 10 }} />
            <div className="skel" style={{ width: "82%", height: 11 }} />
          </div>
        </div>
      </div>
      <div className="pp-stats">
        {[0, 1, 2].map(i => (
          <div key={i} className="pp-stat">
            <div className="skel" style={{ width: 32, height: 18, margin: "0 auto 6px" }} />
            <div className="skel" style={{ width: 58, height: 9, margin: "0 auto" }} />
          </div>
        ))}
      </div>
      <div style={{ padding: "14px 18px", display: "flex", gap: 8, borderBottom: "1px solid var(--border)" }}>
        {[70, 90, 70].map((w, i) => <div key={i} className="skel" style={{ width: w, height: 32, borderRadius: 8 }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ padding: 20, borderRight: i % 2 === 0 ? "1px solid var(--border)" : "none", borderBottom: "1px solid var(--border)" }}>
            <div className="skel" style={{ width: 72, height: 10, marginBottom: 12 }} />
            {[85, 68, 55].map((w, j) => <div key={j} className="skel" style={{ width: `${w}%`, height: 10, marginBottom: 7 }} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Push hook (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function usePushSubscription(userId?: string) {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [checkingPush, setCheckingPush] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setCheckingPush(true);
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            const sub = await reg.pushManager.getSubscription();
            if (sub && !cancelled) { setPushEnabled(true); return; }
          }
        }
        const res = await localApi.get("/api/users/push-subscription/exists");
        if (!cancelled && res.data?.exists) setPushEnabled(true);
      } catch { /* push optional */ } finally {
        if (!cancelled) setCheckingPush(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const enable = useCallback(async (toast: (m: string) => void) => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast("Push not supported"); return;
    }
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      if ((await Notification.requestPermission()) !== "granted") { toast("Permission denied"); return; }
      const res = await localApi.get("/api/notifications/vapidPublicKey");
      if (!res.data?.key) { toast("VAPID key unavailable"); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(res.data.key),
      });
      await localApi.post("/api/users/push-subscription", { subscription: sub });
      setPushEnabled(true); toast("Browser notifications enabled");
    } catch { toast("Failed to enable notifications"); }
  }, []);

  const disable = useCallback(async (toast: (m: string) => void) => {
    try {
      await localApi.delete("/api/users/push-subscription");
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) { const sub = await reg.pushManager.getSubscription(); if (sub) await sub.unsubscribe(); }
      setPushEnabled(false); toast("Browser notifications disabled");
    } catch { toast("Failed to disable notifications"); }
  }, []);

  return { pushEnabled, checkingPush, enable, disable };
}

// ──��──────────────────────────────────────────────────────────────────────────
// ProfilePage (main component) — sidebar added via inline styles only
// ─────────────────────────────────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(() => {
    try { const r = localStorage.getItem("user"); return r ? JSON.parse(r) : null; }
    catch { return null; }
  });
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string, ttl = 2800) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), ttl);
  }, []);

  const { pushEnabled, checkingPush, enable: enablePush, disable: disablePush } =
    usePushSubscription(user?.id);

  // ── Fetch profile ────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) { navigate("/login", { replace: true }); return; }

    const ctrl = new AbortController();
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await localApi.get<User>("/api/users/profile", { signal: ctrl.signal });
        if (res.data) {
          setUser(res.data); setDraft(res.data);
          try { localStorage.setItem("user", JSON.stringify(res.data)); } catch {}
        }
      } catch (err) {
        const any = err as any;
        if (axios.isCancel?.(err) || any?.code === "ERR_CANCELED") return;
        if ((err as AxiosError).response?.status === 401) {
          ["accessToken", "token", "user"].forEach(k => localStorage.removeItem(k));
          navigate("/login", { replace: true });
        } else {
          setError("Couldn't load your profile. Check your connection and try again.");
        }
      } finally { setLoading(false); }
    })();
    return () => ctrl.abort();
  }, [navigate]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const initials  = useMemo(() => getInitials(user?.name), [user?.name]);
  const avatarSrc = useMemo(() => user?.avatarUrl ? normalizeAvatarUrl(user.avatarUrl) : null, [user?.avatarUrl]);
  const joined    = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short" })
    : "—";

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleLogout  = () => {
    ["accessToken", "token", "user", "role"].forEach(k => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  };
  const handleCopy    = async (text?: string) => {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); showToast("Copied"); }
    catch { showToast("Copy failed"); }
  };
  const handleEdit    = () => { setDraft(user); setEditMode(true); };
  const handleCancel  = () => { setDraft(user); setEditMode(false); };
  const handleSave    = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await localApi.put<User>("/api/users/profile", {
        name: draft.name, phone: draft.phone, bio: draft.bio,
        social: draft.social, address: draft.address,
        receiveEmails: draft.receiveEmails, receiveSMS: draft.receiveSMS,
      });
      const updated = res.data ?? draft;
      setUser(updated); setDraft(updated); setEditMode(false);
      showToast("Profile saved");
      try { localStorage.setItem("user", JSON.stringify(updated)); } catch {}
    } catch { showToast("Save failed — please try again"); }
    finally { setSaving(false); }
  };

  const patchDraft   = (p: Partial<User>)                               => setDraft(d => ({ ...(d ?? {}), ...p }));
  const patchAddress = (p: Partial<Address>)                            => setDraft(d => ({ ...(d ?? {}), address: { ...(d?.address ?? {}), ...p } }));
  const patchSocial  = (p: Partial<NonNullable<User["social"]>>)        => setDraft(d => ({ ...(d ?? {}), social:  { ...(d?.social  ?? {}), ...p } }));

  // Sidebar user display
  const sidebarName = useMemo(() => {
    try { const raw = localStorage.getItem("user"); if (!raw) return "User"; const parsed = JSON.parse(raw); return parsed?.name ?? "User"; } catch { return "User"; }
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar inserted with inline styles only (no GLOBAL_CSS changes) */}
        <aside
          aria-label="Primary navigation"
          style={{
            width: 260,
            background: "linear-gradient(180deg,#16382f,#123023)",
            color: "#fff",
            padding: 16,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minHeight: "100vh",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 20 }}>♻️</div>
            <div>
              <div style={{ fontWeight: 800 }}>GreenHome</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>Community recycling</div>
            </div>
          </div>

          <nav aria-label="Sidebar" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SIDEBAR_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 8,
                  color: isActive ? "#fff" : "#e6eef0",
                  textDecoration: "none",
                  background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
                  fontWeight: isActive ? 700 : 400,
                })}
              >
                <span style={{ width: 20, textAlign: "center" }}>{iconFor(l.key)}</span>
                <span>{l.label}</span>
              </NavLink>
            ))}
          </nav>

          <div style={{ marginTop: "auto" }}>
            <div style={{ fontWeight: 700 }}>{sidebarName}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <NavLink to="/profile" style={{ color: "#fff", textDecoration: "none" }}>Profile</NavLink>
              <button onClick={handleLogout} className="btn" style={{ marginLeft: "auto", background: "#e74c3c", color: "#fff", border: "none" }}>Logout</button>
            </div>
          </div>
        </aside>

        {/* Main profile content */}
        <main style={{ flex: 1 }}>
          <div className="pp">
            <div className="pp-page">
              {/* Reduced gutter: inline marginLeft and constrained maxWidth so card uses more horizontal space */}
              <div
                className="pp-wrap"
                style={{
                  marginLeft: 12,
                  maxWidth: "calc(100% - 260px - 32px)", // 260 = sidebar width, 32px gutter
                }}
              >
                {loading ? <ProfileSkeleton /> : error ? (
                  <div className="pp-card pp-error">
                    <div className="pp-error-icon">🌿</div>
                    <div className="pp-error-msg">{error}</div>
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>
                  </div>
                ) : !user ? (
                  <div className="pp-card pp-error" style={{ color: "var(--text-muted)" }}>No profile data available.</div>
                ) : (

                  <div className="pp-card">

                    {/* ── Hero ── */}
                    <div className="pp-hero">
                      <div className="pp-hero-inner">
                        <div className="pp-avatar">
                          {avatarSrc
                            ? <img src={avatarSrc} alt={user.name} />
                            : <span className="pp-avatar-initials">{initials}</span>
                          }
                        </div>

                        <div className="pp-hero-meta">
                          <h1 className="pp-name">{user.name ?? "User"}</h1>
                          <div className="pp-hero-sub">
                            {user.role && <span className="pp-role-badge">{user.role}</span>}
                            <span>Joined {joined}</span>
                          </div>
                          {editMode ? (
                            <textarea
                              className="pp-bio-edit"
                              value={draft?.bio ?? ""}
                              onChange={e => patchDraft({ bio: e.target.value })}
                              placeholder="A short bio…"
                              rows={2}
                            />
                          ) : user.bio ? (
                            <p className="pp-bio">{user.bio}</p>
                          ) : null}
                        </div>

                        <div className="pp-points">
                          <div className="pp-points-num">{(user.points ?? 0).toLocaleString()}</div>
                          <div className="pp-points-label">points</div>
                        </div>
                      </div>

                      <div className="pp-hero-row">
                        <button className="btn btn-hero-cta" onClick={() => navigate("/post-waste")}>
                          <LeafIcon /> Post waste
                        </button>
                        <button className="btn btn-hero" onClick={() => navigate("/collector/assigned")}>Pickups</button>
                        <button className="btn btn-hero" onClick={() => navigate("/rewards")}>Rewards</button>

                        <span className="pp-hero-spacer" />

                        {editMode ? (
                          <>
                            <button className="btn btn-hero" onClick={handleCancel} disabled={saving}>Cancel</button>
                            <button className="btn btn-hero-cta" onClick={handleSave} disabled={saving}>
                              {saving ? "Saving…" : "Save"}
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-hero" onClick={handleEdit}><EditIcon /> Edit</button>
                            <button className="btn btn-hero btn-hero-danger" onClick={handleLogout}>Log out</button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── Stats ── */}
                    <div className="pp-stats">
                      <StatCell label="Assigned" value="—" />
                      <StatCell label="Completed (mo)" value="—" />
                      <StatCell label="Kg collected" value="—" />
                    </div>

                    {/* ── Sections ── */}
                    <div className="pp-sections">

                      {/* Contact */}
                      <section className="pp-section">
                        <SectionHead icon={<EmailIcon />} title="Contact" />
                        <InfoRow
                          label="Email"
                          value={editMode
                            ? <input className="pp-input" type="email" value={draft?.email ?? ""} onChange={e => patchDraft({ email: e.target.value })} />
                            : user.email}
                          action={!editMode && user.email ? "Copy" : undefined}
                          onAction={() => handleCopy(user.email)}
                        />
                        <InfoRow
                          label="Phone"
                          value={editMode
                            ? <input className="pp-input" type="tel" value={draft?.phone ?? ""} onChange={e => patchDraft({ phone: e.target.value })} />
                            : user.phone}
                          action={!editMode && user.phone ? "Call" : undefined}
                          onAction={() => user.phone && window.open(`tel:${user.phone}`)}
                        />

                        {editMode ? (
                          <div className="pp-notif">
                            <div className="pp-notif-title">Notifications</div>
                            <div className="pp-notif-row">
                              <Toggle label="Email" checked={Boolean(draft?.receiveEmails)} onChange={v => patchDraft({ receiveEmails: v })} />
                              <Toggle label="SMS"   checked={Boolean(draft?.receiveSMS)}    onChange={v => patchDraft({ receiveSMS: v })} />
                            </div>
                            <button
                              className={`pp-push-btn${pushEnabled ? " pp-push-btn-on" : ""}`}
                              onClick={() => pushEnabled ? disablePush(showToast) : enablePush(showToast)}
                              disabled={checkingPush}
                            >
                              <BellIcon />
                              {checkingPush ? "Checking…" : pushEnabled ? "Disable browser alerts" : "Enable browser alerts"}
                            </button>
                          </div>
                        ) : (
                          <div className="pp-prefs">
                            <PrefChip label="Email"   on={Boolean(user.receiveEmails)} />
                            <PrefChip label="SMS"     on={Boolean(user.receiveSMS)} />
                            <PrefChip label="Browser" on={pushEnabled} />
                          </div>
                        )}
                      </section>

                      {/* Address */}
                      <section className="pp-section">
                        <SectionHead icon={<PinIcon />} title="Address" />
                        {editMode ? (
                          <div>
                            <input className="pp-input" placeholder="Street address" value={draft?.address?.line1 ?? ""} onChange={e => patchAddress({ line1: e.target.value })} />
                            <input className="pp-input" placeholder="Line 2 (optional)" value={draft?.address?.line2 ?? ""} onChange={e => patchAddress({ line2: e.target.value })} />
                            <div className="pp-input-2col">
                              <input className="pp-input" placeholder="City" value={draft?.address?.city ?? ""} onChange={e => patchAddress({ city: e.target.value })} />
                              <input className="pp-input" placeholder="Postal code" value={draft?.address?.postalCode ?? ""} onChange={e => patchAddress({ postalCode: e.target.value })} />
                            </div>
                            <input className="pp-input" placeholder="Country" value={draft?.address?.country ?? ""} onChange={e => patchAddress({ country: e.target.value })} />
                          </div>
                        ) : (user.address?.line1 || user.address?.city) ? (
                          <address className="pp-address">
                            {user.address.line1 && <div>{user.address.line1}</div>}
                            {user.address.line2 && <div>{user.address.line2}</div>}
                            <div>{[user.address.city, user.address.state].filter(Boolean).join(", ")}</div>
                            <div>{[user.address.postalCode, user.address.country].filter(Boolean).join(" ")}</div>
                          </address>
                        ) : (
                          <p className="pp-empty">No address on file.</p>
                        )}
                      </section>

                      {/* Social */}
                      <section className="pp-section">
                        <SectionHead title="Social links" />
                        {editMode ? (
                          <div>
                            <input className="pp-input" placeholder="Instagram handle or URL" value={draft?.social?.instagram ?? ""} onChange={e => patchSocial({ instagram: e.target.value })} />
                            <input className="pp-input" placeholder="Twitter / X handle or URL" value={draft?.social?.twitter ?? ""} onChange={e => patchSocial({ twitter: e.target.value })} />
                            <input className="pp-input" placeholder="Facebook URL" value={draft?.social?.facebook ?? ""} onChange={e => patchSocial({ facebook: e.target.value })} />
                          </div>
                        ) : (user.social?.instagram || user.social?.twitter || user.social?.facebook) ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 2 }}>
                            {user.social.instagram && <a className="pp-social-link" href={normalizeSocial(user.social.instagram)} target="_blank" rel="noreferrer">{displaySocial(normalizeSocial(user.social.instagram))}</a>}
                            {user.social.twitter   && <a className="pp-social-link" href={normalizeSocial(user.social.twitter)}   target="_blank" rel="noreferrer">{displaySocial(normalizeSocial(user.social.twitter))}</a>}
                            {user.social.facebook  && <a className="pp-social-link" href={normalizeSocial(user.social.facebook)}  target="_blank" rel="noreferrer">{displaySocial(normalizeSocial(user.social.facebook))}</a>}
                          </div>
                        ) : <p className="pp-empty">No social links added.</p>}
                      </section>

                      {/* Collector info */}
                      <section className="pp-section">
                        <SectionHead icon={<TruckIcon />} title="Collector info" />
                        {user.role === "collector" ? (
                          <>
                            <div className="pp-collector-badge"><TruckIcon /> Active collector</div>
                            <InfoRow label="Bank" value={maskBank(user.bankAccount)} />
                            {user.vehicle && (
                              <InfoRow label="Vehicle" value={[user.vehicle.make, user.vehicle.model].filter(Boolean).join(" ") || "—"} />
                            )}
                            {user.vehicle?.plate && <InfoRow label="Plate" value={user.vehicle.plate} />}
                          </>
                        ) : <p className="pp-empty">Not a collector account.</p>}
                      </section>

                    </div>
                  </div>
                )}
              </div>

              {toast && <Toast message={toast} />}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ProfilePage;

/* ─────────────────────────────────────────────────────────────────────────────
   Icons (unchanged)
   ───────────────────────────────────────────────────────────────────────────── */

const EditIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 21v-3.6L15.6 4.8a1 1 0 0 1 1.4 0l2.2 2.2a1 1 0 0 1 0 1.4L6.6 21H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const EmailIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const PinIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/></svg>;
const TruckIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M1 3h15v13H1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="5.5" cy="18.5" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="18.5" cy="18.5" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>;
const BellIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const LeafIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M17 8C8 10 5.9 16.17 3.82 21L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 3-11 3 2-1 6-2 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;