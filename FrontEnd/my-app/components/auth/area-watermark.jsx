"use client";
import { useEffect, useId, useRef, useState, useSyncExternalStore, } from "react";
import { Area, AreaChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, } from "recharts";
import { loginConfig } from "@/config/login";
const { area } = loginConfig;
const { motion } = area;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const BASELINE = area.data.reduce((sum, n) => sum + n, 0) / area.data.length;
const SEED = area.data.map((value, t) => ({ t, value }));
/** Must match --wm-reveal-ms in app/globals.css. */
const REVEAL_MS = 420;
// useSyncExternalStore rather than useState + useEffect: keeps hydration
// honest and updates live if the OS setting changes while the page is open.
function usePrefersReducedMotion() {
    return useSyncExternalStore((onChange) => {
        const query = window.matchMedia(REDUCED_MOTION);
        query.addEventListener("change", onChange);
        return () => query.removeEventListener("change", onChange);
    }, () => window.matchMedia(REDUCED_MOTION).matches, () => false);
}
// A gentle pull back toward the baseline plus noise, so the series keeps
// producing new peaks and troughs instead of wandering off or flatlining.
function nextReading(previous) {
    const pull = (BASELINE - previous) * 0.16;
    const noise = (Math.random() - 0.5) * BASELINE * motion.driftRatio;
    return Math.max(1, Math.round(previous + pull + noise));
}
function peakOf(readings) {
    return readings.reduce((best, r) => (r.value > best.value ? r : best), readings[0]);
}
function HorizonReadout({ active, payload }) {
    if (!active || !payload?.length)
        return null;
    const reading = payload[0]?.value;
    if (reading === undefined)
        return null;
    return (<div className="rounded-md border border-hairline bg-deck-card/95 px-3 py-2 shadow-[0_18px_44px_-18px_rgb(0_0_0/0.9)] backdrop-blur-md">
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-muted">
        {area.readoutLabel}
      </p>
      <p className="mt-1 font-mono text-sm font-medium tabular-nums text-brand">
        {Number(reading).toLocaleString()}
      </p>
    </div>);
}
// A live area chart used as the horizon along the bottom of the brand panel.
// No axes/labels — it's texture, not a readout. Scrolls (new reading appended
// right, oldest falls off left) rather than animating in place, and the
// marker/dot recompute to the current high point as the feed moves.
export function AreaWatermark() {
    const reduced = usePrefersReducedMotion();
    const gradientId = useId().replace(/:/g, "");
    // Seeded from config so server/first-client render agree; the feed only
    // starts after mount to avoid a hydration mismatch from random values.
    const [readings, setReadings] = useState(SEED);
    // True while pointer is over the chart: layer lit, feed held still.
    const [awake, setAwake] = useState(false);
    // Suppressed through the whole fade-out too, otherwise the layer would
    // snap back to watermark opacity the instant the pointer left.
    const [breathing, setBreathing] = useState(true);
    const restore = useRef(null);
    function wake() {
        if (!area.interactive)
            return;
        if (restore.current)
            clearTimeout(restore.current);
        setBreathing(false);
        setAwake(true);
    }
    function sleep() {
        if (!area.interactive)
            return;
        setAwake(false);
        // Let the fade finish before handing opacity back to the animation.
        restore.current = setTimeout(() => setBreathing(true), REVEAL_MS);
    }
    useEffect(() => () => {
        if (restore.current)
            clearTimeout(restore.current);
    }, []);
    useEffect(() => {
        // motion.stepMs: 0 freezes the feed; also held still while hovered.
        if (reduced || awake || !motion.stepMs)
            return;
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
    return (<div
    // aria-hidden is safe here since nothing inside is focusable.
    aria-hidden onPointerEnter={wake} onPointerLeave={sleep}
    // Recharts marks internal layer groups tabIndex="-1", so a click inside
    // the plot would otherwise move DOM focus there and paint a focus ring
    // around an aria-hidden decorative layer. Blocked here instead; hover
    // and the tooltip are unaffected since they're driven by pointer move.
    onMouseDown={(event) => event.preventDefault()} className={`deck-breathe h-full w-full select-none ${area.interactive ? "pointer-events-auto cursor-crosshair" : "pointer-events-none"}`} style={Object.assign({ "--wm-fade-from": motion.fadeFrom, "--wm-fade-to": motion.fadeTo, "--wm-fade-duration": `${motion.fadeDurationMs}ms`, "--wm-reveal-ms": `${REVEAL_MS}ms` }, (awake
            ? { opacity: area.hoverOpacity, animation: "none" }
            : breathing
                ? {}
                : { opacity: motion.fadeFrom, animation: "none" }))}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={readings}
    // Near-zero margins so the fill bleeds to the edges instead of floating
    // inside recharts' default padding.
    margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
    // Recharts v3 defaults accessibilityLayer on, adding tabIndex="0" and
    // role="application" — a focus stop with no accessible name inside this
    // aria-hidden decorative layer. Off, since the chart is pointer-only.
    accessibilityLayer={false}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={area.color} stopOpacity={0.5}/>
              <stop offset="70%" stopColor={area.color} stopOpacity={0.06}/>
              <stop offset="100%" stopColor={area.color} stopOpacity={0}/>
            </linearGradient>
          </defs>

          {/* Hidden but must exist — reference marks and tooltip need a scale. */}
          <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} hide/>
          <YAxis domain={[0, "dataMax + 120"]} hide/>

          {/* Hidden while the pointer is down so it can't be mistaken for the
              cursor readout the user is driving. */}
          {!awake && (<ReferenceLine x={peak.t} stroke={area.color} strokeOpacity={0.5} strokeWidth={1}/>)}
          {!awake && (<ReferenceDot x={peak.t} y={peak.value} r={3.5} fill={area.color} stroke="none"/>)}

          {area.interactive && (<Tooltip content={<HorizonReadout />} cursor={{
                stroke: area.color,
                strokeOpacity: 0.65,
                strokeWidth: 1,
            }} isAnimationActive={false} offset={16}/>)}

          <Area type="monotone" dataKey="value" stroke={area.color} strokeWidth={2} fill={`url(#${gradientId})`} isAnimationActive={!reduced} animationDuration={motion.durationMs} animationEasing="linear" dot={false} activeDot={area.interactive
            ? {
                r: 4,
                fill: area.color,
                stroke: "var(--deck-void)",
                strokeWidth: 2,
            }
            : false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>);
}
