import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(email, password);

    // After login success
    navigate("/dashboard");
  };

  return (
    <div style={styles.container}>
      {/* Left Side */}
      <div style={styles.left}>
        <img
          src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          alt="illustration"
          style={styles.image}
        />
      </div>

      {/* Right Side */}
      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Hello!</h2>
          <p style={styles.subtitle}>Sign in to your account</p>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Enter your email"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Enter your password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" style={styles.button}>
              Login
            </button>
          </form>

          <p style={styles.registerText}>
            Don't have an account?{" "}
            <span
              style={styles.registerLink}
              onClick={() => navigate("/register")}
            >
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "Arial, sans-serif",
  },
  left: {
    flex: 1,
    backgroundColor: "#f5f7fb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "60%",
  },
  right: {
    flex: 1,
    backgroundColor: "#0d6efd",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "12px",
    width: "350px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  title: {
    marginBottom: "10px",
  },
  subtitle: {
    marginBottom: "20px",
    color: "gray",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#0d6efd",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },
  registerText: {
    marginTop: "15px",
    fontSize: "14px",
  },
  registerLink: {
    color: "#0d6efd",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
