"use client";

import { createContext, useContext } from "react";

export const LeadIntakeContext = createContext(null);

export function useLeadIntake() {
  const ctx = useContext(LeadIntakeContext);
  if (!ctx) {
    throw new Error("useLeadIntake must be used within LeadIntakeProvider");
  }
  return ctx;
}
