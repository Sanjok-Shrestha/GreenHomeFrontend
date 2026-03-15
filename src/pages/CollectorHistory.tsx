import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

type Pickup = {
  _id: string;
  wasteType?: string;
  quantity?: number;
  status?: string;
  createdAt?: string;
  location?: string;
  user?: { name?: string; phone?: string; address?: string };
};

export default function CollectorHistory(): React.ReactElement {
  const [items, setItems] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [rawError, setRawError] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    setStatusCode(null);
    setRawError(null);

    try {
      const res = await api.get("/api/collector/history");
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setItems(data);
    } catch (err: any) {
      console.error("Failed to load history", err);

      // Network error (no response at all)
      if (!err?.response) {
        setError("Unable to reach server. Is the backend running?");
        setRawError(err?.message ?? err);
        setStatusCode(null);
      } else {
        // Server responded
        const code = err.response.status;
        setStatusCode(code);

        // Common helpful messages:
        if (code === 401) {
          setError("Not authenticated. Please login again.");
          // remove stale tokens and send to login
          try {
            localStorage.removeItem("token");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            localStorage.removeItem("role");
          } catch {}
          // navigate to login after short delay so user sees message
          setTimeout(() => navigate("/login"), 900);
        } else if (code === 403) {
          setError("Forbidden. Your account does not have permission to view this history.");
        } else if (code === 404) {
          setError("History endpoint not found on server (404). Check backend routes.");
        } else {
          // show server message if present
          const serverMsg = err.response?.data?.message ?? JSON.stringify(err.response?.data) ?? err.message;
          setError(serverMsg || "Failed to load history");
        }

        setRawError(err.response?.data ?? err.response);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h2>Pickup History</h2>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div>
          <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => load()}
              style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#0b6efd", color: "#fff", cursor: "pointer" }}
            >
              Retry
            </button>

            <button
              onClick={() => window.open(`${(window as any).__API_BASE__ || ""}/api/collector/history`, "_blank")}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}
            >
              Open endpoint
            </button>

            <button
              onClick={() => setShowDetails((s) => !s)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}
            >
              {showDetails ? "Hide details" : "Show details"}
            </button>
          </div>

          {showDetails && (
            <pre style={{ marginTop: 12, padding: 12, background: "#f6f6f6", borderRadius: 8, overflow: "auto" }}>
              <strong>HTTP status:</strong> {statusCode ?? "N/A"}
              {"\n\n"}
              <strong>Raw response / error:</strong>
              {"\n"}
              {typeof rawError === "string" ? rawError : JSON.stringify(rawError, null, 2)}
            </pre>
          )}
        </div>
      ) : items.length === 0 ? (
        <div>No pickup history yet.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
          {items.map((p) => (
            <li key={p._id} style={{ padding: 12, background: "#fff", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{p.wasteType}</div>
                  <div style={{ color: "#666" }}>{p.quantity} kg • {p.location}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{p.status}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}</div>
                </div>
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button
                  onClick={() => navigate(`/collector/history/${p._id}`)}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#0b6efd", color: "#fff" }}
                >
                  View details
                </button>

                <Link to={`/track/${p._id}`} style={{ alignSelf: "center", color: "#0b6efd" }}>
                  Track
                </Link>

                <div style={{ marginLeft: "auto", color: "#666", fontSize: 13 }}>
                  {p.user?.name && <div>{p.user.name}</div>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}