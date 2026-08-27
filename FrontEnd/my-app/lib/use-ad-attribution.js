"use client";

import { useState } from "react";

const STORAGE_KEY = "stallion:attribution";
const TRACKED_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
];

function readAttribution() {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
 
  const fromUrl = {};

  for (const key of TRACKED_KEYS) {
    const value = params.get(key);
    if (value) fromUrl[key] = value;
  }

  if (Object.keys(fromUrl).length === 0) {
    try {
      return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  const merged = {
    ...fromUrl,
    referrer: document.referrer || null,
    landing_page: window.location.href,
  };

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // sessionStorage unavailable (private mode) — attribution still works for this pageview
  }

  return merged;
}

/**
 * Captures ad attribution from the URL on first landing and keeps it in
 * sessionStorage — so a lead who lands on an ad, browses, then comes back to
 * submit the form still carries the click that brought them in.
 */
export function useAdAttribution() {
  const [attribution] = useState(readAttribution);
  return attribution;
}
