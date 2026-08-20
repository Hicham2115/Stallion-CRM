"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import {
  Area,
  AreaChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";

import { loginConfig } from "@/config/login";

const { area } = loginConfig;
const { motion } = area;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Mean of the seed series — the level new readings are pulled back toward. */
const BASELINE = area.data.reduce((sum, n) => sum + n, 0) / area.data.length;

type Reading = { t: number; value: number };

const SEED: Reading[] = area.data.map((value, t) => ({ t, value }));

/** Must match --wm-reveal-ms in app/globals.css. */
const REVEAL_MS = 420;

/**
 * Subscribes to the OS motion preference.
 *
 * useSyncExternalStore rather than useState + useEffect: the server snapshot
 * keeps hydration honest, there is no setState inside an effect, and the value
 * updates live if someone changes the setting while the page is open.
 */
function usePrefersReducedMotion() {
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
 * The next reading in the feed.
 *
 * Two forces: a gentle pull back toward the baseline, plus noise. Without the
 * pull this is a pure random walk and the series eventually wanders off the top
 * or flatlines against zero; with it, the line keeps producing new peaks and
 * troughs around the seed level indefinitely.
 */
function nextReading(previous: number): number {
  const pull = (BASELINE - previous) * 0.16;
  const noise = (Math.random() - 0.5) * BASELINE * motion.driftRatio;
  return Math.max(1, Math.round(previous + pull + noise));
}

/** Index of the highest reading — the marker tracks it as the feed scrolls. */
function peakOf(readings: Reading[]): Reading {
  return readings.reduce((best, r) => (r.value > best.value ? r : best), readings[0]);
}

/**
 * The value readout that follows the pointer.
 *
 * Deliberately spare — a caption and a number. The reference design shows a
 * date and a series name too, but this chart has neither: it is a rolling feed
 * with no real calendar behind it, so inventing one would be a lie.
 */
function HorizonReadout({ active, payload }: Partial<TooltipContentProps>) {
  if (!active || !payload?.length) return null;
  const reading = payload[0]?.value;
  if (reading === undefined) return null;

  return (
    <div className="rounded-lg border border-hairline bg-deck-card/95 px-3 py-2 shadow-[0_18px_44px_-18px_rgb(0_0_0/0.9)] backdrop-blur-md">
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-muted">
        {area.readoutLabel}
      </p>
      <p className="mt-1 font-mono text-sm font-medium tabular-nums text-brand">
        {Number(reading).toLocaleString()}
      </p>
    </div>
  );
}

/**
 * A live area chart used as the horizon along the bottom of the brand panel.
 *
 * No axes and no labels: it is texture, not a readout. What sells it is the
 * motion. Rather than nudging figures in place, this one scrolls: a
 * new reading is appended on the right and the oldest falls off the left, so it
 * behaves like a feed rather than a picture.
 *
 * The vertical marker and dot are not fixed to a date — they recompute to
 * whatever the current high point is, so they slide along as the feed moves.
 *
 * Sizing comes entirely from the parent.
 */
export function AreaWatermark() {
  const reduced = usePrefersReducedMotion();
  const gradientId = useId().replace(/:/g, "");

  // Seeded from config so the server and first client render agree; the feed
  // only starts after mount, because random values during render would
  // mismatch on hydration.
  const [readings, setReadings] = useState<Reading[]>(SEED);

  // Pointer is over the chart: layer is lit and the feed is held still.
  const [awake, setAwake] = useState(false);
  // Whether the breathing animation is allowed to run. It is suppressed for
  // the whole fade-out as well, otherwise the animation would snap the layer
  // back to watermark opacity the instant the pointer left, with no fade.
  const [breathing, setBreathing] = useState(true);
  const restore = useRef<ReturnType<typeof setTimeout> | null>(null);

  function wake() {
    if (!area.interactive) return;
    if (restore.current) clearTimeout(restore.current);
    setBreathing(false);
    setAwake(true);
  }

  function sleep() {
    if (!area.interactive) return;
    setAwake(false);
    // Let the fade finish before handing opacity back to the animation.
    restore.current = setTimeout(() => setBreathing(true), REVEAL_MS);
  }

  useEffect(() => () => {
    if (restore.current) clearTimeout(restore.current);
  }, []);

  useEffect(() => {
    // stepMs: 0 is the documented way to freeze the feed.
    // Holding still while hovered is what makes the readout readable.
    if (reduced || awake || !motion.stepMs) return;

    const id = setInterval(() => {
      setReadings((current) => {
        const last = current[current.length - 1];
        const appended = { t: last.t + 1, value: nextReading(last.value) };
        return [...current.slice(1), appended];
      });
    }, motion.stepMs);

    return () => clearInterval(id);
  }, [reduced, awake]);

  const peak = peakOf(readings);

  return (
    <div
      /* aria-hidden is safe precisely because nothing in here is focusable —
         it is pointer-only decoration, so it never traps a keyboard user. */
      aria-hidden
      onPointerEnter={wake}
      onPointerLeave={sleep}
      /* Recharts marks its internal layer groups tabIndex="-1", so a click
         inside the plot moves DOM focus onto one of them — and the browser
         then paints its focus ring as a rectangle around the chart. Focus has
         no business inside an aria-hidden decorative layer in the first place,
         so it is refused here rather than being hidden after the fact.
         Preventing the mousedown default does not affect hover or the tooltip,
         which are driven by pointer movement. */
      onMouseDown={(event) => event.preventDefault()}
      className={`deck-breathe h-full w-full select-none ${
        area.interactive ? "pointer-events-auto cursor-crosshair" : "pointer-events-none"
      }`}
      style={
        {
          "--wm-fade-from": motion.fadeFrom,
          "--wm-fade-to": motion.fadeTo,
          "--wm-fade-duration": `${motion.fadeDurationMs}ms`,
          "--wm-reveal-ms": `${REVEAL_MS}ms`,
          // Inline opacity beats the keyframes, which is how the reveal takes
          // over from the breathing without fighting it on specificity.
          ...(awake
            ? { opacity: area.hoverOpacity, animation: "none" }
            : breathing
              ? {}
              : { opacity: motion.fadeFrom, animation: "none" }),
        } as CSSProperties
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={readings}
          /* Near-zero margins so the fill bleeds to the edges of its box
             instead of floating inside recharts' default padding. */
          margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
          /* Recharts v3 turns accessibilityLayer on by default, which puts
             tabIndex="0" and role="application" on the chart surface. Inside an
             aria-hidden decorative layer that is a genuine violation: a focus
             stop with no accessible name, sitting ahead of the login form. The
             chart is pointer-only by design, so it is switched off. */
          accessibilityLayer={false}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={area.color} stopOpacity={0.5} />
              <stop offset="70%" stopColor={area.color} stopOpacity={0.06} />
              <stop offset="100%" stopColor={area.color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Both axes are hidden but must exist: the reference marks and the
              tooltip all need a scale to position against. */}
          <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} hide />
          <YAxis domain={[0, "dataMax + 120"]} hide />

          {/* The standing crosshair, re-pointed at the live high. Hidden while
              the pointer is down here, so it cannot be mistaken for the cursor
              readout the user is actually driving. */}
          {!awake && (
            <ReferenceLine
              x={peak.t}
              stroke={area.color}
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          )}
          {!awake && (
            <ReferenceDot
              x={peak.t}
              y={peak.value}
              r={3.5}
              fill={area.color}
              stroke="none"
            />
          )}

          {area.interactive && (
            <Tooltip
              content={<HorizonReadout />}
              cursor={{
                stroke: area.color,
                strokeOpacity: 0.65,
                strokeWidth: 1,
              }}
              isAnimationActive={false}
              offset={16}
            />
          )}

          <Area
            type="monotone"
            dataKey="value"
            stroke={area.color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={!reduced}
            animationDuration={motion.durationMs}
            animationEasing="linear"
            dot={false}
            activeDot={
              area.interactive
                ? {
                    r: 4,
                    fill: area.color,
                    stroke: "var(--deck-void)",
                    strokeWidth: 2,
                  }
                : false
            }
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
