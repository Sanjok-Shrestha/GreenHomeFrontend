import React, { useEffect, useMemo, useState, type JSX } from "react";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";

type Payment = {
  id: string;
  date: string; // ISO string
  amount: number;
  method?: string;
  note?: string;
};

type EarningsResponse = {
  totalPickups: number;
  totalEarnings: number;
  payments?: Payment[];
};

/**
 * API base selection without using `process`.
 * - If you set window.__API_BASE__ (in index.html) it will be used.
 * - Otherwise it falls back to '' (relative URLs) so CRA dev proxy or same-origin servers work.
 */
const API_BASE: string =
  (typeof window !== "undefined" && (window as any).__API_BASE__) || "";

/* ------------------------- Inline icons (small SVGs) ------------------------- */
const IconRefresh = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M21 12a9 9 0 10-3.2 6.55" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 12v6h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconExport = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 3v12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3" y="17" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const IconCalendar = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const IconMoney = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="2" y="7" width="20" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="2.25" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const IconRow = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/* --- Inline SVG icons for payment methods (professional, non-emoji) --- */
const IconCash = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="2" y="7" width="20" height="10" rx="2" fill="#e6fff0" stroke="#169650" strokeWidth="1.2" />
    <circle cx="12" cy="12" r="2.1" fill="#169650" />
    <path d="M7 12h10" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const IconBank = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 3l9 5v2H3V8l9-5z" fill="#f0fff4" stroke="#0b6efd" strokeWidth="1.2" />
    <path d="M5 10v6M9 10v6M13 10v6M17 10v6" stroke="#0b6efd" strokeWidth="1.2" strokeLinecap="round" />
    <rect x="3" y="16" width="18" height="3" rx="1" fill="#ffffff" stroke="#0b6efd" strokeWidth="1.0" />
  </svg>
);

const IconCard = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="2.5" y="6" width="19" height="12" rx="2" fill="#fff8e6" stroke="#ffd166" strokeWidth="1.2" />
    <rect x="4.5" y="9.2" width="6" height="1.6" rx="0.8" fill="#ffd166" />
    <circle cx="17.5" cy="12" r="1.4" fill="#ffd166" />
  </svg>
);

const IconDefault = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" fill="#f3f6ff" stroke="#7b8cff" strokeWidth="1.2" />
    <path d="M8 12h8" stroke="#7b8cff" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/* --- Updated methodToIcon returning JSX --- */
function methodToIconJSX(method?: string): JSX.Element {
  const m = (method ?? "").toLowerCase();
  if (m.includes("cash")) return <IconCash />;
  if (m.includes("bank") || m.includes("upi") || m.includes("transfer")) return <IconBank />;
  if (m.includes("card")) return <IconCard />;
  return <IconDefault />;
}

