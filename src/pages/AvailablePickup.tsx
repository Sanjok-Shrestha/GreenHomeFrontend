import React, { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import api from "../api";

type UserRef = { _id?: string; name?: string; phone?: string; address?: string; email?: string };
type Pickup = {
  _id: string;
  user?: UserRef;
  wasteType?: string;
  quantity?: number;
  status?: string;
  image?: string | null;
  createdAt?: string;
  location?: string;
  [k: string]: any;
};

const PAGE_SIZE = 12;
const DEV_FORCE_SAMPLE = false; // set true for local debug to show a sample pickup

export default function AvailablePickups(): JSX.Element {
  const [items, setItems] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [assigningIds, setAssigningIds] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);

  const parseResponseToArray = (raw: any): any[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.result)) return raw.result;
    // some servers return { data: { items: [...] } }
    if (raw.data && Array.isArray(raw.data.items)) return raw.data.items;
    return [];
  };

  const fetchAvailable = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStatusCode(null);
    setRawResponse(null);

    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

    try {
      // pass explicit Authorization header in case your api wrapper doesn't
      const res = await api.get("/api/waste/available?limit=100", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      console.debug("[AvailablePickups] GET /api/waste/available response:", res);

      setStatusCode(res?.status ?? null);
      setRawResponse(res?.data ?? null);

      const arr = parseResponseToArray(res?.data);
      const mapped: Pickup[] = arr.map((p: any) => ({
        _id: p._id ?? p.id ?? String(Math.random()).slice(2),
        user: p.user ?? p.requester ?? undefined,
        wasteType: p.wasteType ?? p.type ?? "Unknown",
        quantity: p.quantity ?? 0,
        status: p.status ?? "pending",
        image: p.image ?? p.imageUrl ?? null,
        createdAt: p.createdAt ?? p.created_at,
        location: p.location,
        ...p,
      }));

      setItems(mapped);
      // dev fallback
      if (!mapped.length && DEV_FORCE_SAMPLE) {
        setItems([
          {
            _id: "sample-1",
            user: { name: "Debug User", phone: "000" },
            wasteType: "Plastic",
            quantity: 4,
            status: "pending",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      console.error("[AvailablePickups] fetch failed:", err);
      // try to extract helpful details
      const resp = err?.response;
      if (resp) {
        setStatusCode(resp.status);
        setRawResponse(resp.data ?? resp);
        setError(resp.data?.message || `Server returned ${resp.status}`);
      } else if (err?.request) {
        setError("No response from server. Is the backend running? (network/CORS issue?)");
      } else {
        setError(err?.message || "Failed to load available pickups");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailable();
    // optional polling: refresh every 30s so collectors see new posts
    const id = setInterval(() => fetchAvailable(), 30000);
    return () => clearInterval(id);
  }, [fetchAvailable]);

  const setAssigning = (id: string, v: boolean) =>
    setAssigningIds((s) => {
      const copy = { ...s };
      if (v) copy[id] = true;
      else delete copy[id];
      return copy;
    });

  const claimPickup = async (id: string) => {
    if (!window.confirm("Assign this pickup to yourself?")) return;
    setAssigning(id, true);
    const prev = items;
    setItems((cur) => cur.filter((x) => x._id !== id));

    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

    try {
      const res = await api.post(`/api/waste/${id}/assign`, null, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      console.debug("[AvailablePickups] assign response:", res);
      if (res?.data?.error) throw new Error(res.data.error || "Assign failed");
      // refresh list from server
      await fetchAvailable();
      alert("Pickup assigned to you. Check Assigned Pickups.");
    } catch (err: any) {
      console.error("Failed to assign pickup", err);
      setItems(prev); // rollback
      setError(err?.response?.data?.message || err?.message || "Failed to assign pickup");
      setTimeout(() => setError(null), 4000);
    } finally {
      setAssigning(id, false);
    }
  };

  const visible = useMemo(() => items.slice(0, page * PAGE_SIZE), [items, page]);

  // UI
  if (loading) {
    return (
      <div style={{ padding: 12 }}>
        <div>Loading available pickups…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 12 }}>
        <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>
        {statusCode && <div style={{ color: "#666", marginBottom: 8 }}>Status: {statusCode}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => fetchAvailable()} style={btn}>
            Retry
          </button>
          <button
            onClick={() => {
              // quick debug: open API endpoint in new tab (helps when CORS blocks XHR)
              const base = (window as any).__API_BASE__ || "";
              window.open(`${base}/api/waste/available?limit=6`, "_blank");
            }}
            style={btnAlt}
          >
            Open endpoint
          </button>
          <button onClick={() => setShowRaw((s) => !s)} style={btnAlt}>
            {showRaw ? "Hide response" : "Show response"}
          </button>
        </div>

        {showRaw && (
          <pre style={{ marginTop: 8, maxHeight: 240, overflow: "auto", background: "#f6f6f8", padding: 8 }}>
            {JSON.stringify(rawResponse ?? "no response", null, 2)}
          </pre>
        )}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div style={{ padding: 12 }}>
        <h2 style={{ marginTop: 0 }}>Available Pickups</h2>
        <p style={{ color: "#666" }}>No unassigned pickups right now.</p>
        <div style={{ marginTop: 8 }}>
          <button onClick={() => fetchAvailable()} style={btn}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12 }}>
      <h2 style={{ marginTop: 0 }}>Available Pickups</h2>

      <div style={{ display: "grid", gap: 12 }}>
        {visible.map((p) => (
          <div key={p._id} style={card}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{p.wasteType}</div>
                <div style={{ color: "#666", fontSize: 13 }}>
                  {p.quantity ?? 0} kg • {p.user?.name ?? "User"} • {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={p.user?.phone ? `tel:${p.user.phone}` : "#"}
                  onClick={(e) => {
                    if (!p.user?.phone) {
                      e.preventDefault();
                      alert("No phone number available");
                    }
                  }}
                  style={actionBtn}
                >
                  Call user
                </a>

                <button
                  onClick={() => claimPickup(p._id)}
                  disabled={!!assigningIds[p._id]}
                  style={{ ...actionBtn, background: "#27ae60", color: "#fff", border: "none" }}
                >
                  {assigningIds[p._id] ? "Assigning…" : "Assign to me"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {page * PAGE_SIZE < items.length && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setPage((s) => s + 1)} style={btn}>
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

/* small styles */
const btn: React.CSSProperties = {
  backgroundColor: "#2c3e50",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
};

const btnAlt: React.CSSProperties = {
  backgroundColor: "#fff",
  color: "#2c3e50",
  border: "1px solid #ddd",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
};

const card: React.CSSProperties = {
  background: "#fff",
  padding: 12,
  borderRadius: 8,
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const actionBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #ddd",
  background: "#f0f0f0",
  cursor: "pointer",
  fontWeight: 700,
};