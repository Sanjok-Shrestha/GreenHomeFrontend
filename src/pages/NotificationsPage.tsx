import React, { useEffect, useState } from "react";
import api from "../api";
import Sidebar from "../components/Sidebar";

type Notification = {
  _id: string;
  title: string;
  message: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
};

export default function NotificationsPage(): React.JSX.Element {
  const [items, setItems] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async (opts?: { page?: number }) => {
    const newPage = opts?.page ?? page;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/notifications", {
        params: { page: newPage, pageSize },
      });
      const data = res.data;
      setItems(data?.data || []);
      setTotal(data?.total || 0);
      setPage(data?.page || newPage);
    } catch (err: any) {
      console.error("fetchNotifications error", err);
      setError(err?.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (text: string, ttl = 1400) => {
    const n = document.createElement("div");
    n.textContent = text;
    Object.assign(n.style, {
      position: "fixed",
      right: "18px",
      bottom: "22px",
      background: "#1a6b45",
      color: "#fff",
      padding: "9px 14px",
      borderRadius: "9px",
      fontSize: "13px",
      fontWeight: "500",
      zIndex: "9999",
      boxShadow: "0 4px 16px rgba(26,107,69,0.25)",
    });
    document.body.appendChild(n);
    setTimeout(() => {
      try { document.body.removeChild(n); } catch {}
    }, ttl);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/mark-all-read");
      showToast("All notifications marked as read ✓");
      await fetchNotifications();
    } catch (err: any) {
      console.error("markAllRead error", err);
      showToast(err?.response?.data?.message || "Failed to mark all read");
    }
  };

  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const handlePrev = () => { if (page > 1) fetchNotifications({ page: page - 1 }); };
  const handleNext = () => { if (page < maxPage) fetchNotifications({ page: page + 1 }); };

  return (
    <>
      <style>{notifCss}</style>
      <div className="nt-root">
        <Sidebar />
        <main className="nt-main">
          <div className="nt-inner">
            <div className="nt-header">
              <h2 className="nt-title">Notifications</h2>
              <div className="nt-header-actions">
                <button
                  className="nt-btn nt-btn--primary"
                  onClick={() => fetchNotifications()}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Refresh"}
                </button>
                <button
                  className="nt-btn nt-btn--primary"
                  onClick={handleMarkAllRead}
                  disabled={loading || items.length === 0}
                >
                  Mark all read
                </button>
              </div>
            </div>

            <div className="nt-total">Total: {total}</div>

            {error && <div className="nt-error">{error}</div>}

            {!loading && !error && items.length === 0 && (
              <div className="nt-empty">No notifications yet.</div>
            )}

            {!loading && !error && items.length > 0 && (
              <div className="nt-list">
                {items.map((n) => (
                  <div
                    key={n._id}
                    className={`nt-item ${n.read ? "nt-item--read" : "nt-item--unread"}`}
                  >
                    <div className="nt-item-header">
                      <div className="nt-item-title">{n.title}</div>
                      {n.createdAt && (
                        <div className="nt-item-date">
                          {new Date(n.createdAt).toLocaleString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                    <div className="nt-item-message">{n.message}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="nt-pagination">
              <button className="nt-btn" onClick={handlePrev} disabled={page <= 1 || loading}>
                Prev
              </button>
              <span className="nt-page-label">Page {page}</span>
              <button
                className="nt-btn"
                onClick={handleNext}
                disabled={page >= maxPage || loading}
              >
                Next
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

const notifCss = `
  .nt-root { display: flex; min-height: 100vh; background: #f4faf6; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .nt-main { flex: 1; padding: 32px 28px; box-sizing: border-box; }
  .nt-inner { max-width: 800px; margin: 0 auto; }
  .nt-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
  .nt-title { font-size: 20px; font-weight: 500; margin: 0; color: #1a3326; }
  .nt-header-actions { display: flex; gap: 8px; }
  .nt-total { font-size: 14px; color: #4a6b56; margin-bottom: 12px; }
  .nt-btn { padding: 7px 14px; border-radius: 8px; border: 1px solid #dde8e2; background: #ffffff; color: #2a3d31; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; }
  .nt-btn--primary { background: #2c9e6a; border-color: #2c9e6a; color: #fff; }
  .nt-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .nt-list { display: flex; flex-direction: column; gap: 8px; }
  .nt-item { background: #ffffff; border-radius: 10px; border: 1px solid #dde8e2; padding: 10px 12px; }
  .nt-item--unread { border-color: #c3e0d0; background: #f0f9f4; }
  .nt-item-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 4px; }
  .nt-item-title { font-size: 14px; font-weight: 500; color: #1a3326; }
  .nt-item-date { font-size: 11px; color: #6b7f73; white-space: nowrap; }
  .nt-item-message { font-size: 13px; color: #314539; }
  .nt-empty { font-size: 14px; color: #6b7f73; padding: 40px 0; }
  .nt-error { padding: 10px 12px; border-radius: 10px; background: #fff2f0; border: 1px solid #f5c4b3; color: #712b13; margin-bottom: 8px; }
  .nt-pagination { display: flex; align-items: center; gap: 8px; margin-top: 16px; }
  .nt-page-label { font-size: 13px; color: #4a6b56; }
`;