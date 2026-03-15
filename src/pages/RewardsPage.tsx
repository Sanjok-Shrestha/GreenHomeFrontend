import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import { getErrorMessage } from "../utils/getErrorMessage";
import Sidebar from "../components/Sidebar";

/**
 * Compact Rewards page
 * - Less text, more icons
 * - Compact reward cards with inline SVG icons
 * - Preserves existing redeem logic and profile loading
 *
 * Save/replace: src/pages/RewardsPage.tsx
 */

/* -------------------- Types -------------------- */
type Profile = { id?: string; name?: string; email?: string; points?: number };
type RewardItem = { id: string; title: string; description?: string; cost: number };

/* -------------------- Data -------------------- */
const TIERS = [
  { name: "Bronze", min: 0, color: "#9e9e9e", icon: "🥉" },
  { name: "Silver", min: 500, color: "#bdbdbd", icon: "🥈" },
  { name: "Gold", min: 1000, color: "#ffd700", icon: "🥇" },
];

const CATALOG: RewardItem[] = [
  { id: "v100", title: "Rs100 Voucher", cost: 100, description: "Shop voucher" },
  { id: "pickup", title: "Free Pickup", cost: 200, description: "Coupon" },
  { id: "discount", title: "5% Off", cost: 50, description: "Store discount" },
];

/* -------------------- Small inline icons -------------------- */
const IconPoints = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" fill="#1db954" />
    <path d="M8 12h8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 8v8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconVoucher = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="2" y="7" width="20" height="10" rx="2" fill="#fff" stroke="#0b6efd" strokeWidth="1.4" />
    <circle cx="7.5" cy="12" r="1.6" fill="#0b6efd" />
    <path d="M16 10v4" stroke="#0b6efd" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const IconPickup = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 10h12v6H3z" fill="#fff" stroke="#1db954" strokeWidth="1.4" />
    <path d="M15 12l4-2 2 2v4" stroke="#1db954" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="7" cy="18" r="1.4" fill="#1db954" />
    <circle cx="17" cy="18" r="1.4" fill="#1db954" />
  </svg>
);

const IconDiscount = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="6" width="18" height="12" rx="2" fill="#fff" stroke="#ffd166" strokeWidth="1.4" />
    <circle cx="8.5" cy="12" r="1.6" fill="#ffd166" />
    <path d="M14 9.5l4 5" stroke="#ffd166" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* -------------------- Component -------------------- */
