"use client";
import { useEffect, useState } from "react";

// Delays propagating a fast-changing value (a text filter input) so typing
// doesn't fire a network request per keystroke — see the Acquisition
// filters' campaign/ad-set/creative/country/community fields.
export function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
