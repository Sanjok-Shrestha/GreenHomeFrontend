import axios from "axios";

const API_BASE = (window as any).__API_BASE__ || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

// Attach token automatically on every request
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: global response interceptor to auto-handle 401
api.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // optional: clear storage and reload app so UI handles redirect
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      // don't navigate here (api.ts doesn't have router); let pages handle it
    }
    return Promise.reject(error);
  }
);

export default api;