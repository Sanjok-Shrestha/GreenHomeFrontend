// src/pages/RewardsCombined.tsx
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api";
import Sidebar from "../components/Sidebar";
import CollectorSidebar from "../components/CollectorSidebar";
import { AuthContext } from "../App";
import "./RewardsPage.css";

/* ── Types ── */
type Profile         = { id?: string; name?: string; email?: string; points?: number; role?: string };
type RewardItem      = { id: string; title: string; description?: string; cost: number };
type Payment         = { id: string; date: string; amount: number; method?: string; note?: string };
type EarningsResponse= { totalPickups?: number; totalPoints?: number; payments?: Payment[] };
type Policy          = { collector: { pointsPerPickup: number; pointsPerKg: number | null }; user: { pointsPerPickup: number; pointsPerKg: number | null } };

/* ── Static catalogs ── */
const USER_CATALOG: RewardItem[] = [
  { id: "v100",     title: "Rs 100 Voucher", cost: 100, description: "Redeemable at partner stores" },
  { id: "pickup",   title: "Free Pickup",    cost: 200, description: "One free scheduled pickup" },
  { id: "discount", title: "5% Off",         cost: 50,  description: "Discount on next order" },
];
const COLLECTOR_REWARDS: RewardItem[] = [
  { id: "meal",       title: "Free Meal",    cost: 100, description: "Meal voucher for collectors" },
  { id: "helmet",     title: "Free Helmet",  cost: 500, description: "Safety helmet (admin-approved)" },
  { id: "voucher100", title: "₹100 Voucher", cost: 120, description: "Gift voucher worth ₹100" },
];

