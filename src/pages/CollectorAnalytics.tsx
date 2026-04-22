import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import CollectorSidebar from "../components/CollectorSidebar";
import "./CollectorAnalytics.css";

/* ── Types ── */
type KPI             = { assigned: number; completedMonth: number; kgCollected: number; points: number };
type SeriesPoint     = { date: string; pickups: number; kg: number; points?: number };
type AnalyticsResponse = {
  kpis: KPI;
  series: SeriesPoint[];
  statusCounts: Record<string, number>;
  topZones: { zone: string; pickups: number; kg: number }[];
  avgPickupTimeMinutes?: number;
};

/* ── Helpers ── */
function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/* ── Small inline SVG icons (no external deps) ── */
const smallIconStyle: React.CSSProperties = { width: 16, height: 16, display: "inline-block", verticalAlign: "middle", marginRight: 8, flexShrink: 0 };

const RefreshIcon: React.FC<{ spin?: boolean }> = ({ spin }) => (
  <svg style={{ ...smallIconStyle, transform: spin ? "rotate(90deg)" : undefined }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 12a8 8 0 1 0-2.3 5.3" />
    <polyline points="20 12 20 6 14 6" />
  </svg>
);

const WarningIcon: React.FC = () => (
  <svg style={smallIconStyle} viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12" y2="17" />
  </svg>
);

const DownloadIcon: React.FC = () => (
  <svg style={smallIconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/* ── SVG Line Chart ── */
function LineChart({
  data, height = 140, color = "#1a8a3c", valueKey = "pickups",
}: {
  data: SeriesPoint[]; height?: number; color?: string; valueKey?: "pickups" | "kg" | "points";
}) {
  if (!data || data.length === 0) return <div style={{ height }} />;

  const values = data.map((d) => Number((d as any)[valueKey] ?? 0));
  const max    = Math.max(...values, 1);
  const min    = Math.min(...values, 0);
  const pad    = 8;
  const width  = Math.max(240, data.length * 36);
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const stepX  = innerW / Math.max(1, data.length - 1);

  const pts = values.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + innerH - ((v - min) / (max - min || 1)) * innerH,
  }));

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `M ${pad},${pad + innerH} L ${pts.map((p) => `${p.x},${p.y}`).join(" L ")} L ${pad + innerW},${pad + innerH} Z`;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id="ca-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#ca-grad)" />
        <polyline fill="none" stroke={color} strokeWidth="2" points={polyline} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y}
            r={i === pts.length - 1 ? 4.5 : 3}
            fill={color}
            opacity={i === pts.length - 1 ? 1 : 0.8}
            stroke="#fff"
            strokeWidth={i === pts.length - 1 ? 2 : 1}
          />
        ))}
      </svg>
    </div>
  );
}

