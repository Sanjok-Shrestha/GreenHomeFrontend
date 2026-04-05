import axios from "axios";

const API_BASE = (window as any).__API_BASE__ || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// debug: confirm runtime baseURL
console.debug("[api] baseURL =", api.defaults.baseURL);

api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (token) {
        // ensure headers object exists
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // clear stored auth and optionally redirect to login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      console.warn("[api] 401 - cleared local tokens");
    }
    return Promise.reject(error);
  }
);

export default api;