import axios from "axios";

const instance = axios.create();

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("auth-storage") || "{}");
        const token = stored?.state?.token;
        if (token) {
          config.headers.Authorization = token;
        }
      } catch (e) {
        // ignore parse errors
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default instance;
