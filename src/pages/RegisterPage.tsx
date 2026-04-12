import React, { useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import recycleImg from "../assets/recycle.jpg";

type FormState = {
  name: string;
  email: string;
  password: string;
  role: "user" | "collector";
  address: string;
  phone: string;
};

export default function RegisterPage(): JSX.Element {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    role: "user",
    address: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value } as FormState));
  };

  const selectRole = (r: FormState["role"]) => {
    setFormData((s) => ({ ...s, role: r }));
    setRoleOpen(false);
  };

  function validatePhone(phone: string) {
    if (!phone) return false;
    const cleaned = phone.replace(/[\s\-().+]/g, "");
    if (cleaned.length < 7 || cleaned.length > 20) return false;
    return /^[0-9]+$/.test(cleaned);
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) return setError("Please enter your full name.");
    if (!formData.email.trim()) return setError("Please enter your email address.");
    if (!formData.password) return setError("Please choose a password.");
    if (!formData.address.trim()) return setError("Please enter your address.");
    if (!validatePhone(formData.phone))
      return setError("Please enter a valid phone number (digits only, 7–20 chars).");

    setLoading(true);
    try {
      await api.post("/auth/register", formData);
      navigate("/login");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        input::placeholder, textarea::placeholder { color: #9aab9f !important; }
        input:-webkit-autofill, textarea:-webkit-autofill {
          -webkit-text-fill-color: #111 !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        .role-item:hover { background: #f0f7f3 !important; }
        input:focus, textarea:focus {
          border-color: #2c9e6a !important;
          box-shadow: 0 0 0 3px rgba(44,158,106,0.12) !important;
        }
      `}</style>

      {/* Left */}
      <div style={styles.left}>
        <div style={styles.leftContent}>
          <img
            src={recycleImg}
            alt="Recycling illustration"
            style={styles.illustration}
            draggable={false}
          />
        </div>
      </div>

      {/* Right */}
      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Sign up to get started</p>

          <form onSubmit={handleRegister} style={{ width: "100%" }}>

            <label style={styles.fieldLabel} htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              type="text"
              placeholder="e.g. John Doe"
              style={styles.input}
              required
            />

            <label style={styles.fieldLabel} htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              placeholder="you@example.com"
              style={styles.input}
              required
            />

            <label style={styles.fieldLabel} htmlFor="password">Password</label>
            <div style={styles.passwordWrap}>
              <input
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                type={showPassword ? "text" : "password"}
                placeholder="Choose a secure password"
                style={styles.passwordInput}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label="Toggle password visibility"
                style={styles.passwordToggle}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <label style={styles.fieldLabel} htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street address, city, state/province, postal code"
              style={styles.textarea}
              rows={3}
              required
            />

            <label style={styles.fieldLabel} htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              type="tel"
              placeholder="+977 98XXXXXXXX"
              style={styles.input}
              required
            />

            <label style={styles.fieldLabel}>Role</label>
            <div
              style={styles.roleWrap}
              onPointerEnter={() => setRoleOpen(true)}
              onPointerLeave={() => setRoleOpen(false)}
              onClick={() => setRoleOpen((v) => !v)}
            >
              <div style={styles.roleCurrent}>
                {formData.role === "user" ? "Household User" : "Collector"}
                <span style={styles.chev}>▾</span>
              </div>
              {roleOpen && (
                <div style={styles.roleList}>
                  <div
                    className="role-item"
                    style={styles.roleItem}
                    onClick={() => selectRole("user")}
                    role="button"
                    tabIndex={0}
                  >
                    Household User
                  </div>
                  <div
                    className="role-item"
                    style={styles.roleItem}
                    onClick={() => selectRole("collector")}
                    role="button"
                    tabIndex={0}
                  >
                    Collector
                  </div>
                </div>
              )}
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button
              type="submit"
              style={{ ...styles.button, opacity: loading ? 0.75 : 1 }}
              disabled={loading}
            >
              {loading ? "Registering…" : "Register"}
            </button>
          </form>

          <p style={styles.loginText}>
            Already have an account?{" "}
            <span style={styles.loginLink} onClick={() => navigate("/login")}>
              Log in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: { [k: string]: React.CSSProperties } = {
  // ── Page shell ────────────────────────────────────────────
  container: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    background: "#f4faf6",
    boxSizing: "border-box",
  },

  // ── Left panel ────────────────────────────────────────────
  left: {
    width: "50vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(160deg, #1a6b45 0%, #2c9e6a 60%, #3dbf82 100%)",
    boxSizing: "border-box",
    padding: "40px",
  },
  leftContent: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    width: "92%",
    height: "88%",
    maxWidth: "none",
    objectFit: "cover",
    borderRadius: 12,
    display: "block",
    userSelect: "none",
    pointerEvents: "none",
    opacity: 0.92,
  },

  // ── Right panel ───────────────────────────────────────────
  right: {
    width: "50vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 48px",
    boxSizing: "border-box",
    background: "#ffffff",
    overflowY: "auto",
  },
  card: {
    width: "100%",
    maxWidth: 460,
    textAlign: "left",
    boxSizing: "border-box",
  },

  // ── Headings ──────────────────────────────────────────────
  title: {
    margin: 0,
    marginBottom: 4,
    textAlign: "center",
    fontSize: 22,
    fontWeight: 500,
    color: "#0f1f16",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    margin: 0,
    marginBottom: 24,
    textAlign: "center",
    color: "#6b7f73",
    fontSize: 14,
  },

  // ── Labels ────────────────────────────────────────────────
  fieldLabel: {
    display: "block",
    marginBottom: 5,
    color: "#5a6b60",
    fontSize: 11.5,
    fontWeight: 500,
    letterSpacing: "0.4px",
    textTransform: "uppercase" as const,
  },

  // ── Text inputs ───────────────────────────────────────────
  input: {
    width: "100%",
    padding: "10px 13px",
    marginBottom: 14,
    borderRadius: 8,
    border: "1px solid #dde8e2",
    background: "#f7fbf8",
    outline: "none",
    fontSize: 13.5,
    boxSizing: "border-box",
    color: "#111",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  textarea: {
    width: "100%",
    padding: "10px 13px",
    marginBottom: 14,
    borderRadius: 8,
    border: "1px solid #dde8e2",
    background: "#f7fbf8",
    outline: "none",
    fontSize: 13.5,
    boxSizing: "border-box",
    color: "#111",
    resize: "vertical" as const,
    lineHeight: 1.55,
    transition: "border-color 0.15s, box-shadow 0.15s",
  },

  // ── Password ──────────────────────────────────────────────
  passwordWrap: {
    position: "relative",
    marginBottom: 14,
  },
  passwordInput: {
    width: "100%",
    padding: "10px 13px",
    paddingRight: 72,
    borderRadius: 8,
    border: "1px solid #dde8e2",
    background: "#f7fbf8",
    outline: "none",
    fontSize: 13.5,
    boxSizing: "border-box",
    color: "#111",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  passwordToggle: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    height: 28,
    padding: "0 10px",
    borderRadius: 6,
    border: "none",
    background: "#e6f4ec",
    color: "#1a6b45",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.2px",
  },

  // ── Role dropdown ─────────────────────────────────────────
  roleWrap: {
    position: "relative",
    width: "100%",
    marginBottom: 14,
    zIndex: 200,
  },
  roleCurrent: {
    background: "#f7fbf8",
    border: "1px solid #dde8e2",
    padding: "10px 13px",
    borderRadius: 8,
    color: "#333",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 13.5,
  },
  chev: {
    marginLeft: 10,
    color: "#8aaa96",
    fontSize: 12,
  },
  roleList: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #dde8e2",
    boxShadow: "0 8px 24px rgba(15,31,22,0.08)",
    borderRadius: 8,
    overflow: "hidden",
    zIndex: 300,
  },
  roleItem: {
    padding: "10px 13px",
    borderBottom: "1px solid #f0f5f2",
    cursor: "pointer",
    color: "#1a3326",
    fontSize: 13.5,
    transition: "background 0.1s",
  },

  // ── Submit button ─────────────────────────────────────────
  button: {
    width: "100%",
    padding: "11px",
    borderRadius: 9,
    border: "none",
    backgroundColor: "#2c9e6a",
    color: "#ffffff",
    fontWeight: 500,
    fontSize: 14,
    cursor: "pointer",
    marginTop: 6,
    letterSpacing: "0.2px",
    transition: "background 0.15s, opacity 0.15s",
  },

  // ── Footer ────────────────────────────────────────────────
  loginText: {
    marginTop: 16,
    textAlign: "center",
    color: "#6b7f73",
    fontSize: 13,
  },
  loginLink: {
    color: "#1a6b45",
    fontWeight: 500,
    cursor: "pointer",
  },
  error: {
    color: "#c0392b",
    marginTop: 4,
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 1.4,
  },
};