const RewardsPage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind?: "ok" | "err" } | null>(null);

  // load profile
  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Profile>("/api/users/profile");
      const body = (res && (res.data ?? (res.data as any)?.data)) || null;
      setProfile(body);
    } catch (err: any) {
      console.error(err);
      setError("Could not load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const points = profile?.points ?? 0;

  const currentTier = useMemo(() => TIERS.slice().reverse().find((t) => points >= t.min) ?? TIERS[0], [points]);
  const nextTier = useMemo(() => TIERS.find((t) => t.min > (currentTier?.min ?? 0)) ?? null, [currentTier]);
  const progressToNext = useMemo(() => {
    if (!nextTier) return 100;
    const prev = currentTier?.min ?? 0;
    const range = nextTier.min - prev;
    if (range <= 0) return 100;
    return Math.max(0, Math.min(100, Math.round(((points - prev) / range) * 100)));
  }, [points, currentTier, nextTier]);

  const shortToast = (msg: string, kind: "ok" | "err" = "ok") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2500);
  };

  const handleRedeem = async (item: RewardItem) => {
    if (points < item.cost) {
      shortToast(`Need ${item.cost} pts`, "err");
      return;
    }
    if (!confirm(`Redeem ${item.cost} pts for ${item.title}?`)) return;

    try {
      setRedeemingId(item.id);
      const res = await api.post("/api/rewards/redeem", { rewardId: item.id });
      const body = res?.data ?? (res?.data as any)?.data;
      if (body?.profile) {
        setProfile(body.profile);
        try { localStorage.setItem("user", JSON.stringify(body.profile)); } catch {}
      } else {
        await loadProfile();
      }
      shortToast("Redeemed", "ok");
    } catch (err: any) {
      console.error(err);
      shortToast(getErrorMessage(err) || "Redeem failed", "err");
    } finally {
      setRedeemingId(null);
    }
  };

  /* --- compact UI while loading --- */
  if (loading) {
    return (
      <div style={s.page}>
        <Sidebar active="rewards" />
        <main style={s.main}>
          <div style={s.header}>
            <div style={s.hLeft}><h2 style={{ margin: 0 }}>Rewards</h2><div style={s.sub}>Points & perks</div></div>
            <div style={s.pointsBox}><IconPoints /><div style={{ marginLeft: 8 }}>…</div></div>
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
            <div style={s.cardSkeleton} />
            <div style={s.cardSkeleton} />
            <div style={s.cardSkeleton} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <Sidebar active="rewards" />
      <main style={s.main}>
        <div style={s.header}>
          <div style={s.hLeft}>
            <h2 style={{ margin: 0 }}>Rewards</h2>
            <div style={s.sub}>Points & perks</div>
          </div>

          <div style={s.pointsBox} aria-live="polite">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconPoints size={22} />
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, opacity: 0.9 }}>My points</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{points}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tier summary - compact */}
        <section style={s.rowCompact}>
          <div style={s.tierCard}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 26 }}>{currentTier.icon}</div>
              <div>
                <div style={{ fontWeight: 800 }}>{currentTier.name}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{currentTier.min} pts</div>
              </div>
            </div>

            <div style={s.progressWrap}>
              <div style={s.progressBar}>
                <div style={{ ...s.progressFill, width: `${progressToNext}%`, background: currentTier.color }} />
              </div>
              <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>
                {nextTier ? `${progressToNext}% → ${nextTier.name}` : "Max tier"}
              </div>
            </div>
          </div>

          <div style={s.quickHelp}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Quick ways to earn</div>
            <div style={s.inlineList}>
              <div style={s.helpChip}>⚖️ +10 / kg</div>
              <div style={s.helpChip}>📅 Weekly +20</div>
              <div style={s.helpChip}>🎁 Referrals</div>
            </div>
          </div>
        </section>

        {/* Catalog - compact cards with icons */}
        <section style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Redeem</h3>
            <div style={{ fontSize: 13, color: "#666" }}>{CATALOG.length} offers</div>
          </div>

          <div style={s.catalogGrid}>
            {CATALOG.map((item) => {
              const can = points >= item.cost;
              const processing = redeemingId === item.id;
              return (
                <div key={item.id} style={{ ...s.rewardCard, opacity: can || processing ? 1 : 0.6 }}>
                  <div style={s.rewardLeft}>
                    <div style={s.iconWrap}>
                      {item.id === "v100" ? <IconVoucher /> : item.id === "pickup" ? <IconPickup /> : <IconDiscount />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{item.description}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800 }}>{item.cost} pts</div>
                    <button
                      style={{ ...s.smallButton, marginTop: 8, opacity: can && !processing ? 1 : 0.7, cursor: can && !processing ? "pointer" : "not-allowed" }}
                      disabled={!can || !!processing}
                      onClick={() => handleRedeem(item)}
                    >
                      {processing ? "…" : can ? "Redeem" : "Need pts"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Activity + hints compact */}
        <section style={{ display: "flex", gap: 12, marginTop: 18, alignItems: "flex-start" }}>
          <div style={{ ...s.card, flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 800 }}>Recent</div>
              <div style={{ fontSize: 12, color: "#666" }}>{profile?.name ?? "Guest"}</div>
            </div>
            <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
              <div>Points: <strong>{points}</strong></div>
              <div style={{ marginTop: 6 }}>Check rewards & redeem quickly.</div>
            </div>
          </div>

          <div style={{ width: 320 }}>
            <div style={s.card}>
              <div style={{ fontWeight: 800 }}>Tips</div>
              <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                <li style={{ fontSize: 13, color: "#555" }}>Rinse items</li>
                <li style={{ fontSize: 13, color: "#555" }}>Bundle cardboard</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* compact toast */}
      {toast && (
        <div style={{ ...s.toast, ...(toast.kind === "err" ? s.toastErr : s.toastOk) }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default RewardsPage;

/* -------------------- Styles (compact object) -------------------- */
const s: { [k: string]: React.CSSProperties } = {
  page: { display: "flex", minHeight: "100vh", background: "#f5f7fb" },
  main: { flex: 1, padding: 20, maxWidth: 1100, margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  hLeft: { display: "flex", flexDirection: "column" },
  sub: { color: "#666", fontSize: 13 },

  pointsBox: {
    marginLeft: "auto",
    background: "#14392b",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 10,
    minWidth: 110,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  rowCompact: { display: "flex", gap: 12, alignItems: "stretch" },
  tierCard: { flex: 1, background: "#fff", padding: 12, borderRadius: 10, boxShadow: "0 4px 18px rgba(0,0,0,0.05)" },
  quickHelp: { width: 260, background: "#fff", padding: 12, borderRadius: 10, boxShadow: "0 4px 18px rgba(0,0,0,0.04)" },

  progressWrap: { marginTop: 12 },
  progressBar: { height: 10, background: "#f0f0f0", borderRadius: 8, overflow: "hidden" },
  progressFill: { height: "100%", transition: "width 320ms ease" },

  inlineList: { display: "flex", gap: 8, flexWrap: "wrap" },
  helpChip: { background: "#f3fff3", padding: "6px 8px", borderRadius: 999, fontSize: 13, color: "#1b6b35" },

  catalogGrid: { display: "grid", gap: 12 },
  rewardCard: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: 12, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" },
  rewardLeft: { display: "flex", gap: 10, alignItems: "center" },
  iconWrap: { width: 44, height: 44, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#f7fff7" },

  smallButton: { background: "#14392b", color: "#fff", padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700 },

  card: { background: "#fff", padding: 12, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" },

  cardSkeleton: { height: 54, background: "linear-gradient(90deg,#f3f7f3 0,#eef9ee 50%, #f3f7f3 100%)", borderRadius: 8 },

  toast: { position: "fixed", right: 16, bottom: 16, padding: "8px 12px", borderRadius: 8, color: "#fff", zIndex: 9999 },
  toastOk: { background: "#27ae60" },
  toastErr: { background: "#e74c3c" },
};