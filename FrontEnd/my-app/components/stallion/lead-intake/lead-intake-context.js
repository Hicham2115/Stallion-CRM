import { create } from "zustand";

export const useLeadIntake = create((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