/* ------------------------- Component ------------------------- */
const CollectorEarnings: React.FC = () => {
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>(""); // yyyy-mm-dd
  const [toDate, setToDate] = useState<string>("");
  const navigate = useNavigate();

  const token =
    typeof window !== "undefined" &&
    (localStorage.getItem("accessToken") || localStorage.getItem("token"));

  const fetchEarnings = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const res = await axios.get<EarningsResponse>(
        `${API_BASE}/api/waste/collector/earnings`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        }
      );
      setData(res.data);
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr?.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }
      if ((axiosErr as any)?.code === "ERR_CANCELED") {
        // cancelled
      } else {
        console.error("Earnings load failed:", err);
        setError("Failed to load earnings. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchEarnings(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const payments = data?.payments ?? [];

  const filteredPayments = useMemo(() => {
    if (!fromDate && !toDate) return payments;
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    return payments.filter((p) => {
      const d = new Date(p.date);
      if (from && d < from) return false;
      if (to) {
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);
        if (d > toEnd) return false;
      }
      return true;
    });
  }, [payments, fromDate, toDate]);

  const aggregate = useMemo(() => {
    const totalPickups = filteredPayments.length;
    const totalEarnings = filteredPayments.reduce((s, p) => s + p.amount, 0);
    return { totalPickups, totalEarnings };
  }, [filteredPayments]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(v);

  const handleExportCSV = () => {
    if (!filteredPayments.length) {
      alert("No payments to export.");
      return;
    }
    const header = ["ID", "Date", "Amount", "Method", "Note"];
    const rows = filteredPayments.map((p) => [
      p.id,
      new Date(p.date).toLocaleString(),
      p.amount.toString(),
      p.method ?? "",
      (p.note ?? "").replace(/\r?\n|\r/g, " "),
    ]);
    const csvContent =
      [header, ...rows]
        .map((r) =>
          r
            .map((c) => `"${String(c).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `collector_earnings_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleRetry = () => {
    const controller = new AbortController();
    fetchEarnings(controller.signal);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={styles.iconTile}>
            <IconMoney size={20} />
          </div>
          <div>
            <h2 style={styles.title}>My Earnings</h2>
            <p style={styles.subtitle}>Completed pickups & payments</p>
          </div>
        </div>

        <div style={styles.controls}>
          <button
            title="Refresh"
            aria-label="Refresh earnings"
            style={{ ...styles.iconButton, marginRight: 8 }}
            onClick={() => fetchEarnings()}
          >
            <IconRefresh />
            <span style={styles.iconButtonLabel}>Refresh</span>
          </button>

          <button
            title="Export CSV"
            aria-label="Export CSV"
            style={{ ...styles.iconButton }}
            onClick={handleExportCSV}
          >
            <IconExport />
            <span style={styles.iconButtonLabel}>Export CSV</span>
          </button>
        </div>
      </div>

      <div style={styles.filters}>
        <label style={styles.filterLabel}>
          <div style={styles.filterLabelTop}><IconCalendar size={14} /> <span style={{ marginLeft: 8 }}>From</span></div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={styles.dateInput}
          />
        </label>

        <label style={styles.filterLabel}>
          <div style={styles.filterLabelTop}><IconCalendar size={14} /> <span style={{ marginLeft: 8 }}>To</span></div>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={styles.dateInput}
          />
        </label>

        <button
          style={{ ...styles.button, marginLeft: 8 }}
          onClick={() => {
            setFromDate("");
            setToDate("");
          }}
        >
          Clear
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading earnings...</div>
      ) : error ? (
        <div style={styles.errorRow}>
          <span>{error}</span>
          <button
            style={{ ...styles.button, marginLeft: 12 }}
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div style={styles.summary}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryIcon}><IconRow /></div>
              <div style={styles.summaryLabel}>Total Pickups</div>
              <div style={styles.summaryValue}>
                {data ? data.totalPickups : aggregate.totalPickups}
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.summaryIcon}><IconMoney /></div>
              <div style={styles.summaryLabel}>Total Earnings</div>
              <div style={styles.summaryValue}>
                {data
                  ? formatCurrency(data.totalEarnings)
                  : formatCurrency(aggregate.totalEarnings)}
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.summaryIcon}>📄</div>
              <div style={styles.summaryLabel}>Showing Pickups</div>
              <div style={styles.summaryValue}>{aggregate.totalPickups}</div>
              <div style={styles.smallText}>
                {aggregate.totalPickups
                  ? formatCurrency(aggregate.totalEarnings)
                  : "—"}
              </div>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            {filteredPayments.length === 0 ? (
              <div style={styles.empty}>
                No payments found for selected range.
              </div>
            ) : (
              <table style={styles.table} aria-label="Payments table">
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Method</th>
                    <th style={styles.th}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments
                    .slice()
                    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                    .map((p) => (
                      <tr key={p.id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.rowDate}>
                            <div style={styles.rowDateLeft}>
                              <div style={styles.smallMuted}>{new Date(p.date).toLocaleDateString()}</div>
                              <div style={styles.smallMutedTime}>{new Date(p.date).toLocaleTimeString()}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...styles.td, ...styles.amountCell }}>
                          <div style={styles.amountWrap}>
                            <div style={styles.amountValue}>{formatCurrency(p.amount)}</div>
                            <div style={styles.amountSub}>{p.id}</div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.methodCell}>
                            <span style={styles.methodIcon}>{methodToIconJSX(p.method)}</span>
                            <span style={{ marginLeft: 8 }}>{p.method ?? "—"}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.noteCell}>{p.note ?? "—"}</div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CollectorEarnings;

/* Styles */
const styles: { [k: string]: React.CSSProperties } = {
  container: { padding: 20, maxWidth: 1100, margin: "0 auto", fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconTile: { width: 48, height: 48, borderRadius: 10, background: "linear-gradient(90deg,#eaffef,#f0fff4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(17,120,68,0.06)" },
  title: { margin: 0, fontSize: 20 },
  subtitle: { margin: 0, color: "#666", fontSize: 13 },
  controls: { display: "flex", alignItems: "center" },

  iconButton: { display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid #e6eef0", background: "#fff", cursor: "pointer", fontWeight: 700 },
  iconButtonLabel: { fontSize: 13 },

  filters: { display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" },
  filterLabel: { display: "flex", flexDirection: "column", fontSize: 12, color: "#333" },
  filterLabelTop: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#444", marginBottom: 6 },
  dateInput: { marginTop: 0, padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd" },

  loading: { padding: 20, color: "#555" },
  errorRow: { display: "flex", alignItems: "center", gap: 12, color: "crimson", padding: 12 },

  summary: { display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" },
  summaryCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
    minWidth: 180,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  summaryIcon: { width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#0b6efd" },
  summaryLabel: { color: "#666", fontSize: 12 },
  summaryValue: { fontSize: 18, fontWeight: 800, marginTop: 6 },
  smallText: { color: "#888", fontSize: 12, marginTop: 4 },

  tableWrapper: { background: "#fff", borderRadius: 8, padding: 8, boxShadow: "0 6px 20px rgba(0,0,0,0.04)" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #eee", fontSize: 13, color: "#444" },
  td: { padding: "10px 12px", borderBottom: "1px solid #f3f3f3", fontSize: 13, verticalAlign: "top" },
  tr: {},

  rowDate: { display: "flex", gap: 12, alignItems: "center" },
  rowDateLeft: {},
  smallMuted: { fontSize: 13, color: "#444", fontWeight: 700 },
  smallMutedTime: { fontSize: 12, color: "#888" },

  amountCell: { width: 180 },
  amountWrap: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
  amountValue: { fontWeight: 800, color: "#153" },
  amountSub: { fontSize: 11, color: "#999" },

  methodCell: { display: "flex", alignItems: "center" },
  methodIcon: { display: "inline-flex", alignItems: "center" },

  noteCell: { color: "#444" },

  empty: { padding: 20, color: "#666" },
};