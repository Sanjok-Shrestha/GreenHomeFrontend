// src/pages/ProfilePage.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import CollectorSidebar from "../components/CollectorSidebar";

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

  // Collector-specific stats
  assignedCount?: number;
  completedThisMonth?: number;
  kgCollected?: number;

  // User-specific stats
  postCount?: number;
  rewards?: number;
};
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
    --parchment:    #f7f4ef;
    --sienna:       #c4622d;
    --sienna-light: #e8956a;
    --text-primary:   #1a2a1e;
    --text-secondary: #4a6355;
    --text-muted:     #8aab94;
    --border:         rgba(26,58,42,0.09);
    --border-strong:  rgba(26,58,42,0.18);
    --r-sm: 8px;
    --r-md: 12px;
    --r-lg: 16px;
    --r-xl: 20px;
    --font-display: 'Fraunces', Georgia, serif;
    --font-body:    'DM Sans', system-ui, sans-serif;
    --ease: cubic-bezier(0.4,0,0.2,1);
  }

  .pp * { box-sizing: border-box; margin: 0; padding: 0; }
  .pp { font-family: var(--font-body); color: var(--text-primary); line-height: 1.5; }

  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn   { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
  @keyframes toastIn { from{opacity:0;transform:translateX(14px)} to{opacity:1;transform:translateX(0)} }

  /* ── Page ── */
  .pp-page {
    min-height: 100vh;
    background:white;
    padding: 28px 20px 72px;
  }
  .pp-wrap {
    max-width: 920px;
    margin: 0 auto;
    animation: fadeUp 0.3s var(--ease) both;
  }

  /* ── Card ── */
  .pp-card {
    background: #fff;
    border-radius: var(--r-xl);
    border: 1px solid var(--border);
    box-shadow: 0 2px 8px rgba(26,58,42,0.06), 0 1px 2px rgba(26,58,42,0.04);
    overflow: hidden;
    animation: popIn 0.28s var(--ease) both;
  }

  /* ── Hero ── */
  .pp-hero {
    background: linear-gradient(135deg, #1a3a2a 0%, #243f2f 60%, #2d5a3d 100%);
    padding: 28px 24px 22px;
    position: relative;
    overflow: hidden;
  }
  .pp-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 60% 100% at 90% -5%, rgba(61,122,82,0.35) 0%, transparent 60%),
      radial-gradient(ellipse 35% 55% at 5% 105%, rgba(26,42,30,0.7) 0%, transparent 55%);
    pointer-events: none;
  }
  .pp-hero-inner {
    position: relative;
    display: flex;
    gap: 20px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  /* ── Avatar ── */
  .pp-avatar {
    width: 78px; height: 78px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--forest-mid);
    border: 2px solid rgba(255,255,255,0.14);
    outline: 3px solid rgba(138,171,148,0.18);
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }
  .pp-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pp-avatar-initials {
    font-family: var(--font-display);
    font-size: 24px; font-weight: 700;
    color: var(--sage-light);
    letter-spacing: -1px;
  }

  /* ── Hero meta ── */
  .pp-hero-meta { flex: 1; min-width: 160px; }
  .pp-name {
    font-family: var(--font-display);
    font-size: clamp(19px, 3.2vw, 26px);
    font-weight: 600; color: #fff;
    line-height: 1.15; letter-spacing: -0.4px;
    margin-bottom: 6px;
  }
  .pp-hero-sub {
    display: flex; align-items: center; gap: 7px;
    font-size: 12px; color: rgba(184,212,190,0.8);
    flex-wrap: wrap; margin-bottom: 10px;
    font-weight: 300;
  }
  .pp-role-badge {
    padding: 2px 9px; border-radius: 20px;
    font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    background: rgba(138,171,148,0.18);
    color: var(--sage-light);
    border: 1px solid rgba(138,171,148,0.25);
  }
  .pp-bio {
    font-size: 12.5px; color: rgba(255,255,255,0.55);
    line-height: 1.65; font-weight: 300;
  }
  .pp-bio-edit {
    width: 100%; margin-top: 7px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.13);
    border-radius: var(--r-sm);
    color: #fff; font-family: var(--font-body);
    font-size: 13px; padding: 9px 12px;
    resize: vertical; transition: border-color 0.18s;
    line-height: 1.55;
  }
  .pp-bio-edit:focus { outline: none; border-color: var(--sage); background: rgba(255,255,255,0.1); }
  .pp-bio-edit::placeholder { color: rgba(255,255,255,0.25); }

  /* ── Points bubble ── */
  .pp-points {
    background: rgba(196,98,45,0.14);
    border: 1px solid rgba(196,98,45,0.24);
    border-radius: var(--r-md);
    padding: 14px 20px; min-width: 80px;
    text-align: center; align-self: flex-start;
    backdrop-filter: blur(4px);
  }
  .pp-points-num {
    font-family: var(--font-display);
    font-size: 26px; font-weight: 700;
    color: var(--sienna-light); line-height: 1;
    letter-spacing: -1.5px;
  }
  .pp-points-label {
    font-size: 9.5px; text-transform: uppercase;
    letter-spacing: 0.12em; font-weight: 600;
    color: rgba(232,149,106,0.6); margin-top: 4px;
  }

  /* ── Hero action row ── */
  .pp-hero-row {
    position: relative;
    display: flex; gap: 8px;
    margin-top: 18px; flex-wrap: wrap;
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
    padding: 14px 10px; text-align: center;
    border-right: 1px solid var(--border);
    transition: background 0.14s;
  }
  .pp-stat:last-child { border-right: none; }
  .pp-stat:hover { background: var(--cream-dark); }
  .pp-stat-val {
    font-family: var(--font-display);
    font-size: 20px; font-weight: 600;
    color: var(--forest); line-height: 1;
    letter-spacing: -0.5px;
  }
  .pp-stat-label {
    font-size: 10px; color: var(--text-secondary);
    margin-top: 4px; font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.06em;
  }

  /* ── Section grid ── */
  .pp-sections {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
  .pp-section {
    padding: 22px 22px 20px;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    transition: background 0.14s;
  }
  .pp-section:nth-child(even)      { border-right: none; }
  .pp-section:nth-last-child(-n+2) { border-bottom: none; }

  @media (max-width: 560px) {
    .pp-sections { grid-template-columns: 1fr; }
    .pp-section { border-right: none; border-bottom: 1px solid var(--border); }
    .pp-section:last-child { border-bottom: none; }
    .pp-page { padding: 12px 12px 60px; }
    .pp-hero { padding: 20px 16px 18px; }
    .pp-name { font-size: 19px; }
    .pp-avatar { width: 64px; height: 64px; }
    .pp-avatar-initials { font-size: 20px; }
    .pp-points { padding: 10px 14px; min-width: 68px; }
    .pp-points-num { font-size: 20px; }
  }

  /* ── Section header ── */
  .pp-section-head {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }
  .pp-section-icon {
    width: 24px; height: 24px; border-radius: 6px;
    background: var(--cream);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    color: var(--forest-mid); flex-shrink: 0;
  }
  .pp-section-title {
    font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--text-secondary);
  }

  /* ── Info rows ── */
  .pp-info-row {
    display: flex; align-items: baseline; gap: 10px;
    padding: 7px 0;
    border-bottom: 1px solid rgba(26,58,42,0.05);
  }
  .pp-info-row:last-of-type { border-bottom: none; }
  .pp-info-label {
    font-size: 10.5px; color: var(--text-muted);
    min-width: 56px; font-weight: 600;
    flex-shrink: 0; text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .pp-info-val {
    font-size: 13px; color: var(--text-primary);
    font-weight: 400; flex: 1; word-break: break-all;
  }
  .pp-info-action {
    font-size: 10.5px; color: var(--forest-light);
    background: none; border: none; cursor: pointer;
    padding: 2px 7px; border-radius: 5px; font-weight: 600;
    transition: background 0.14s, color 0.14s;
    font-family: var(--font-body);
  }
  .pp-info-action:hover { background: var(--cream); color: var(--forest); }

  /* ── Inputs ── */
  .pp-input {
    display: block; width: 100%;
    padding: 8px 11px; margin: 3px 0;
    border-radius: var(--r-sm);
    border: 1px solid var(--border-strong);
    font-family: var(--font-body); font-size: 13px;
    color: var(--text-primary);
    background: var(--parchment);
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    line-height: 1.45;
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
  .pp-toggle {
    display: flex; align-items: center; gap: 9px;
    cursor: pointer; user-select: none; padding: 3px 0;
  }
  .pp-toggle-track {
    width: 32px; height: 18px; border-radius: 9px;
    position: relative; flex-shrink: 0;
    transition: background 0.2s var(--ease);
  }
  .pp-toggle-track-on  { background: var(--forest-light); }
  .pp-toggle-track-off { background: #cdd8d1; }
  .pp-toggle-thumb {
    position: absolute; top: 2px; width: 14px; height: 14px;
    border-radius: 50%; background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    transition: left 0.2s var(--ease);
  }
  .pp-toggle-lbl { font-size: 12.5px; color: var(--text-secondary); font-weight: 400; }

  /* ── Notification prefs ── */
  .pp-notif { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
  .pp-notif-title {
    font-size: 9.5px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.09em;
    color: var(--text-muted); margin-bottom: 8px;
  }
  .pp-notif-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 10px; }
  .pp-push-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    width: 100%; padding: 8px 12px;
    font-family: var(--font-body); font-size: 12px; font-weight: 500;
    color: var(--text-secondary);
    background: transparent;
    border: 1px dashed var(--border-strong);
    border-radius: var(--r-sm);
    cursor: pointer; transition: all 0.15s;
  }
  .pp-push-btn:hover { background: var(--cream); border-style: solid; }
  .pp-push-btn-on {
    border-color: var(--forest-light);
    color: var(--forest-light);
    border-style: solid;
    background: rgba(61,122,82,0.04);
  }

  /* ── Pref chips ── */
  .pp-prefs { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
  .pp-pref-chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 9px; border-radius: 20px;
    font-size: 11px; font-weight: 500;
  }
  .pp-pref-on  { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
  .pp-pref-off { background: var(--cream-dark); color: var(--text-muted); border: 1px solid var(--border); }

  /* ── Social links ── */
  .pp-social-link {
    display: block; font-size: 13px; font-weight: 500;
    color: var(--forest-light); text-decoration: none;
    padding: 3px 0; transition: color 0.14s;
  }
  .pp-social-link:hover { color: var(--forest); }

  /* ── Collector badge ── */
  .pp-collector-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 11px; border-radius: var(--r-sm);
    background: var(--cream); border: 1px solid var(--border-strong);
    font-size: 12px; color: var(--text-secondary);
    margin-bottom: 12px; font-weight: 500;
  }

  /* ── Empty ── */
  .pp-empty {
    font-size: 13px; color: var(--text-muted);
    font-style: italic; padding: 4px 0;
    line-height: 1.6;
  }

  /* ── Address ── */
  address.pp-address {
    font-style: normal; font-size: 13.5px;
    color: var(--text-primary); line-height: 1.8;
  }

  /* ── Buttons ── */
  .btn {
    border: none; cursor: pointer; font-family: var(--font-body); font-weight: 500;
    display: inline-flex; align-items: center; gap: 5px;
    white-space: nowrap; transition: all 0.16s var(--ease);
  }
  .btn:active { transform: scale(0.97); }

  .btn-hero {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.85);
    border: 1px solid rgba(255,255,255,0.15) !important;
    padding: 7px 13px; border-radius: var(--r-sm);
    font-size: 12.5px;
  }
  .btn-hero:hover { background: rgba(255,255,255,0.16); }

  .btn-hero-cta {
    background: var(--sienna); color: #fff;
    border: none !important;
    padding: 8px 18px; border-radius: var(--r-sm);
    font-size: 12.5px; font-weight: 600;
    box-shadow: 0 2px 12px rgba(196,98,45,0.32);
  }
  .btn-hero-cta:hover { background: #b05626; }
  .btn-hero-danger { color: #fca5a5 !important; border-color: rgba(252,165,165,0.28) !important; }
  .btn-hero-danger:hover { background: rgba(220,38,38,0.1) !important; }

  .btn-primary {
    background: var(--forest); color: #fff;
    padding: 9px 20px; border-radius: var(--r-sm);
    font-size: 13px; font-weight: 600;
    box-shadow: 0 2px 8px rgba(26,58,42,0.18);
  }
  .btn-primary:hover { background: var(--forest-mid); }

  .btn-ghost {
    background: transparent; color: var(--text-secondary);
    border: 1px solid var(--border-strong) !important;
    padding: 8px 15px; border-radius: var(--r-sm); font-size: 13px;
  }
  .btn-ghost:hover { background: var(--cream); }

  /* ── Skeleton ── */
  .skel {
    background: linear-gradient(90deg,#ece7db 25%,#ddd7cc 50%,#ece7db 75%);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
    border-radius: 5px;
  }

  /* ── Toast ── */
  .pp-toast {
    position: fixed; right: 20px; bottom: 24px;
    background: var(--forest); color: #fff;
    padding: 10px 16px; border-radius: var(--r-md);
    font-size: 13px; font-weight: 500;
    box-shadow: 0 8px 28px rgba(26,58,42,0.22);
    display: flex; align-items: center; gap: 9px;
    animation: toastIn 0.22s var(--ease) both;
    z-index: 9999; max-width: 280px;
    border: 1px solid rgba(138,171,148,0.15);
  }
  .pp-toast-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--sage); flex-shrink: 0;
  }

  /* ── Error ── */
  .pp-error { text-align: center; padding: 56px 28px; }
  .pp-error-icon { font-size: 32px; margin-bottom: 12px; }
  .pp-error-msg { color: #c53030; font-size: 14px; font-weight: 500; margin-bottom: 20px; }
`;

/* ========================= helpers & small components ========================= */

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
  const base = (api.defaults.baseURL || "").replace(/\/api\/?$/i, "");
  const fallback = (window as any).__API_BASE__ || base || "http://localhost:5000";
  return `${fallback.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

function getInitials(name?: string): string {
  if (!name) return "U";
  return name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
}

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
  // Consider a value present unless it's null/undefined or an empty string.
  const hasValue =
    value !== undefined &&
    value !== null &&
    !(typeof value === "string" && value.trim() === "");

  return (
    <div className="pp-info-row">
      <span className="pp-info-label">{label}</span>
      <span className="pp-info-val">
        {hasValue ? value : <span style={{ color: "var(--text-muted)" }}>—</span>}
      </span>
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

/* ========== push subscription hook (uses notifications endpoints) ========== */
/*
  IMPORTANT: push is opt-in via REACT_APP_ENABLE_PUSH=1.
  Default (no env or not set to "1") -> push calls are skipped (no network requests).
*/
function usePushSubscription(userId?: string) {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [checkingPush, setCheckingPush] = useState(false);

  // Safe env detection (works with Vite import.meta.env or globalThis.process.env if present).
  const pushEnabledViaEnv = (() => {
    try {
      const maybeImportMeta = (typeof (import.meta as any) !== "undefined") ? (import.meta as any).env : undefined;
      if (maybeImportMeta && typeof maybeImportMeta.REACT_APP_ENABLE_PUSH !== "undefined") {
        return String(maybeImportMeta.REACT_APP_ENABLE_PUSH) === "1";
      }
      const maybeProcessEnv = (globalThis as any)?.process?.env;
      if (maybeProcessEnv && typeof maybeProcessEnv.REACT_APP_ENABLE_PUSH !== "undefined") {
        return String(maybeProcessEnv.REACT_APP_ENABLE_PUSH) === "1";
      }
    } catch {
      // ignore
    }
    return false;
  })();

  // If push is NOT enabled via env, early-return inert API (no network calls).
  useEffect(() => {
    if (!userId || !pushEnabledViaEnv) return;
    let cancelled = false;
    (async () => {
      setCheckingPush(true);
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            const sub = await reg.pushManager.getSubscription();
            if (sub && !cancelled) { setPushEnabled(true); setCheckingPush(false); return; }
          }
        }

        const res = await api.get("/notifications/push-subscription/exists", {
          validateStatus: (status) => status < 500 // allow 404/4xx through so it doesn't throw
        });

        if (!cancelled && res.status === 200 && res.data?.exists) {
          setPushEnabled(true);
        }
      } catch (err: any) {
        // Keep quiet for expected missing endpoints; warn for other issues.
        console.warn("push check failed", err?.message ?? err);
      } finally {
        if (!cancelled) setCheckingPush(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, pushEnabledViaEnv]);

  const enable = useCallback(async (toast: (m: string) => void) => {
    if (!pushEnabledViaEnv) { toast("Push not enabled in this build"); return; }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast("Push not supported"); return;
    }
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      if ((await Notification.requestPermission()) !== "granted") { toast("Permission denied"); return; }

      const res = await api.get("/notifications/vapidPublicKey", {
        validateStatus: (status) => status < 500
      });
      if (res.status !== 200 || !res.data?.key) { toast("VAPID key unavailable"); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(res.data.key),
      });
      await api.post("/notifications/push-subscription", { subscription: sub });
      setPushEnabled(true); toast("Browser notifications enabled");
    } catch (err) {
      console.warn("enable push error", err);
      toast("Failed to enable notifications");
    }
  }, [pushEnabledViaEnv]);

  const disable = useCallback(async (toast: (m: string) => void) => {
    if (!pushEnabledViaEnv) { toast("Push not enabled in this build"); return; }
    try {
      await api.delete("/notifications/push-subscription", { validateStatus: (s) => s < 500 });
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      setPushEnabled(false); toast("Browser notifications disabled");
    } catch (err) {
      console.warn("disable push error", err);
      toast("Failed to disable notifications");
    }
  }, [pushEnabledViaEnv]);

  return { pushEnabled, checkingPush, enable, disable };
}

/* ========================= ProfilePage component ========================= */

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

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) { navigate("/login", { replace: true }); return; }

    const ctrl = new AbortController();
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await api.get<User>("/users/profile", { signal: ctrl.signal });

        // --- START: Rescue/merge phone & address from localStorage (temporary client-side fix) ---
        // If server omitted phone/address, attempt to fill them from localStorage or common alternate keys.
        let serverUser: any = res.data ?? {};
        try {
          const saved = localStorage.getItem("user");
          if (saved) {
            const parsed = JSON.parse(saved);
            // phone fallbacks
            if (!serverUser.phone && parsed.phone) serverUser.phone = parsed.phone;
            if (!serverUser.phone && parsed.mobile) serverUser.phone = parsed.mobile;
            if (!serverUser.phone && parsed.phoneNumber) serverUser.phone = parsed.phoneNumber;
            if (!serverUser.phone && parsed.contact?.phone) serverUser.phone = parsed.contact.phone;

            // address fallbacks (either an object or flattened fields)
            if (!serverUser.address && parsed.address) {
              serverUser.address = parsed.address;
            } else if (!serverUser.address) {
              // build address from common flattened keys if they exist
              const anyAddrPresent = parsed.addressLine1 || parsed.addressLine2 || parsed.city || parsed.postalCode || parsed.country || parsed.state;
              if (anyAddrPresent) {
                serverUser.address = {
                  line1: parsed.addressLine1 ?? parsed.address?.line1,
                  line2: parsed.addressLine2 ?? parsed.address?.line2,
                  city: parsed.city ?? parsed.address?.city,
                  state: parsed.state ?? parsed.address?.state,
                  postalCode: parsed.postalCode ?? parsed.address?.postalCode,
                  country: parsed.country ?? parsed.address?.country,
                };
              }
            }
          }
        } catch (e) {
          // ignore parse errors
        }
        // --- END: Rescue/merge ---

        if (serverUser) {
          setUser(serverUser); setDraft(serverUser);
          try { localStorage.setItem("user", JSON.stringify(serverUser)); } catch {}
        }
      } catch (err) {
        const anyErr = err as any;
        if (axios.isCancel?.(err) || anyErr?.code === "ERR_CANCELED") return;
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

  const initials  = useMemo(() => getInitials(user?.name), [user?.name]);
  const avatarSrc = useMemo(() => user?.avatarUrl ? normalizeAvatarUrl(user.avatarUrl) : null, [user?.avatarUrl]);
  const joined    = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short" })
    : "—";

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
      const payload: any = {
        name: draft.name, phone: draft.phone, bio: draft.bio,
        social: draft.social, address: draft.address,
        receiveEmails: draft.receiveEmails, receiveSMS: draft.receiveSMS,
      };

      if ((draft.role || user?.role) === "collector") {
        if (draft.bankAccount !== undefined) payload.bankAccount = draft.bankAccount;
        if (draft.vehicle !== undefined) payload.vehicle = draft.vehicle;
      }

      const res = await api.put<User>("/users/profile", payload);
      const updated = res.data ?? { ...draft };
      setUser(updated); setDraft(updated); setEditMode(false);
      showToast("Profile saved");
      try { localStorage.setItem("user", JSON.stringify(updated)); } catch {}
    } catch (err) {
      console.error("Profile save error", err);
      showToast("Save failed — please try again");
    } finally { setSaving(false); }
  };

  const patchDraft   = (p: Partial<User>)                               => setDraft(d => ({ ...(d ?? {}), ...p }));
  const patchAddress = (p: Partial<Address>)                            => setDraft(d => ({ ...(d ?? {}), address: { ...(d?.address ?? {}), ...p } }));
  const patchSocial  = (p: Partial<NonNullable<User["social"]>>)        => setDraft(d => ({ ...(d ?? {}), social:  { ...(d?.social  ?? {}), ...p } }));

  const effectiveRole = user?.role ?? (typeof window !== "undefined" ? localStorage.getItem("role") ?? undefined : undefined);

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {effectiveRole === "collector" ? <CollectorSidebar /> : <Sidebar />}

        <main style={{ flex: 1 }}>
          <div className="pp">
            <div className="pp-page">
              <div
                className="pp-wrap"
                style={{
                  margin: "0 auto",
                  maxWidth: 1100,
                  padding: "0 18px",
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
                          </>
                        )}
                      </div>
                    </div>

                    {/* Conditional Stats: collectors see collector stats; regular users see user stats */}
                    {user.role === "collector" ? (
                      <div className="pp-stats">
                        <StatCell label="Assigned" value={user.assignedCount != null ? String(user.assignedCount) : "—"} />
                        <StatCell label="Completed (mo)" value={user.completedThisMonth != null ? String(user.completedThisMonth) : "—"} />
                        <StatCell label="Kg collected" value={user.kgCollected != null ? String(user.kgCollected) : "—"} />
                      </div>
                    ) : (
                      <div className="pp-stats">
                        <StatCell label="Posts" value={user.postCount != null ? String(user.postCount) : "—"} />
                        <StatCell label="Rewards" value={user.rewards != null ? String(user.rewards) : "—"} />
                        <StatCell label="Points" value={user.points != null ? String(user.points) : "—"} />
                      </div>
                    )}

                    <div className="pp-sections">

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
                        ) : (
                          // Show address if any address field has a non-empty value
                          (user.address && Object.values(user.address).some(v => v != null && String(v).trim() !== "")) ? (
                            <address className="pp-address">
                              {user.address.line1 && <div>{user.address.line1}</div>}
                              {user.address.line2 && <div>{user.address.line2}</div>}
                              <div>{[user.address.city, user.address.state].filter(Boolean).join(", ")}</div>
                              <div>{[user.address.postalCode, user.address.country].filter(Boolean).join(" ")}</div>
                            </address>
                          ) : (
                            <p className="pp-empty">No address on file.</p>
                          )
                        )}
                      </section>

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

                      {user.role === "collector" && (
                        <section className="pp-section">
                          <SectionHead icon={<TruckIcon />} title="Collector info" />

                          <div className="pp-collector-badge"><TruckIcon /> Active collector</div>

                          {editMode ? (
                            <>
                              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Bank account</label>
                              <input className="pp-input" placeholder="Bank account number" value={draft?.bankAccount ?? ""} onChange={e => patchDraft({ bankAccount: e.target.value })} />

                              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginTop: 8, marginBottom: 6 }}>Vehicle</label>
                              <input className="pp-input" placeholder="Make" value={draft?.vehicle?.make ?? ""} onChange={e => patchDraft({ vehicle: { ...(draft?.vehicle ?? {}), make: e.target.value } })} />
                              <input className="pp-input" placeholder="Model" value={draft?.vehicle?.model ?? ""} onChange={e => patchDraft({ vehicle: { ...(draft?.vehicle ?? {}), model: e.target.value } })} />
                              <input className="pp-input" placeholder="Plate" value={draft?.vehicle?.plate ?? ""} onChange={e => patchDraft({ vehicle: { ...(draft?.vehicle ?? {}), plate: e.target.value } })} />
                            </>
                          ) : (
                            <>
                              <InfoRow label="Bank" value={maskBank(user.bankAccount)} />
                              {user.vehicle && <InfoRow label="Vehicle" value={[user.vehicle.make, user.vehicle.model].filter(Boolean).join(" ") || "—"} />}
                              {user.vehicle?.plate && <InfoRow label="Plate" value={user.vehicle.plate} />}
                            </>
                          )}
                        </section>
                      )}

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

/* ============== small icons ============== */
const EditIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 21v-3.6L15.6 4.8a1 1 0 0 1 1.4 0l2.2 2.2a1 1 0 0 1 0 1.4L6.6 21H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const EmailIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const PinIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/></svg>;
const TruckIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M1 3h15v13H1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M16 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="5.5" cy="18.5" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="18.5" cy="18.5" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>;
const BellIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;