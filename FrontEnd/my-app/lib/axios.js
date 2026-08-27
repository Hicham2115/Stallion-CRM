import axios from "axios";

/** Talks directly to the Laravel backend (CORS-enabled). */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000",
  timeout: 15000,
});
