import { useState, createContext, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PostWaste from "./pages/PostWaste";
import AdminDashboard from "./pages/AdminDashboard";
import CollectorDashboard from "./pages/CollectorDashboard";
import TrackPickup from "./pages/TrackPickup";
import RewardsPage from "./pages/RewardsPage";
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AssignedPickups from "./pages/AssignedPickups";
import CollectorEarnings from "./pages/CollectorEarnings";
import Explore from "./pages/Explore";
import MyPickups from "./pages/MyPickup";
import AvailablePickups from "./pages/AvailablePickup";
import CollectorAnalytics from "./pages/CollectorAnalytics";
import CollectorHistory from "./pages/CollectorHistory";

export interface IAuthContext {
  isAuth: boolean;
  roleState: string;
  setAuthState: (state: { isAuth: boolean; roleState: string }) => void;
}

const defaultContext: IAuthContext = {
  isAuth: false,
  roleState: "",
  setAuthState: () => {},
};

export const AuthContext = createContext<IAuthContext>(defaultContext);

// ===== Runtime API base (adjust to match your backend) =====
const RUNTIME_API_BASE = "http://localhost:5000";
;(window as any).__API_BASE__ = RUNTIME_API_BASE;
axios.defaults.baseURL = RUNTIME_API_BASE;

function getDefaultRouteForRole(role: string) {
  const r = (role || "").toString().trim().toLowerCase();
  if (r === "admin") return "/admin";
  if (r === "collector") return "/collector";
  return "/dashboard";
}

function App() {
  const [authState, setAuthState] = useState({
    isAuth: false,
    roleState: "",
  });

  // authLoading prevents routes from redirecting while we validate token
  const [authLoading, setAuthLoading] = useState(true);

  // Setup axios interceptors once on app start
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use(
      (config) => {
        try {
          const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (e) {}
        return config;
      },
      (error) => Promise.reject(error)
    );

    const resInterceptor = axios.interceptors.response.use(
      (resp) => resp,
      (error) => {
        const status = error?.response?.status;
        if (status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          setAuthState({ isAuth: false, roleState: "" });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  // Verify token on startup (if present)
  useEffect(() => {
    let mounted = true;

    async function verifyToken() {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!token) {
        if (mounted) {
          setAuthState({ isAuth: false, roleState: "" });
          setAuthLoading(false);
        }
        return;
      }

      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      try {
        const res = await axios.get("/api/auth/me").catch(() => null);

        if (res && res.data) {
          const user = res.data.user ?? res.data;
          const roleFromResponse =
            (user && user.role) || (res.data.role ?? localStorage.getItem("role")) || "";

          const role = (roleFromResponse || "").toString().trim().toLowerCase();

          if (!localStorage.getItem("role") && role) localStorage.setItem("role", role);

          if (mounted) {
            setAuthState({ isAuth: true, roleState: role });
            setAuthLoading(false);
          }
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          if (mounted) {
            setAuthState({ isAuth: false, roleState: "" });
            setAuthLoading(false);
          }
        }
      } catch (err) {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        if (mounted) {
          setAuthState({ isAuth: false, roleState: "" });
          setAuthLoading(false);
        }
      }
    }

    verifyToken();
    return () => {
      mounted = false;
    };
  }, []);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>GreenHome</div>
          <div style={{ color: "#556b58" }}>Checking session…</div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...authState, setAuthState }}>
      <Router>
        {/* App root is a column flex layout so footer can stick to bottom */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

          {/* Routes area grows to fill available space */}
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={!authState.isAuth ? <LoginPage /> : <Navigate to={getDefaultRouteForRole(authState.roleState)} />}
              />
              <Route
                path="/register"
                element={!authState.isAuth ? <RegisterPage /> : <Navigate to={getDefaultRouteForRole(authState.roleState)} />}
              />
              <Route path="/explore" element={<Explore />} />

              {/* Protected Routes (redirect to Home "/" if not authenticated) */}
              <Route path="/dashboard" element={authState.isAuth ? <Dashboard /> : <Navigate to="/" />} />

              <Route
                path="/admin"
                element={authState.isAuth && authState.roleState === "admin" ? <AdminDashboard /> : <Navigate to="/" />}
              />

              <Route
                path="/collector"
                element={authState.isAuth && authState.roleState === "collector" ? <CollectorDashboard /> : <Navigate to="/" />}
              />

              <Route path="/post-waste" element={authState.isAuth ? <PostWaste /> : <Navigate to="/" />} />

              <Route path="/track/:id" element={authState.isAuth ? <TrackPickup /> : <Navigate to="/" />} />

              <Route
                path="/collector/assigned"
                element={authState.isAuth && authState.roleState === "collector" ? <AssignedPickups /> : <Navigate to="/" />}
              />
              <Route
                path="/collector/available"
                element={authState.isAuth && authState.roleState === "collector" ? <AvailablePickups /> : <Navigate to="/" />}
              />

              <Route
                path="/collector/earnings"
                element={authState.isAuth && authState.roleState === "collector" ? <CollectorEarnings /> : <Navigate to="/" />}
              />
              <Route path="/collector/analytics" element={authState.isAuth && authState.roleState === "collector" ? <CollectorAnalytics /> : <Navigate to="/" />}/>
              <Route path="/collector/history" element={authState.isAuth && authState.roleState === "collector" ? <CollectorHistory /> : <Navigate to="/" />}/>
              <Route path="/pickups" element={authState.isAuth ? <MyPickups /> : <Navigate to="/" />} />
              <Route path="/rewards" element={authState.isAuth ? <RewardsPage /> : <Navigate to="/" />} />

              <Route path="/profile" element={authState.isAuth ? <ProfilePage /> : <Navigate to="/" />} />

              <Route path="/leaderboard" element={authState.isAuth ? <LeaderboardPage /> : <Navigate to="/" />} />

              {/* Landing: show HomePage if NOT authenticated; otherwise redirect to role-aware route */}
              <Route path="/" element={!authState.isAuth ? <HomePage /> : <Navigate to={getDefaultRouteForRole(authState.roleState)} replace />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

         
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;