import React, { useEffect, useState } from "react";
import { listNotifications, markRead, markAllRead } from "../api/notificationApi";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [data, setData] = useState<any>({ total: 0, page: 1, pageSize, data: [] });
  const [loading, setLoading] = useState(false);

  async function load(p = 1) {
    setLoading(true);
    try {
      const res = await listNotifications(p, pageSize);
      setData(res);
    } catch (err) {
      console.error("load notifications", err);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(page); }, [page]);

  async function onMark(id: string) {
    await markRead(id);
    load(page);
  }

  async function onMarkAll() {
    await markAllRead();
    load(page);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Notifications</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => load(page)} disabled={loading}>Refresh</button>{" "}
        <button onClick={onMarkAll}>Mark all read</button>
      </div>

      {loading ? <div>Loading…</div> : (
        <>
          <div>Total: {data.total}</div>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {data.data.map((n: any) => (
              <li key={n._id} style={{ padding: 10, borderBottom: "1px solid #eee", background: n.read ? "#fff" : "#f6ffed" }}>
                <div style={{ fontWeight: 700 }}>{n.title}</div>
                <div style={{ color: "#666" }}>{n.body}</div>
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => onMark(n._id)}>Mark read</button>
                </div>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>{" "}
            <span>Page {data.page}</span>{" "}
            <button onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}