"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Subscribes to the OS motion preference.
 *
 * `useSyncExternalStore` rather than useState + useEffect: the server snapshot
 * keeps hydration honest, there is no setState inside an effect, and the value
 * updates live if someone changes the setting while the page is open.
 *
 * (Same helper as the login area chart. Kept here too rather than imported
 * across feature folders, because that file is decorative-watermark-specific
 * and will likely be deleted before this one.)
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/**
 * Counts a figure up from zero on first paint.
 *
 * Deliberately restrained:
 *  - it runs ONCE per mount, not on every value change. A KPI that re-animates
 *    every time the underlying data ticks is a distraction on a screen someone
 *    stares at all day.
 *  - it returns the final value immediately when the OS asks for reduced
 *    motion, and when the page is first rendered on the server, so the number
 *    is never missing or wrong — only its arrival is animated.
 *
 * @param value    the figure to land on
 * @param duration milliseconds for the whole run
 */
export function useCountUp(value: number, duration = 900): number {
  const reduced = usePrefersReducedMotion();

  // Start at the final value so the server render and the first client render
  // both emit the real number — animating up from 0 afterwards is a visual
  // flourish, not a difference in markup.
  const [display, setDisplay] = useState(value);
  const hasRun = useRef(false);

  useEffect(() => {
    if (reduced || hasRun.current) {
      setDisplay(value);
      return;
    }
    hasRun.current = true;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic — fast at first, settling gently, so the figure feels like
      // it is arriving rather than being scrubbed.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);

      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // `value` is intentionally excluded: this animates the first paint only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, duration]);

  // Keep up with later data changes without re-animating.
  useEffect(() => {
    if (hasRun.current) setDisplay(value);
  }, [value]);

  return display;
}
