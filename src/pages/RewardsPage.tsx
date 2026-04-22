import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api";
import Sidebar from "../components/Sidebar";
import CollectorSidebar from "../components/CollectorSidebar";
import { AuthContext } from "../App";
import "./RewardsPage.css";

/* ── Types ── */
type Profile = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  points?: number;
  role?: string;
  redeemedRewards?: string[];
  redemptions?: any[];
};

type RewardItem = { id: string; title: string; description?: string; cost: number };
type Payment = { id?: string; _id?: string; date?: string; amount?: number; method?: string; note?: string };
type EarningsResponse = { totalPickups?: number; totalPoints?: number; payments?: Payment[] };
type Policy = {
  collector: { pointsPerPickup: number; pointsPerKg: number | null };
  user: { pointsPerPickup: number; pointsPerKg: number | null };
};

/* ── Static catalogs (UI fallback) ── */
const USER_CATALOG: RewardItem[] = [
  { id: "v100", title: "Rs 100 Voucher", cost: 100, description: "Redeemable at partner stores" },
  { id: "pickup", title: "Free Pickup", cost: 200, description: "One free scheduled pickup" },
  { id: "discount", title: "5% Off", cost: 50, description: "Discount on next order" },
];

const COLLECTOR_REWARDS: RewardItem[] = [
  { id: "meal", title: "Free Meal", cost: 100, description: "Meal voucher for collectors" },
  { id: "helmet", title: "Free Helmet", cost: 500, description: "Safety helmet (admin-approved)" },
  { id: "voucher100", title: "₹100 Voucher", cost: 120, description: "Gift voucher worth ₹100" },
];

/* ── Simple inline SVG icons (no external deps) ── */
const IconStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  verticalAlign: "middle",
  marginRight: 10,
  display: "inline-block",
  flexShrink: 0,
};

const RefreshIcon: React.FC<{ spin?: boolean }> = ({ spin }) => (
  <svg
    style={{ ...IconStyle, transform: spin ? "rotate(90deg)" : undefined }}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M20 12a8 8 0 1 0-2.3 5.3" />
    <polyline points="20 12 20 6 14 6" />
  </svg>
);

const WarningIcon: React.FC = () => (
  <svg
    style={IconStyle}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#c0392b"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12" y2="17" />
  </svg>
);

const SpinnerIcon: React.FC = () => (
  <svg style={IconStyle} viewBox="0 0 50 50" aria-hidden>
    <circle
      cx="25"
      cy="25"
      r="20"
      fill="none"
      stroke="#2c9e6a"
      strokeWidth="4"
      strokeDasharray="80"
      strokeLinecap="round"
    />
  </svg>
);

/* ── Reward item icons ── */
const TicketIcon: React.FC = () => (
  <svg
    style={IconStyle}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="2" y="7" width="20" height="10" rx="2" />
    <path d="M7 7v10" />
    <path d="M17 7v10" />
  </svg>
);

const PickupIcon: React.FC = () => (
  <svg
    style={IconStyle}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <path d="M16 8h4l2 4v4" />
    <circle cx="5.5" cy="18.5" r="1.5" />
    <circle cx="18.5" cy="18.5" r="1.5" />
  </svg>
);

const TagIcon: React.FC = () => (
  <svg
    style={IconStyle}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M20.59 13.41L11 3 3 11l8.59 8.59a2 2 0 0 0 2.83 0L20.59 16.24a2 2 0 0 0 0-2.83z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </svg>
);

const MealIcon: React.FC = () => (
  <svg
    style={IconStyle}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M8 2v11" />
    <path d="M12 2v11" />
    <path d="M16 2v11" />
    <path d="M2 18h20" />
  </svg>
);

const HelmetIcon: React.FC = () => (
  <svg
    style={IconStyle}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 3C7 3 4 6 4 6v3h16V6s-3-3-8-3z" />
    <path d="M12 21v-8" />
    <path d="M4 12c0 4 4 7 8 7s8-3 8-7" />
  </svg>
);

const RupeeIcon: React.FC = () => (
  <svg
    style={IconStyle}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M9 8c2 2 4 4 6 6" />
    <path d="M8 21c3-1 5-1 8-1" />
  </svg>
);

