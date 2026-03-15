import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

/**
 * CollectorAnalytics.tsx
 *
 * Lightweight analytics page for collectors.
 * - Fetches analytics from GET /api/collector/analytics
 * - Renders KPI cards, a pickups line chart, a kg-collected bar chart, status breakdown, and top zones table
 *
 * Expected backend response (example shape):
 * {
 *   kpis: { assigned: number, completedMonth: number, kgCollected: number, earnings: number },
 *   series: [{ date: "2026-03-01", pickups: 4, kg: 120, earnings: 450 }, ...], // daily or weekly
 *   statusCounts: { pending: 3, scheduled: 5, picked: 2, collected: 10 },
 *   topZones: [{ zone: "Tokha", pickups: 12, kg: 340 }, ...],
 *   avgPickupTimeMinutes: 18.5
 * }
 *
 * If your API uses a different path or shape, adjust the fetch and typings below.
 */

type KPI = {
  assigned: number;
  completedMonth: number;
  kgCollected: number;
  earnings: number;
};

type SeriesPoint = {
  date: string; // ISO date or label
  pickups: number;
  kg: number;
  earnings?: number;
};

type AnalyticsResponse = {
  kpis: KPI;
  series: SeriesPoint[];
  statusCounts: Record<string, number>;
  topZones: { zone: string; pickups: number; kg: number }[];
  avgPickupTimeMinutes?: number;
};

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/* Simple SVG line chart (no deps) */
function LineChart({
  data,
  width = 680,
  height = 120,
  color = "#2c9f4a",
  valueKey = "pickups",
}: {
  data: SeriesPoint[];
  width?: number;
  height?: number;
  color?: string;
  valueKey?: "pickups" | "kg" | "earnings";
}) {
  if (!data || data.length === 0) return <div style={{ height }} />;

  const values = data.map((d) => d[valueKey] ?? 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const pad = 6;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const stepX = innerW / Math.max(1, data.length - 1);

  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + innerH - ((v - min) / (max - min || 1)) * innerH;
    return `${x},${y}`;
  });

  const areaPath = `M ${pad},${pad + innerH} L ${points.join(" L ")} L ${pad + innerW},${pad + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="Trend chart">
      <defs>
        <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* area */}
      <path d={areaPath} fill="url(#grad)" stroke="none" />

      {/* line */}
      <polyline fill="none" stroke={color} strokeWidth={2.2} points={points.join(" ")} strokeLinecap="round" strokeLinejoin="round" />

      {/* points */}
      {points.map((pt, i) => {
        const [x, y] = pt.split(",").map(Number);
        return <circle key={i} cx={x} cy={y} r={i === data.length - 1 ? 3.8 : 2.6} fill={color} opacity={i === data.length - 1 ? 1 : 0.9} />;
      })}
    </svg>
  );
}

/* Simple horizontal bar chart for top zones (kg) */
function Bars({
  items,
  maxW = 320,
}: {
  items: { label: string; value: number }[];
  maxW?: number;
}) {
  if (!items || items.length === 0) return <div style={{ color: "#666" }}>No data</div>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((it) => {
        const w = Math.round((it.value / max) * (maxW - 60));
        return (
          <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 120, fontSize: 13, color: "#334" }}>{it.label}</div>
            <div style={{ background: "#eef8f0", height: 12, flex: "0 0 auto", width: maxW, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: `${w}px`, maxWidth: "100%", height: "100%", background: "#2c9f4a" }} />
            </div>
            <div style={{ marginLeft: 8, minWidth: 36, textAlign: "right", color: "#334", fontWeight: 700 }}>{formatNumber(it.value)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function CollectorAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"7" | "30" | "90">("30");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const res = await api.get<AnalyticsResponse>(`/api/collector/analytics?range=${range}`);
        if (!mounted) return;
        setData(res.data);
      } catch (err: any) {
        console.error("Failed to load analytics", err);
        if (!mounted) return;
        if (!err?.response) setError("Unable to reach server. Is backend running?");
        else setError(err.response?.data?.message || "Failed to load analytics");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [range]);

  const series = data?.series ?? [];

  const pickupsSeries = useMemo(() => series.map((s) => ({ date: s.date, pickups: s.pickups, kg: s.kg, earnings: s.earnings })), [series]);

  const topZones = (data?.topZones ?? []).map((z) => ({ label: z.zone, value: z.kg }));

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Performance & Analytics</h2>
          <div style={{ color: "#666", marginTop: 6 }}>Overview of your recent performance and pickup metrics</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate(-1)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", background: "#fff" }}>
            ← Back
          </button>

          <div style={{ display: "flex", gap: 6, alignItems: "center", background: "#fff", padding: 6, borderRadius: 8, border: "1px solid #eee" }}>
            <button
              onClick={() => setRange("7")}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                background: range === "7" ? "#2c9f4a" : "transparent",
                color: range === "7" ? "#fff" : "#2c9f4a",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              7d
            </button>
            <button
              onClick={() => setRange("30")}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                background: range === "30" ? "#2c9f4a" : "transparent",
                color: range === "30" ? "#fff" : "#2c9f4a",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              30d
            </button>
            <button
              onClick={() => setRange("90")}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                background: range === "90" ? "#2c9f4a" : "transparent",
                color: range === "90" ? "#fff" : "#2c9f4a",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              90d
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 20, color: "#666" }}>Loading analytics…</div>
      ) : error ? (
        <div style={{ padding: 20, color: "crimson" }}>{error}</div>
      ) : !data ? (
        <div style={{ padding: 20 }}>No analytics available.</div>
      ) : (
        <>
          {/* KPI row */}
          <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px", background: "#fff", padding: 16, borderRadius: 10, boxShadow: "0 8px 18px rgba(11,36,18,0.04)" }}>
              <div style={{ color: "#666", fontSize: 13 }}>Assigned</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{formatNumber(data.kpis.assigned)}</div>
              <div style={{ color: "#888", marginTop: 8 }}>Currently assigned pickups</div>
            </div>

            <div style={{ flex: "1 1 200px", background: "#fff", padding: 16, borderRadius: 10, boxShadow: "0 8px 18px rgba(11,36,18,0.04)" }}>
              <div style={{ color: "#666", fontSize: 13 }}>Completed (month)</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{formatNumber(data.kpis.completedMonth)}</div>
              <div style={{ color: "#888", marginTop: 8 }}>Completed pickups this month</div>
            </div>

            <div style={{ flex: "1 1 200px", background: "#fff", padding: 16, borderRadius: 10, boxShadow: "0 8px 18px rgba(11,36,18,0.04)" }}>
              <div style={{ color: "#666", fontSize: 13 }}>Kg Collected</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{formatNumber(data.kpis.kgCollected)}</div>
              <div style={{ color: "#888", marginTop: 8 }}>Total kilograms collected</div>
            </div>

            <div style={{ flex: "1 1 200px", background: "#fff", padding: 16, borderRadius: 10, boxShadow: "0 8px 18px rgba(11,36,18,0.04)" }}>
              <div style={{ color: "#666", fontSize: 13 }}>Earnings</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>Rs {formatNumber(data.kpis.earnings)}</div>
              <div style={{ color: "#888", marginTop: 8 }}>Estimated payouts</div>
            </div>
          </div>

          {/* Charts and breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginTop: 16 }}>
            <div style={{ background: "#fff", padding: 12, borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 800 }}>Pickups trend</div>
                <div style={{ color: "#666", fontSize: 13 }}>{series.length} points</div>
              </div>

              <div style={{ width: "100%", height: 140 }}>
                <LineChart data={pickupsSeries} valueKey="pickups" />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                <div style={{ color: "#666", fontSize: 13 }}>Latest: <strong style={{ color: "#20382b" }}>{series.length ? series[series.length - 1].pickups : 0} pickups</strong></div>
                <div style={{ color: "#666", fontSize: 13 }}>Avg pickup time: <strong style={{ color: "#20382b" }}>{data.avgPickupTimeMinutes ? `${data.avgPickupTimeMinutes.toFixed(1)} min` : "—"}</strong></div>
              </div>
            </div>

            <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "#fff", padding: 12, borderRadius: 10 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Status breakdown</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.entries(data.statusCounts).map(([k, v]) => (
                    <div key={k} style={{ background: "#f7fff7", padding: "6px 10px", borderRadius: 8, display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ fontWeight: 800, color: "#20382b" }}>{v}</div>
                      <div style={{ color: "#666", textTransform: "capitalize" }}>{k}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "#fff", padding: 12, borderRadius: 10 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Top zones (by kg)</div>
                <div style={{ minHeight: 120 }}>
                  <Bars items={topZones} maxW={180} />
                </div>
              </div>
            </aside>
          </div>

          {/* Table of recent series values */}
          <div style={{ marginTop: 12, background: "#fff", padding: 12, borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 800 }}>Recent data</div>
              <div style={{ color: "#666", fontSize: 13 }}>Date • pickups • kg • earnings</div>
            </div>

            <div style={{ marginTop: 12, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#666", fontSize: 13 }}>
                    <th style={{ padding: "8px 6px" }}>Date</th>
                    <th style={{ padding: "8px 6px" }}>Pickups</th>
                    <th style={{ padding: "8px 6px" }}>Kg</th>
                    <th style={{ padding: "8px 6px" }}>Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {series.slice().reverse().map((s) => (
                    <tr key={s.date} style={{ borderTop: "1px solid #f2f2f2" }}>
                      <td style={{ padding: "8px 6px" }}>{new Date(s.date).toLocaleDateString()}</td>
                      <td style={{ padding: "8px 6px", fontWeight: 800 }}>{s.pickups}</td>
                      <td style={{ padding: "8px 6px" }}>{s.kg}</td>
                      <td style={{ padding: "8px 6px" }}>Rs {s.earnings ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}