/* ── Bar Chart (Top Zones) ── */
function Bars({ items }: { items: { label: string; value: number }[] }) {
  if (!items || items.length === 0) return <div style={{ color: "var(--text-3)", fontSize: 13 }}>No data</div>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div>
      {items.map((it) => (
        <div key={it.label} className="ca-bar-row">
          <div className="ca-bar-label">{it.label}</div>
          <div className="ca-bar-track">
            <div className="ca-bar-fill" style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
          <div className="ca-bar-val">{formatNumber(it.value)}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Component ── */
export default function CollectorAnalytics(): JSX.Element {
  const navigate = useNavigate();

  const [data,        setData]        = useState<AnalyticsResponse | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [range,       setRange]       = useState<"7" | "30" | "90">("30");
  const [metric,      setMetric]      = useState<"pickups" | "kg" | "points">("pickups");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [intervalSec, setIntervalSec] = useState(30);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const pollRef = useRef<number | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get<AnalyticsResponse>(`/collector/analytics?range=${range}`, { signal });
      setData(res.data);
      setLastUpdated(Date.now());
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      if (!err?.response) { setError("Unable to reach server. Check backend."); }
      else if (err.response?.status === 401) {
        ["accessToken","token","user"].forEach((k) => { try { localStorage.removeItem(k); } catch {} });
        navigate("/login");
        return;
      } else {
        setError(err.response?.data?.message || "Failed to load analytics");
      }
    } finally { setLoading(false); }
  }, [range, navigate]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load, range]);

  useEffect(() => {
    if (autoRefresh) {
      pollRef.current = window.setInterval(() => load(), Math.max(5000, intervalSec * 1000));
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    return () => {};
  }, [autoRefresh, intervalSec, load]);

  const series         = data?.series ?? [];
  const kpis           = data?.kpis ?? { assigned: 0, completedMonth: 0, kgCollected: 0, points: 0 };
  const topZones       = useMemo(() => (data?.topZones ?? []).map((z) => ({ label: z.zone, value: z.kg })), [data]);
  const statusBreakdown= useMemo(() => Object.entries(data?.statusCounts ?? {}).map(([k, v]) => ({ label: k, value: v })).sort((a, b) => b.value - a.value), [data]);

  function exportCSV(rows: string[][], filename: string) {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a   = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })),
      download: filename,
    });
    document.body.appendChild(a); a.click(); a.remove();
  }

  const KPI_CARDS = [
    { label: "Assigned",     value: formatNumber(kpis.assigned),         desc: "Currently assigned pickups"        },
    { label: "Completed",    value: formatNumber(kpis.completedMonth),    desc: "Pickups completed in range"         },
    { label: "Kg Collected", value: formatNumber(kpis.kgCollected),       desc: "Total kilograms collected"          },
    { label: "Points",       value: formatNumber(kpis.points ?? 0),       desc: "Collector points (total/current)"  },
  ];

  return (
    <div className="ca-root">
      <CollectorSidebar />

      <main className="ca-main">

        {/* ── Header ── */}
        <div className="ca-header">
          <div>
            <h2 className="ca-header__title">Performance &amp; Analytics</h2>
            <p className="ca-header__sub">Overview of your recent performance and pickup metrics</p>
          </div>
          <div className="ca-header__actions">
            {lastUpdated && (
              <span className="ca-updated">
                updated {Math.round((Date.now() - lastUpdated) / 1000)}s ago
              </span>
            )}
            <button className="ca-btn" onClick={() => load()} disabled={loading}>
              <RefreshIcon spin={loading} />
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <label className="ca-auto-pill">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              Auto-refresh
              {autoRefresh && (
                <select value={intervalSec} onChange={(e) => setIntervalSec(Number(e.target.value))}>
                  <option value={15}>15s</option>
                  <option value={30}>30s</option>
                  <option value={60}>60s</option>
                </select>
              )}
            </label>
          </div>
        </div>

        {/* ── Skeleton ── */}
        {loading && (
          <>
            <div className="ca-kpi-grid">
              {[0,1,2,3].map((i) => <div key={i} className="ca-skeleton" style={{ height: 96 }} />)}
            </div>
            <div className="ca-skeleton" style={{ height: 220 }} />
          </>
        )}

        {/* ── Error / Empty ── */}
        {!loading && error  && (
          <div className="ca-error" role="alert">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <WarningIcon />
              <div className="ch-error__msg">{error}</div>
            </div>
          </div>
        )}
        {!loading && !error && !data && <div className="ca-empty">No analytics available.</div>}

        {/* ── Content ── */}
        {!loading && !error && data && (
          <>
            {/* KPI row */}
            <div className="ca-kpi-grid">
              {KPI_CARDS.map((k) => (
                <div key={k.label} className="ca-kpi">
                  <div className="ca-kpi__label">{k.label}</div>
                  <div className="ca-kpi__value">{k.value}</div>
                  <div className="ca-kpi__desc">{k.desc}</div>
                </div>
              ))}
            </div>

            {/* Trend + aside */}
            <div className="ca-grid">
              <div className="ca-card">
                <div className="ca-card__head">
                  <div className="ca-card__title">Trend — {metric}</div>
                  <div className="ca-card__controls">
                    <select className="ca-select" value={metric} onChange={(e) => setMetric(e.target.value as any)}>
                      <option value="pickups">Pickups</option>
                      <option value="kg">Kg</option>
                      <option value="points">Points</option>
                    </select>
                    <select className="ca-select" value={range} onChange={(e) => setRange(e.target.value as any)}>
                      <option value="7">7 days</option>
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                    </select>
                    <button className="ca-btn ca-btn--sm" onClick={() => {
                      if (!series.length) { alert("No data"); return; }
                      exportCSV(
                        [["date","pickups","kg","points"], ...series.map((s) => [s.date, String(s.pickups), String(s.kg), String(s.points ?? 0)])],
                        `collector_series_${new Date().toISOString().slice(0,10)}.csv`
                      );
                    }}>
                      <DownloadIcon /> CSV
                    </button>
                  </div>
                </div>

                <LineChart data={series} valueKey={metric} />

                <div className="ca-chart-meta">
                  <div className="ca-chart-meta__item">
                    Latest: <strong>{series.length ? (series[series.length - 1] as any)[metric] ?? 0 : 0}</strong>
                  </div>
                  <div className="ca-chart-meta__item">
                    Avg pickup time: <strong>{data.avgPickupTimeMinutes ? `${data.avgPickupTimeMinutes.toFixed(1)} min` : "—"}</strong>
                  </div>
                </div>
              </div>

              <aside className="ca-aside">
                <div className="ca-card">
                  <div className="ca-card__head">
                    <div className="ca-card__title">Status breakdown</div>
                  </div>
                  <div className="ca-status-chips">
                    {statusBreakdown.map((s) => (
                      <div key={s.label} className="ca-chip">
                        <span className="ca-chip__count">{s.value}</span>
                        <span className="ca-chip__label">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ca-card">
                  <div className="ca-card__head">
                    <div className="ca-card__title">Top zones (kg)</div>
                    <button className="ca-btn ca-btn--sm" onClick={() => {
                      if (!data.topZones?.length) { alert("No data"); return; }
                      exportCSV(
                        [["zone","pickups","kg"], ...data.topZones.map((z) => [z.zone, String(z.pickups), String(z.kg)])],
                        `collector_zones_${new Date().toISOString().slice(0,10)}.csv`
                      );
                    }}>
                      <DownloadIcon /> CSV
                    </button>
                  </div>
                  <Bars items={topZones} />
                </div>
              </aside>
            </div>

            {/* Recent data table */}
            <div className="ca-card">
              <div className="ca-card__head">
                <div className="ca-card__title">Recent data</div>
                <span className="ca-table-count">{series.length} data points</span>
              </div>
              <div className="ca-table-wrap">
                <table className="ca-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Pickups</th>
                      <th>Kg</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.slice().reverse().map((s) => (
                      <tr key={s.date}>
                        <td>{new Date(s.date).toLocaleDateString()}</td>
                        <td>{s.pickups}</td>
                        <td>{s.kg}</td>
                        <td>{s.points ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}