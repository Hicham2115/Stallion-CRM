"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";

function buildLeadFormData(values, briefFile) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (key === "attribution") {
      formData.append("attribution", JSON.stringify(value ?? {}));
      continue;
    }
    if (value === undefined || value === null) continue;
    formData.append(key, String(value));
  }
  if (briefFile) formData.append("brief_file", briefFile);
  return formData;
}

export function useSubmitLead() {
  return useMutation({
    mutationFn: async ({ values, briefFile }) => {
      const formData = buildLeadFormData(values, briefFile);
      const { data } = await api.post("/api/leads", formData);
      return data;
    },
    onSuccess: () => {
      toast.success("Got it — we'll be in touch shortly.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
