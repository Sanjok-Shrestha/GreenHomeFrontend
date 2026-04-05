// src/App.tsx (or src/App.jsx)
import React, { useState, createContext, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import api from "./api";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PostWaste from "./pages/PostWaste";
import AdminDashboard from "./pages/AdminDashboard";
import ManageCollectors from "./pages/admin/ManageCollectors";
import ManageUsers from "./pages/admin/ManageUsers";
import PricingManagement from "./pages/admin/PricingManagement";
import Reports from "./pages/admin/Reports";
import WasteCategories from "./pages/admin/WasteCategories";
import Certificates from "./pages/Certificates";
import CollectorDashboard from "./pages/CollectorDashboard";
import TrackPickup from "./pages/TrackPickup";
import RewardsPage from "./pages/RewardsPage";
import ProfilePage from "./pages/ProfilePage";
import AssignedPickups from "./pages/AssignedPickups";
import Explore from "./pages/Explore";
import MyPickups from "./pages/MyPickup";
import AvailablePickups from "./pages/AvailablePickup";
import CollectorAnalytics from "./pages/CollectorAnalytics";
import CollectorHistory from "./pages/CollectorHistory";
import CreateCertificate from "./pages/admin/CreateCertificate";
import AdminAssignPickups from "./pages/admin/AdminAssignPickups";
import ContactSupportPage from "./pages/ContactPage";
import FAQPage from "./pages/FAQPage";
import RecyclingTipsPage from "./pages/RecyclingTipsPage";


/* -------------------- Auth context -------------------- */

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

/* -------------------- Helpers -------------------- */

function getDefaultRouteForRole(role: string) {
  const r = (role || "").toString().trim().toLowerCase();
  if (r === "admin") return "/admin";
  if (r === "collector") return "/collector/dashboard";
  return "/dashboard";
}

function normalizeRole(raw: any) {
  if (!raw && raw !== "") return "";
  let s = String(raw || "").trim().toLowerCase();
  if (s === "administrator" || s === "superadmin") s = "admin";
  if (s === "mgr" || s === "manager") s = "admin";
  return s;
}

/* -------------------- Error boundary -------------------- */

class ErrorBoundary extends React.Component<any, { hasError: boolean; error?: Error }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error("ErrorBoundary caught error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Something went wrong</h2>
          <div style={{ color: "#666" }}>
            The admin UI encountered an error. Check the console for details. You can try reloading the page.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* -------------------- App -------------------- */

function App() {
  const [authState, setAuthState] = useState({
    isAuth: false,
    roleState: "",
  });

  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const reqInterceptor = api.interceptors.request.use(
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

    const resInterceptor = api.interceptors.response.use(
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
      api.interceptors.request.eject(reqInterceptor);
      api.interceptors.response.eject(resInterceptor);
    };
  }, []);

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

      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      try {
        const res = await api.get("/users/profile").catch(() => null);
        console.log("[auth] /api/users/profile response:", res?.status, res?.data);

        if (res && res.data) {
          const raw = res.data;
          const user = raw.user ?? raw;
          console.log("[auth] resolved user:", user);

          const roleFromResponse = user?.role ?? raw?.role ?? localStorage.getItem("role") ?? "";
          const role = normalizeRole(roleFromResponse);

          console.log("[auth] resolved role:", role);

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
        console.error("[auth] verifyToken error:", err);
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

  useEffect(() => {
    console.log("APP authState:", authState, "authLoading:", authLoading, "location:", window.location.pathname);
  }, [authState, authLoading]);

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
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
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
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/support" element={<ContactSupportPage />} />
              <Route path="/recycling-tips" element={<RecyclingTipsPage />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={authState.isAuth ? <Dashboard /> : <Navigate to="/" />} />

              {/* Admin routes wrapped in ErrorBoundary */}
              <Route
                path="/admin"
                element={
                  authState.isAuth && authState.roleState === "admin" ? (
                    <ErrorBoundary>
                      <AdminDashboard />
                    </ErrorBoundary>
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/admin/collectors"
                element={
                  authState.isAuth && authState.roleState === "admin" ? (
                    <ErrorBoundary>
                      <ManageCollectors />
                    </ErrorBoundary>
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/admin/users"
                element={authState.isAuth && authState.roleState === "admin" ? <ManageUsers /> : <Navigate to="/" />}
              />
              <Route
                path="/admin/pricing"
                element={authState.isAuth && authState.roleState === "admin" ? <PricingManagement /> : <Navigate to="/" />}
              />
              <Route
                path="/admin/reports"
                element={authState.isAuth && authState.roleState === "admin" ? <Reports /> : <Navigate to="/" />}
              />
              <Route
                path="/admin/waste-categories"
                element={authState.isAuth && authState.roleState === "admin" ? <WasteCategories /> : <Navigate to="/" />}
              />

              {/* Admin certificate management */}
              <Route
                path="/admin/certificates"
                element={
                  authState.isAuth && authState.roleState === "admin" ? (
                    <ErrorBoundary>
                      <Certificates />
                    </ErrorBoundary>
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/admin/certificates/create"
                element={authState.isAuth && authState.roleState === "admin" ? <CreateCertificate /> : <Navigate to="/" />}
              />
              <Route
                path="/admin/certificates/:id/edit"
                element={authState.isAuth && authState.roleState === "admin" ? <CreateCertificate /> : <Navigate to="/" />}
              />

              {/* Admin assign pickups (new) */}
              <Route
                path="/admin/assign-pickups"
                element={
                  authState.isAuth && authState.roleState === "admin" ? (
                    <ErrorBoundary>
                      <AdminAssignPickups />
                    </ErrorBoundary>
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />

              {/* Collector routes */}
              <Route
                path="/collector/dashboard"
                element={authState.isAuth && authState.roleState === "collector" ? <CollectorDashboard /> : <Navigate to="/" />}
              />
              <Route
                path="/collector"
                element={authState.isAuth && authState.roleState === "collector" ? <Navigate to="/collector/dashboard" replace /> : <Navigate to="/" />}
              />
              <Route
                path="/collector/rewards"
                element={authState.isAuth && authState.roleState === "collector" ? <RewardsPage /> : <Navigate to="/" />}
              />
              <Route
                path="/collector/assigned"
                element={authState.isAuth && authState.roleState === "collector" ? <AssignedPickups /> : <Navigate to="/" />}
              />
              <Route
                path="/collector/available"
                element={authState.isAuth && authState.roleState === "collector" ? <AvailablePickups /> : <Navigate to="/" />}
              />
              <Route
                path="/collector/analytics"
                element={authState.isAuth && authState.roleState === "collector" ? <CollectorAnalytics /> : <Navigate to="/" />}
              />
              <Route
                path="/collector/history"
                element={authState.isAuth && authState.roleState === "collector" ? <CollectorHistory /> : <Navigate to="/" />}
              />

              <Route path="/post-waste" element={authState.isAuth ? <PostWaste /> : <Navigate to="/" />} />
              <Route path="/track/:id" element={authState.isAuth ? <TrackPickup /> : <Navigate to="/" />} />
              <Route path="/pickups" element={authState.isAuth ? <MyPickups /> : <Navigate to="/" />} />

              {/* Rewards & other pages */}
              <Route path="/rewards" element={authState.isAuth ? <RewardsPage /> : <Navigate to="/" />} />
              <Route path="/certificates" element={authState.isAuth ? <Certificates /> : <Navigate to="/" />} />
              <Route path="/profile" element={authState.isAuth ? <ProfilePage /> : <Navigate to="/" />} />

              {/* Landing */}
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