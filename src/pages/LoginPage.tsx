import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../App";
import recycleImg from "../assets/recycle.jpg";
import "./LoginPage.css";

type LoginResponse = {
  token?: string;
  accessToken?: string;
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

  const hardLogoutLocal = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      delete api.defaults.headers.common.Authorization;
      setAuthState?.({ isAuth: false, roleState: "" });
    } catch {
      // ignore
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const email = formData.email.trim();
      const password = formData.password;

      // send common variants; backend will use what it expects
      const payload = { email, password, identifier: email, username: email };

      const res = await api.post<LoginResponse>("/auth/login", payload, {
        headers: { "Content-Type": "application/json" },
      });

      const token = res.data?.token || res.data?.accessToken;
      if (!token) throw new Error(res.data?.message || "Login failed: server did not return token");

      localStorage.setItem("token", token);
      localStorage.setItem("accessToken", token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      const userFromResponse = res.data?.user ?? {};
      let role = (res.data?.role || userFromResponse.role || "") as string;

      if (!role) {
        const jwt = decodeJwt(token);
        role = jwt?.role || jwt?.data?.role || "";
      }

      // try to fetch profile, but don't fail login if endpoint doesn't exist
      let profile: any = userFromResponse;
      try {
        const profRes = await api.get("/users/profile");
        profile = profRes.data ?? profile;
      } catch {}

      role = (role || profile?.role || "").toString().trim().toLowerCase();
      if (!role) role = "user";

      localStorage.setItem("user", JSON.stringify(profile || {}));
      localStorage.setItem("role", role);

      // ✅ only set auth state after token exists
      setAuthState?.({ isAuth: true, roleState: role });

      setTimeout(() => {
        if (role === "admin") navigate("/admin", { replace: true });
        else if (role === "collector") navigate("/collector/dashboard", { replace: true });
        else navigate("/dashboard", { replace: true });
      }, 75);
    } catch (error: any) {
      console.error("Login error:", error);
      hardLogoutLocal();

      const status = error?.response?.status;
      const data = error?.response?.data;
      const msg =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : null) ||
        error.message ||
        (status ? `Login failed (${status})` : "Login failed");

      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <aside className="login-left">
        <div className="login-left-inner">
          <img src={recycleImg} alt="Recycling illustration" className="login-illustration" draggable={false} />
        </div>
      </aside>

      <main className="login-right">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-brand-icon">♻️</div>
          </div>

          <h2 className="login-title">Welcome Back!</h2>
          <p className="login-subtitle">Sign in to your account to continue</p>

          <form onSubmit={handleLogin} className="login-form">
            <label className="login-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              className="login-input"
              onChange={handleChange}
              value={formData.email}
              required
              disabled={loading}
              autoComplete="email"
            />

            <label className="login-label" htmlFor="password">Password</label>
            <div className="login-password-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                className="login-password-input"
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
                className="login-password-toggle"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                <>
                  Logging in
                  <span className="login-spinner"></span>
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {errorMessage && <div className="login-error">{errorMessage}</div>}

          <p className="login-register-text">
            Don't have an account?{" "}
            <span
              className="login-register-link"
              onClick={() => navigate("/register")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate("/register");
              }}
            >
              Register here
            </span>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;