/* ── Component ── */
export default function RewardsCombined(): React.ReactElement {
  const auth = useContext(AuthContext);

  const [loadingProfile,   setLoadingProfile]   = useState(true);
  const [profile,          setProfile]          = useState<Profile | null>(null);
  const [profileError,     setProfileError]     = useState<string | null>(null);
  const [redeemingUserId,  setRedeemingUserId]  = useState<string | null>(null);
  const [collectorData,    setCollectorData]    = useState<EarningsResponse | null>(null);
  const [loadingCollector, setLoadingCollector] = useState(false);
  const [collectorError,   setCollectorError]   = useState<string | null>(null);
  const [redeemingCollector, setRedeemingCollector] = useState(false);
  const [policy, setPolicy] = useState<Policy>({
    collector: { pointsPerPickup: 10, pointsPerKg: null },
    user:      { pointsPerPickup: 0,  pointsPerKg: null },
  });
  const [view, setView] = useState<"user" | "collector" | "both">("user");

  const roleNormalized = useMemo(() => {
    const fromCtx     = (auth?.roleState ?? "").toString().trim().toLowerCase();
    if (fromCtx)     return fromCtx;
    const fromProfile = (profile?.role ?? "").toString().trim().toLowerCase();
    if (fromProfile) return fromProfile;
    return (localStorage.getItem("role") ?? "").toString().trim().toLowerCase();
  }, [auth?.roleState, profile]);

  const allowedTabs = useMemo(() => {
    if (!roleNormalized)                    return ["user","collector","both"];
    if (roleNormalized === "collector")     return ["collector"];
    if (roleNormalized === "user")          return ["user"];
    return ["user","collector","both"];
  }, [roleNormalized]);

  /* load profile */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingProfile(true); setProfileError(null);
      try {
        const res = await api.get<Profile>("/users/profile");
        if (!mounted) return;
        const p = res.data ?? null;
        setProfile(p);
        const r = (auth?.roleState ?? p?.role ?? localStorage.getItem("role") ?? "").toString().trim().toLowerCase();
        setView(r === "collector" ? "collector" : r === "user" ? "user" : "both");
      } catch (err: any) {
        if (!mounted) return;
        setProfileError(err?.response?.data?.message || err?.message || "Failed to load profile");
        setProfile(null); setView("both");
      } finally { if (mounted) setLoadingProfile(false); }
    })();
    return () => { mounted = false; };
  }, [auth?.roleState]);

  /* load policy */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await api.get("/rewards/catalog");
        if (!mounted) return;
        const p = r.data?.policy ?? {};
        setPolicy({
          collector: { pointsPerPickup: Number(p?.collector?.pointsPerPickup ?? 10), pointsPerKg: p?.collector?.pointsPerKg ?? null },
          user:      { pointsPerPickup: Number(p?.user?.pointsPerPickup ?? 0),       pointsPerKg: p?.user?.pointsPerKg ?? null },
        });
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  /* fetch collector earnings */
  const fetchCollector = useCallback(async () => {
    setLoadingCollector(true); setCollectorError(null);
    try {
      const res = await api.get<EarningsResponse>("/waste/collector/earnings");
      setCollectorData(res.data ?? null);
    } catch (err: any) {
      if (!err?.response)                    setCollectorError("Network error — could not reach API.");
      else if (err.response.status === 401)  setCollectorError("Unauthorized — please login");
      else if (err.response.status === 403)  setCollectorError("Not a collector");
      else setCollectorError(err.response?.data?.message || err.message || "Failed to load collector earnings");
      setCollectorData(null);
    } finally { setLoadingCollector(false); }
  }, []);

  useEffect(() => {
    if ((view === "collector" || view === "both") && roleNormalized === "collector") fetchCollector();
  }, [view, roleNormalized, fetchCollector]);

  /* derived */
  const userPoints               = profile?.points ?? 0;
  const collectorPayments        = collectorData?.payments ?? [];
  const collectorTotalPickups    = collectorData?.totalPickups ?? 0;
  const collectorServerPoints    = collectorData?.totalPoints;
  const collectorFromPayments    = collectorPayments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const ptsPer                   = Number(policy.collector.pointsPerPickup || 10);
  const collectorFromPickups     = collectorTotalPickups * ptsPer;
  const collectorPointsAvailable = collectorServerPoints ?? (collectorFromPayments > 0 ? collectorFromPayments : collectorFromPickups);

  function pickupsNeeded(rewardCost: number, current: number) {
    if (!ptsPer || ptsPer <= 0) return Infinity;
    return Math.ceil(Math.max(0, rewardCost - current) / ptsPer);
  }

  /* handlers */
  const handleUserRedeem = async (item: RewardItem) => {
    if (userPoints < item.cost) { alert("Not enough points"); return; }
    if (!confirm(`Redeem ${item.cost} pts for "${item.title}"?`)) return;
    setRedeemingUserId(item.id);
    try {
      const res = await api.post("/rewards/redeem", { rewardId: item.id });
      const body = res?.data;
      if (body?.profile) setProfile(body.profile);
      else { const r2 = await api.get<Profile>("/users/profile"); setProfile(r2.data ?? null); }
      alert("Redeemed successfully.");
    } catch (err: any) { alert(err?.response?.data?.message || "Redeem failed"); }
    finally { setRedeemingUserId(null); }
  };

  const handleCollectorRedeem = async (reward: RewardItem) => {
    if (collectorPointsAvailable < reward.cost) { alert("Not enough collector points"); return; }
    if (!confirm(`Redeem ${reward.cost} pts for "${reward.title}"?`)) return;
    setRedeemingCollector(true);
    try {
      await api.post("/waste/collector/redeem", { rewardId: reward.id, cost: reward.cost });
      await fetchCollector();
      alert("Collector redemption submitted.");
    } catch (err: any) { alert(err?.response?.data?.message || "Collector redeem failed"); }
    finally { setRedeemingCollector(false); }
  };

  const fmtPoints = (v: number) => `${v.toLocaleString()} pts`;
  const fmtDate   = (iso?: string) => iso ? new Date(iso).toLocaleDateString() : "—";

  const LeftSidebar = useMemo(() => (roleNormalized === "collector" ? <CollectorSidebar /> : <Sidebar />), [roleNormalized]);

  /* ── Tabs ── */
  const renderTabs = () => {
    if (allowedTabs.length === 1) {
      const label = allowedTabs[0] === "collector" ? "Collector" : allowedTabs[0] === "user" ? "User" : "Both";
      return <div className="rc-tab-label">{label}</div>;
    }
    return (
      <div className="rc-tabs" role="tablist" aria-label="Reward views">
        {allowedTabs.includes("user") && (
          <button type="button" role="tab" aria-selected={view === "user"}
            className={`rc-tab${view === "user" ? " rc-tab--active" : ""}`}
            onClick={() => setView("user")}>
            User rewards
          </button>
        )}
        {allowedTabs.includes("collector") && (
          <button type="button" role="tab" aria-selected={view === "collector"}
            className={`rc-tab${view === "collector" ? " rc-tab--active" : ""}`}
            onClick={() => setView("collector")}>
            Collector points
          </button>
        )}
        {allowedTabs.includes("both") && (
          <button type="button" role="tab" aria-selected={view === "both"}
            className={`rc-tab${view === "both" ? " rc-tab--active" : ""}`}
            onClick={() => setView("both")}>
            Both
          </button>
        )}
      </div>
    );
  };

  const refreshProfile = async () => {
    setLoadingProfile(true); setProfileError(null);
    try { const r = await api.get<Profile>("/users/profile"); setProfile(r.data ?? null); }
    catch (e: any) { setProfileError(e?.message || "Failed"); }
    finally { setLoadingProfile(false); }
  };

  /* ── Render ── */
  return (
    <div className="ct-layout">
      <div className="ct-aside">{LeftSidebar}</div>

      <div className="ct-page">

        {/* ── Tabs ── */}
        {renderTabs()}

        {/* ══════════════ USER REWARDS ══════════════ */}
        {(view === "user" || view === "both") && allowedTabs.includes("user") && (
          <section aria-labelledby="rc-user-title">

            <div className="rc-header">
              <div>
                <h2 id="rc-user-title" className="rc-title">User Rewards</h2>
                <p className="rc-sub">Redeem offers using your accumulated points</p>
              </div>
              <button type="button" className="rc-btn rc-btn--ghost" onClick={refreshProfile}>
                {loadingProfile ? "Refreshing…" : "↻ Refresh"}
              </button>
            </div>

            {/* Profile strip */}
            <div className="rc-profile" role="region" aria-label="User profile">
              {loadingProfile ? (
                <div className="rc-loading">Loading profile…</div>
              ) : profileError ? (
                <div className="rc-error">⚠ {profileError}</div>
              ) : profile ? (
                <>
                  <div>
                    <div className="rc-profile__name">{profile.name ?? "—"}</div>
                    <div className="rc-profile__email">{profile.email ?? ""}</div>
                  </div>
                  <div className="rc-profile__balance">
                    <div className="rc-points-badge">{fmtPoints(userPoints)}</div>
                    <div className="rc-points-label">Balance</div>
                  </div>
                </>
              ) : (
                <div className="muted">No profile data</div>
              )}
            </div>

            {/* Reward list */}
            <div className="reward-list" aria-label="User reward catalog">
              {USER_CATALOG.map((item) => {
                const can = userPoints >= item.cost;
                return (
                  <div key={item.id} className="reward-item">
                    <div className="reward-left">
                      <div className="reward-title">{item.title}</div>
                      <div className="reward-desc">{item.description}</div>
                    </div>
                    <div className="reward-right">
                      <span className="reward-cost">{item.cost} pts</span>
                      <button
                        className={`rc-btn${!can ? " rc-btn--locked" : ""}`}
                        disabled={!can || !!redeemingUserId}
                        onClick={() => handleUserRedeem(item)}
                      >
                        {redeemingUserId === item.id ? "Redeeming…" : can ? "Redeem" : "Need pts"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Divider between sections in "both" mode */}
        {view === "both" && allowedTabs.includes("user") && allowedTabs.includes("collector") && (
          <div className="rc-divider" />
        )}

        {/* ══════════════ COLLECTOR POINTS ══════════════ */}
        {(view === "collector" || view === "both") && allowedTabs.includes("collector") && (
          <section aria-labelledby="rc-collector-title">

            <div className="rc-header">
              <div>
                <h2 id="rc-collector-title" className="rc-title">Collector Points</h2>
                <p className="rc-sub">Ledger and redemptions for collectors</p>
              </div>
              <button type="button" className="rc-btn rc-btn--ghost" onClick={fetchCollector} disabled={loadingCollector}>
                {loadingCollector ? "Refreshing…" : "↻ Refresh"}
              </button>
            </div>

            {/* Collector profile strip */}
            <div className="rc-profile" role="region" aria-label="Collector balance">
              {loadingCollector ? (
                <div className="rc-loading">Loading collector data…</div>
              ) : collectorError ? (
                <div className="rc-error">⚠ {collectorError}</div>
              ) : (
                <>
                  <div>
                    <div className="rc-profile__name">Points balance</div>
                    <div className="rc-profile__email">{collectorTotalPickups} pickups recorded</div>
                  </div>
                  <div className="rc-profile__balance">
                    <div className="rc-points-badge">{fmtPoints(collectorPointsAvailable)}</div>
                    <div className="rc-points-label">
                      {collectorServerPoints !== undefined
                        ? "Server balance"
                        : collectorFromPayments > 0
                        ? "Ledger total"
                        : `Est. from ${collectorTotalPickups} pickups`}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Ledger table */}
            {collectorPayments.length === 0 ? (
              <div className="rc-ledger-wrap">
                <div className="rc-empty-ledger">No ledger entries yet.</div>
              </div>
            ) : (
              <div className="rc-ledger-wrap">
                <table className="rc-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Points</th>
                      <th>Method</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectorPayments.map((p) => (
                      <tr key={p.id}>
                        <td>{fmtDate(p.date)}</td>
                        <td>{p.amount} pts</td>
                        <td>{p.method ?? "—"}</td>
                        <td>{p.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Collector reward catalog */}
            <div className="reward-list" aria-label="Collector reward catalog">
              {COLLECTOR_REWARDS.map((r) => {
                const affordable  = collectorPointsAvailable >= r.cost;
                const picksNeeded = pickupsNeeded(r.cost, collectorPointsAvailable);
                return (
                  <div key={r.id} className="reward-item">
                    <div className="reward-left">
                      <div className="reward-title">{r.title}</div>
                      <div className="reward-desc">{r.description}</div>
                    </div>
                    <div className="reward-right">
                      <span className="reward-cost">{r.cost} pts</span>
                      {!affordable && Number.isFinite(picksNeeded) && (
                        <div className="reward-needed">
                          {picksNeeded} more pickup{picksNeeded !== 1 ? "s" : ""} needed
                        </div>
                      )}
                      <button
                        className={`rc-btn${!affordable ? " rc-btn--locked" : ""}`}
                        onClick={() => handleCollectorRedeem(r)}
                        disabled={!affordable || redeemingCollector}
                      >
                        {redeemingCollector ? "Processing…" : affordable ? "Redeem" : "Not enough"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}