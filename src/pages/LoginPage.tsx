import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../App";
import recycleImg from "../assets/recycle.jpg";

type LoginResponse = {
  token?: string;
  user?: { role?: string; [k: string]: any };
  role?: string;
  code?: string;
  message?: string;
};

function decodeJwt(token?: string | null): any | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch (e) {
    console.warn("Failed to decode JWT:", e);
    return null;
  }
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const setAuthState = auth?.setAuthState;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.post<LoginResponse>("/api/auth/login", formData, {
        headers: { "Content-Type": "application/json" },
      });

      const token = res.data?.token;
      const user = res.data?.user ?? {};

      let role = (res.data?.role || user.role || "") as string;
      if (!role && token) {
        const payload = decodeJwt(token);
        role = payload?.role || payload?.data?.role || "";
      }
      role = (role || "user").toString().trim().toLowerCase();

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("accessToken", token);
      }
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", role);

      try {
        setAuthState?.({ isAuth: true, roleState: role });
      } catch {
        // ignore if context not present
      }

      if (role === "admin") navigate("/admin", { replace: true });
      else if (role === "collector") navigate("/collector", { replace: true });
      else navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        if (status === 400) setErrorMessage(data?.message || "Invalid request / credentials");
        else if (status === 401) setErrorMessage(data?.message || "Unauthorized");
        else if (status === 403) {
          if (data?.code === "ACCOUNT_NOT_APPROVED") setErrorMessage(data?.message || "Account not approved yet");
          else setErrorMessage(data?.message || "Forbidden");
        } else setErrorMessage(data?.message || `Login failed (${status})`);
      } else if (error.request) {
        setErrorMessage("No response from server. Is the backend running?");
      } else {
        setErrorMessage(error.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <aside style={styles.left}>
        <div style={styles.leftInner}>
          <img src={recycleImg} alt="illustration" style={styles.illustration} draggable={false} />
        </div>
      </aside>

      <main style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Hello!</h2>
          <p style={styles.subtitle}>Sign in to your account</p>

          <form onSubmit={handleLogin} style={{ width: "100%" }}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              style={styles.input}
              onChange={handleChange}
              value={formData.email}
              required
              disabled={loading}
              autoComplete="email"
            />

            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrap}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                style={styles.passwordInput}
                onChange={handleChange}
                value={formData.password}
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword((s) => !s)}
                style={styles.passwordToggle}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" style={{ ...styles.button, opacity: loading ? 0.8 : 1 }} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {errorMessage && (
            <div style={{ marginTop: 12, color: "#c0392b" }}>{errorMessage}</div>
          )}

          <p style={styles.registerText}>
            Don't have an account?{" "}
            <span style={styles.registerLink} onClick={() => navigate("/register")}>
              Register
            </span>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

/* Styles (matches Register look & feel) */
const styles: { [k: string]: React.CSSProperties } = {
  page: {
    display: "flex",
    minHeight: "100vh",
    width: "100vw",
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial",
    background: "linear-gradient(180deg,#e8f9ee 0%, #d6f3df 100%)",
  },
  left: {
    width: "50vw",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eef8f0",
    boxSizing: "border-box",
    padding: 20,
  },
  leftInner: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  illustration: { width: "90%", height: "90%", objectFit: "cover", borderRadius: 8, userSelect: "none", pointerEvents: "none" },

  right: {
    width: "50vw",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    background: "linear-gradient(180deg,#eafdf0 0%, #dff6e6 100%)",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    padding: 28,
    borderRadius: 12,
    boxShadow: "0 10px 32px rgba(15,23,16,0.06)",
    textAlign: "left",
    boxSizing: "border-box",
  },
  title: { margin: 0, marginBottom: 6, textAlign: "center", fontSize: 22 },
  subtitle: { margin: 0, marginBottom: 18, textAlign: "center", color: "#666" },
  label: { display: "block", marginBottom: 6, color: "#444", fontSize: 13, fontWeight: 600 },

  input: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: 12,
    borderRadius: 8,
    border: "1px solid #e7efe9",
    background: "#f9fbf8",
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
    color: "#000", // changed to black so typed text is visible
  },

  passwordWrap: { position: "relative", marginBottom: 12 },
  passwordInput: {
    width: "100%",
    padding: "12px 14px",
    paddingRight: 92,
    borderRadius: 8,
    border: "1px solid #e7efe9",
    background: "#f9fbf8",
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
    color: "#000", // black typed text for password field
  },
  passwordToggle: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    height: 36,
    padding: "6px 10px",
    borderRadius: 8,
    border: "none",
    background: "#e9f7ee",
    color: "#0f7a46",
    cursor: "pointer",
    fontWeight: 700,
  },

  button: {
    width: "100%",
    padding: "12px",
    borderRadius: 10,
    border: "none",
    backgroundColor: "#2c9e6a",
    color: "white",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 8px 28px rgba(44,158,106,0.16)",
    marginTop: 8,
  },

  registerText: { marginTop: 14, textAlign: "center", color: "#555" },
  registerLink: { color: "#0f7a46", fontWeight: 700, cursor: "pointer" },
};