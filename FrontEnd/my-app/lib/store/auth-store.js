import { create } from "zustand";
import { persist } from "zustand/middleware";

/** The Sanctum bearer token, persisted to localStorage so a refresh doesn't
 * sign the browser out. lib/axios.ts reads it to authorize every request. */
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null }),
    }),
    { name: "stallion-auth" },
  ),
);
