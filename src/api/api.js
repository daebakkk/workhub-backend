import axios from "axios";

const fallbackProdApi =
  "https://workhub-backend-1.onrender.com/api/";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? fallbackProdApi : "/api/");

const API = axios.create({ baseURL });
const authAPI = axios.create({ baseURL });

API.interceptors.request.use((req) => {
  const token = (localStorage.getItem("token") || "").trim();
  const url = req.url || "";
  const isAuthRoute = url.includes("auth/login") || url.includes("auth/register");
  if (isAuthRoute) {
    if (req.headers && req.headers.Authorization) {
      delete req.headers.Authorization;
    }
    if (req.headers && req.headers.authorization) {
      delete req.headers.authorization;
    }
    if (req.headers) {
      req.headers.Authorization = undefined;
    }
  } else if (token && token !== "null" && token !== "undefined") {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const isTokenInvalid =
      data?.code === "token_not_valid" ||
      (typeof data?.detail === "string" &&
        data.detail.toLowerCase().includes("token not valid"));

    if (status === 401 && isTokenInvalid) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
export { authAPI };
