"use client";

import { useState } from "react";

const STORAGE_KEY = "stallion:attribution";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

function readAttribution() {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const fromUrl = {};
  for (const key of UTM_KEYS) {
    if (params.get(key)) fromUrl[key] = params.get(key);
  }
  if (params.get("gclid")) fromUrl.gclid = params.get("gclid");
  if (params.get("fbclid")) fromUrl.fbclid = params.get("fbclid");

  const hasNewClick = Object.keys(fromUrl).length > 0;
  let stored = {};
  try {
    stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    stored = {};
  }

  if (!hasNewClick) return stored;

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
