import axios from "axios";
import { useAuthStore } from "@/lib/store/auth-store";

/** Talks directly to the Laravel backend (CORS-enabled). */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
