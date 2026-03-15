import React, { useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import recycleImg from "../assets/recycle.jpg";

type FormState = {
  name: string;
  email: string;
  password: string;
  role: "user" | "collector";
};

export default function RegisterPage(): JSX.Element {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value } as FormState));
  };

  const selectRole = (r: FormState["role"]) => {
    setFormData((s) => ({ ...s, role: r }));
    setRoleOpen(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/register", formData);
      navigate("/login");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Inject small stylesheet for placeholder + autofill to ensure visible color */}
      <style>
        {`
          input::placeholder { color: #777 !important; }
          textarea::placeholder { color: #777 !important; }
          input:-webkit-autofill, textarea:-webkit-autofill {
            -webkit-text-fill-color: #000 !important;
            transition: background-color 5000s ease-in-out 0s;
          }
        `}
      </style>

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

      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Sign up to get started</p>

          <form onSubmit={handleRegister} style={{ width: "100%" }}>
            <label style={styles.fieldLabel}>Full Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              type="text"
              placeholder="e.g. John Doe"
              style={styles.input}
              required
            />

            <label style={styles.fieldLabel}>Email</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              placeholder="you@example.com"
              style={styles.input}
              required
            />

            <label style={styles.fieldLabel}>Password</label>
            <div style={styles.passwordWrap}>
              <input
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

            <label style={styles.fieldLabel}>Role</label>

            {/* role wrapper: pointer events + click for touch */}
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
                    style={styles.roleItem}
                    onClick={() => selectRole("user")}
                    role="button"
                    tabIndex={0}
                  >
                    Household User
                  </div>
                  <div
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
              style={{ ...styles.button, opacity: loading ? 0.8 : 1 }}
              disabled={loading}
            >
              {loading ? "Registering…" : "Register"}
            </button>
          </form>

          <p style={styles.loginText}>
            Already have an account?{" "}
            <span style={styles.loginLink} onClick={() => navigate("/login")}>
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* Styles: set input text color to black so typed text is visible */
const styles: { [k: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial",
    background: "linear-gradient(180deg,#e8f9ee 0%, #d6f3df 100%)",
    boxSizing: "border-box",
    margin: 0,
    padding: 0,
  },

  left: {
    width: "50vw",
    height: "100vh",
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eef8f0",
    boxSizing: "border-box",
    padding: "12px",
  },
  leftContent: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    width: "95%",
    height: "90%",
    maxWidth: "none",
    objectFit: "cover",
    borderRadius: 8,
    display: "block",
    userSelect: "none",
    pointerEvents: "none",
  },

  right: {
    width: "50vw",
    height: "100vh",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
    boxSizing: "border-box",
    background: "linear-gradient(180deg,#eafdf0 0%, #dff6e6 100%)",
  },

  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "white",
    padding: "28px",
    borderRadius: 12,
    boxShadow: "0 10px 32px rgba(15,23,16,0.06)",
    textAlign: "left",
    boxSizing: "border-box",
  },
  title: { margin: 0, marginBottom: 6, textAlign: "center", fontSize: 22 },
  subtitle: { margin: 0, marginBottom: 18, textAlign: "center", color: "#666" },
  fieldLabel: { display: "block", marginBottom: 6, color: "#444", fontSize: 13, fontWeight: 600 },

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
    color: "#000", // ensure typed text is black
  },

  passwordWrap: {
    position: "relative",
    marginBottom: 12,
  },
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
    color: "#000", // ensure typed password text/bullets are visible
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

  roleWrap: {
    position: "relative",
    width: "100%",
    marginBottom: 12,
    zIndex: 200,
  },
  roleCurrent: {
    background: "#f9fbf8",
    border: "1px solid #e7efe9",
    padding: "12px 14px",
    borderRadius: 8,
    color: "#444",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chev: { marginLeft: 12, color: "#8aa796" },
  roleList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #e1e6df",
    boxShadow: "0 6px 18px rgba(15,23,16,0.06)",
    borderRadius: 6,
    overflow: "hidden",
    zIndex: 300,
  },
  roleItem: {
    padding: "10px 12px",
    borderBottom: "1px solid #f2f4f1",
    background: "transparent",
    cursor: "pointer",
    color: "#233827",
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
  loginText: { marginTop: 14, textAlign: "center", color: "#555" },
  loginLink: { color: "#0f7a46", fontWeight: 700, cursor: "pointer" },
  error: { color: "crimson", marginTop: 6, marginBottom: 6, fontSize: 13 },
};