function getIconForReward(id: string) {
  switch (id) {
    case "v100":
    case "voucher100":
      return <TicketIcon />;
    case "pickup":
      return <PickupIcon />;
    case "discount":
      return <TagIcon />;
    case "meal":
      return <MealIcon />;
    case "helmet":
      return <HelmetIcon />;
    default:
      return <RupeeIcon />;
  }
}

export default function RewardsPage(): React.ReactElement {
  const auth = useContext(AuthContext);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [redeemingUserId, setRedeemingUserId] = useState<string | null>(null);
  const [usingRewardId, setUsingRewardId] = useState<string | null>(null);
  const [redeemedUserRewards, setRedeemedUserRewards] = useState<string[]>([]);

  const [collectorData, setCollectorData] = useState<EarningsResponse | null>(null);
  const [loadingCollector, setLoadingCollector] = useState(false);
  const [collectorError, setCollectorError] = useState<string | null>(null);
  const [redeemingCollector, setRedeemingCollector] = useState(false);

  const [policy, setPolicy] = useState<Policy>({
    collector: { pointsPerPickup: 10, pointsPerKg: null },
    user: { pointsPerPickup: 0, pointsPerKg: null },
  });

  const [view, setView] = useState<"user" | "collector" | "both">("user");

  // modal for "used" reward details
  const [usedModalVisible, setUsedModalVisible] = useState(false);
  const [usedModalContent, setUsedModalContent] = useState<string | null>(null);

  const roleNormalized = useMemo(() => {
    const fromCtx = (auth?.roleState ?? "").toString().trim().toLowerCase();
    if (fromCtx) return fromCtx;
    const fromProfile = (profile?.role ?? "").toString().trim().toLowerCase();
    if (fromProfile) return fromProfile;
    return (localStorage.getItem("role") ?? "").toString().trim().toLowerCase();
  }, [auth?.roleState, profile]);

  const allowedTabs = useMemo(() => {
    if (!roleNormalized) return ["user", "collector", "both"];
    if (roleNormalized === "collector") return ["collector"];
    if (roleNormalized === "user") return ["user"];
    // admin or unknown -> show both
    return ["user", "collector", "both"];
  }, [roleNormalized]);

  /* load profile */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const res = await api.get<Profile>("/users/profile");
        if (!mounted) return;
        const p = res.data ?? null;
        setProfile(p);

        // Initialize redeemedUserRewards from server profile if present
        if (p) {
          if (Array.isArray((p as any).redeemedRewards)) {
            setRedeemedUserRewards((p as any).redeemedRewards.map(String));
          } else if (Array.isArray((p as any).redemptions)) {
            const ids = (p as any).redemptions
              .filter((r: any) => !r.status || String(r.status) !== "used")
              .map((r: any) => String(r.rewardId ?? r.reward?.id ?? r.rewardId));
            setRedeemedUserRewards(Array.from(new Set(ids)));
          }
        }

        const r = (auth?.roleState ?? p?.role ?? localStorage.getItem("role") ?? "")
          .toString()
          .trim()
          .toLowerCase();
        setView(r === "collector" ? "collector" : r === "user" ? "user" : "both");
      } catch (err: any) {
        if (!mounted) return;
        setProfileError(err?.response?.data?.message || err?.message || "Failed to load profile");
        setProfile(null);
        setView("both");
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [auth?.roleState]);

  /* load catalog policy (and optionally dynamic catalogs) */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await api.get("/rewards/catalog");
        if (!mounted) return;
        const p = r.data?.policy ?? {};
        setPolicy({
          collector: {
            pointsPerPickup: Number(p?.collector?.pointsPerPickup ?? 10),
            pointsPerKg: p?.collector?.pointsPerKg ?? null,
          },
          user: {
            pointsPerPickup: Number(p?.user?.pointsPerPickup ?? 0),
            pointsPerKg: p?.user?.pointsPerKg ?? null,
          },
        });
        // If your backend returns catalog arrays, you can swap to server-based catalogs here.
        // This page keeps static arrays as fallback.
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* fetch collector earnings */
  const fetchCollector = useCallback(async () => {
    setLoadingCollector(true);
    setCollectorError(null);
    try {
      const res = await api.get<EarningsResponse>("/waste/collector/earnings");
      setCollectorData(res.data ?? null);
    } catch (err: any) {
      if (!err?.response) setCollectorError("Network error — could not reach API.");
      else if (err.response.status === 401) setCollectorError("Unauthorized — please login");
      else if (err.response.status === 403) setCollectorError("Forbidden — collector only");
      else setCollectorError(err.response?.data?.message || err.message || "Failed to load collector earnings");
      setCollectorData(null);
    } finally {
      setLoadingCollector(false);
    }
  }, []);

  useEffect(() => {
    // Fetch collector if collector tab is visible and user is a collector
    if ((view === "collector" || view === "both") && roleNormalized === "collector") {
      fetchCollector();
    }
  }, [view, roleNormalized, fetchCollector]);

  /* derived */
  const userPoints = Number(profile?.points ?? 0);

  const collectorPayments = collectorData?.payments ?? [];
  const collectorTotalPickups = Number(collectorData?.totalPickups ?? 0);
  const collectorServerPoints = collectorData?.totalPoints;

  const collectorFromPayments = collectorPayments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const ptsPer = Number(policy.collector.pointsPerPickup || 10);
  const collectorFromPickups = collectorTotalPickups * ptsPer;

  // Prefer server-provided totalPoints; otherwise payments; otherwise estimate from pickups.
  // Important: Do NOT require payments>0, because deductions can make it <= 0.
  const collectorPointsAvailable =
    typeof collectorServerPoints === "number"
      ? collectorServerPoints
      : collectorPayments.length > 0
        ? collectorFromPayments
        : collectorFromPickups;

  function pickupsNeeded(rewardCost: number, current: number) {
    if (!ptsPer || ptsPer <= 0) return Infinity;
    return Math.ceil(Math.max(0, rewardCost - current) / ptsPer);
  }

  /* handlers */
  const handleUserRedeem = async (item: RewardItem) => {
    if (userPoints < item.cost) {
      alert("Not enough points");
      return;
    }
    if (!confirm(`Redeem ${item.cost} pts for "${item.title}"?`)) return;

    setRedeemingUserId(item.id);
    try {
      // Backend expects rewardId (send both for compatibility)
      const res = await api.post("/rewards/redeem", { rewardId: item.id, id: item.id });

      const body = res?.data;
      if (body?.profile) {
        setProfile(body.profile);

        if (body.redemption?.rewardId) {
          setRedeemedUserRewards((prev) =>
            prev.includes(String(body.redemption.rewardId)) ? prev : [...prev, String(body.redemption.rewardId)]
          );
        } else {
          setRedeemedUserRewards((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
        }
      } else {
        // fallback: refresh profile
        const r2 = await api.get<Profile>("/users/profile");
        setProfile(r2.data ?? null);
        setRedeemedUserRewards((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
      }

      alert("Redeemed successfully.");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Redeem failed");
    } finally {
      setRedeemingUserId(null);
    }
  };

  const handleUseReward = async (item: RewardItem) => {
    if (!redeemedUserRewards.includes(item.id)) {
      alert("You must redeem the reward before using it.");
      return;
    }
    if (!confirm(`Use "${item.title}" now?`)) return;

    setUsingRewardId(item.id);
    try {
      const res = await api.post("/rewards/use", { rewardId: item.id, id: item.id });
      const body = res?.data;

      let info = null;
      if (body?.redemption) {
        const r = body.redemption;
        info = r.code ?? r.voucher ?? r.voucherCode ?? r.message ?? null;
      }
      if (!info && body?.message) info = body.message;

      if (info) {
        setUsedModalContent(String(info));
        setUsedModalVisible(true);
      } else {
        alert("Reward used successfully.");
      }

      if (body?.profile) setProfile(body.profile);
      else {
        const r2 = await api.get<Profile>("/users/profile");
        setProfile(r2.data ?? null);
      }

      // remove from redeemed list (consumed)
      setRedeemedUserRewards((prev) => prev.filter((id) => id !== item.id));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to use reward");
    } finally {
      setUsingRewardId(null);
    }
  };

  const handleCollectorRedeem = async (reward: RewardItem) => {
    if (collectorPointsAvailable < reward.cost) {
      alert("Not enough collector points");
      return;
    }
    if (!confirm(`Redeem ${reward.cost} pts for "${reward.title}"?`)) return;

    setRedeemingCollector(true);
    try {
      await api.post("/waste/collector/redeem", { rewardId: reward.id, id: reward.id, cost: reward.cost });
      await fetchCollector();
      alert("Collector redemption submitted.");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Collector redeem failed");
    } finally {
      setRedeemingCollector(false);
    }
  };

  const fmtPoints = (v: number) => `${Number(v || 0).toLocaleString()} pts`;
  const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : "—");

  const LeftSidebar = useMemo(
    () => (roleNormalized === "collector" ? <CollectorSidebar /> : <Sidebar />),
    [roleNormalized]
  );

  const renderTabs = () => {
    if (allowedTabs.length === 1) {
      const label = allowedTabs[0] === "collector" ? "Collector" : allowedTabs[0] === "user" ? "User" : "Both";
      return <div className="rc-tab-label">{label}</div>;
    }
    return (
      <div className="rc-tabs" role="tablist" aria-label="Reward views">
        {allowedTabs.includes("user") && (
          <button
            type="button"
            role="tab"
            aria-selected={view === "user"}
            className={`rc-tab${view === "user" ? " rc-tab--active" : ""}`}
            onClick={() => setView("user")}
          >
            User rewards
          </button>
        )}
        {allowedTabs.includes("collector") && (
          <button
            type="button"
            role="tab"
            aria-selected={view === "collector"}
            className={`rc-tab${view === "collector" ? " rc-tab--active" : ""}`}
            onClick={() => setView("collector")}
          >
            Collector points
          </button>
        )}
        {allowedTabs.includes("both") && (
          <button
            type="button"
            role="tab"
            aria-selected={view === "both"}
            className={`rc-tab${view === "both" ? " rc-tab--active" : ""}`}
            onClick={() => setView("both")}
          >
            Both
          </button>
        )}
      </div>
    );
  };

  const refreshProfile = async () => {
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const r = await api.get<Profile>("/users/profile");
      setProfile(r.data ?? null);

      const p = r.data ?? null;
      if (p) {
        if (Array.isArray((p as any).redeemedRewards)) setRedeemedUserRewards((p as any).redeemedRewards.map(String));
        else if (Array.isArray((p as any).redemptions)) {
          const ids = (p as any).redemptions
            .filter((r: any) => !r.status || String(r.status) !== "used")
            .map((r: any) => String(r.rewardId ?? r.reward?.id ?? r.rewardId));
          setRedeemedUserRewards(Array.from(new Set(ids)));
        }
      }
    } catch (e: any) {
      setProfileError(e?.response?.data?.message || e?.message || "Failed");
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div className="ct-layout">
      <div className="ct-aside">{LeftSidebar}</div>

      <div className="ct-page">
        {renderTabs()}

        {(view === "user" || view === "both") && allowedTabs.includes("user") && (
          <section aria-labelledby="rc-user-title">
            <div className="rc-header">
              <div>
                <h2 id="rc-user-title" className="rc-title">
                  User Rewards
                </h2>
                <p className="rc-sub">Redeem offers using your accumulated points</p>
              </div>
              <button type="button" className="rc-btn rc-btn--ghost" onClick={refreshProfile}>
                {loadingProfile ? (
                  <>
                    <SpinnerIcon /> Refreshing…
                  </>
                ) : (
                  <>
                    <RefreshIcon /> Refresh
                  </>
                )}
              </button>
            </div>

            <div className="rc-profile" role="region" aria-label="User profile">
              {loadingProfile ? (
                <div className="rc-loading">Loading profile…</div>
              ) : profileError ? (
                <div className="rc-error">
                  <WarningIcon /> {profileError}
                </div>
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

            <div className="reward-list" aria-label="User reward catalog">
              {USER_CATALOG.map((item) => {
                const can = userPoints >= item.cost;
                const icon = getIconForReward(item.id);
                const isRedeemed = redeemedUserRewards.includes(item.id);

                return (
                  <div key={item.id} className="reward-item">
                    <div className="reward-left">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span className="reward-icon" aria-hidden>
                          {icon}
                        </span>
                        <div>
                          <div className="reward-title">{item.title}</div>
                          <div className="reward-desc">{item.description}</div>
                        </div>
                      </div>
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

                      <button
                        className={`rc-btn rc-btn--ghost${!isRedeemed ? " rc-btn--locked" : ""}`}
                        disabled={!isRedeemed || !!usingRewardId}
                        onClick={() => handleUseReward(item)}
                        title={isRedeemed ? `Use ${item.title}` : "Redeem first to use"}
                      >
                        {usingRewardId === item.id ? "Using…" : "Use"}
                      </button>

                      {isRedeemed && <div className="reward-badge">Redeemed</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {view === "both" && allowedTabs.includes("user") && allowedTabs.includes("collector") && <div className="rc-divider" />}

        {(view === "collector" || view === "both") && allowedTabs.includes("collector") && (
          <section aria-labelledby="rc-collector-title">
            <div className="rc-header">
              <div>
                <h2 id="rc-collector-title" className="rc-title">
                  Collector Points
                </h2>
                <p className="rc-sub">Ledger and redemptions for collectors</p>
              </div>
              <button type="button" className="rc-btn rc-btn--ghost" onClick={fetchCollector} disabled={loadingCollector}>
                {loadingCollector ? (
                  <>
                    <SpinnerIcon /> Refreshing…
                  </>
                ) : (
                  <>
                    <RefreshIcon /> Refresh
                  </>
                )}
              </button>
            </div>

            <div className="rc-profile" role="region" aria-label="Collector balance">
              {loadingCollector ? (
                <div className="rc-loading">Loading collector data…</div>
              ) : collectorError ? (
                <div className="rc-error">
                  <WarningIcon /> {collectorError}
                </div>
              ) : (
                <>
                  <div>
                    <div className="rc-profile__name">Points balance</div>
                    <div className="rc-profile__email">{collectorTotalPickups} pickups recorded</div>
                  </div>
                  <div className="rc-profile__balance">
                    <div className="rc-points-badge">{fmtPoints(collectorPointsAvailable)}</div>
                    <div className="rc-points-label">
                      {typeof collectorServerPoints === "number"
                        ? "Server balance"
                        : collectorPayments.length > 0
                          ? "Ledger total"
                          : `Est. from ${collectorTotalPickups} pickups`}
                    </div>
                  </div>
                </>
              )}
            </div>

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
                    {collectorPayments.map((p, idx) => (
                      <tr key={String(p.id ?? p._id ?? idx)}>
                        <td>{fmtDate(p.date)}</td>
                        <td>{Number(p.amount ?? 0)} pts</td>
                        <td>{p.method ?? "—"}</td>
                        <td>{p.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="reward-list" aria-label="Collector reward catalog">
              {COLLECTOR_REWARDS.map((r) => {
                const affordable = collectorPointsAvailable >= r.cost;
                const picksNeeded = pickupsNeeded(r.cost, collectorPointsAvailable);
                const icon = getIconForReward(r.id);

                return (
                  <div key={r.id} className="reward-item">
                    <div className="reward-left">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span className="reward-icon" aria-hidden>
                          {icon}
                        </span>
                        <div>
                          <div className="reward-title">{r.title}</div>
                          <div className="reward-desc">{r.description}</div>
                        </div>
                      </div>
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

      {usedModalVisible && (
        <div className="used-modal-overlay" role="dialog" aria-modal="true">
          <div className="used-modal">
            <h3>Reward details</h3>
            <pre style={{ whiteSpace: "pre-wrap" }}>{usedModalContent ?? "Used successfully."}</pre>
            <div style={{ textAlign: "right", marginTop: 12 }}>
              <button className="rc-btn" onClick={() => setUsedModalVisible(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}