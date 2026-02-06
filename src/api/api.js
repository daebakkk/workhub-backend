import axios from "axios";

const fallbackProdApi =
  "https://workhub-backend-1.onrender.com/api/";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? fallbackProdApi : "/api/"),
});

API.interceptors.request.use((req) => {
  const token = (localStorage.getItem("token") || "").trim();
  const url = req.url || "";
  const isAuthRoute = url.includes("auth/login") || url.includes("auth/register");
  if (!isAuthRoute && token && token !== "null" && token !== "undefined") {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
