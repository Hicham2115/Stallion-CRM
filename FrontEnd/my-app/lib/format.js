/**
 * FORMATTERS
 *
 * Every number, currency and date string in the console goes through here.
 *
 * WHY THIS FILE EXISTS AT ALL: `Intl` falls back to the ambient system locale
 * when you do not name one. The Node process rendering on the server and the
 * browser rendering on the client can have different locales, so the same
 * number becomes "1,234" in one and "1 234" in the other — which React reports
 * as a hydration mismatch. Every function below passes the locale from
 * config/admin.ts explicitly, so server and client always agree.
 *
 * To change how numbers or money look app-wide, edit `locale` / `currency` in
 * config/admin.ts — not these functions.
 */
import { adminConfig } from "@/config/admin";
const { locale, currency } = adminConfig;
/** Money, e.g. 4660 -> "4,660 MAD". */
export function formatCurrency(value) {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        currencyDisplay: "code",
        maximumFractionDigits: 0,
    })
        .format(value)
        // Intl puts the code first ("MAD 4,660"); the invoices in the design read
        // "4,660 MAD", which is how the agency writes it.
        .replace(new RegExp(`^${currency}\\s?`), "")
        .concat(` ${currency}`);
}
/** Plain integer with thousands separators, e.g. 1234 -> "1,234". */
export function formatNumber(value) {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}
/** Short form for tight spaces, e.g. 12400 -> "12.4K". */
export function formatCompact(value) {
    return new Intl.NumberFormat(locale, {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}
/**
 * A percentage that is ALREADY a percentage, e.g. 65 -> "65%".
 *
 * Deliberately not Intl's `style: "percent"`, which expects a 0-1 ratio and
 * would turn 65 into "6,500%". Everything upstream works in whole percents
 * because that is what the API is expected to return.
 */
export function formatPercent(value, decimals = 0) {
    return `${value.toFixed(decimals)}%`;
}
/** A signed delta for trend chips, e.g. 4.2 -> "+4.2%", -3 -> "−3%".
 *  Uses a real minus sign (U+2212), not a hyphen — a hyphen at small sizes
 *  reads as a dash and is easy to miss entirely. */
export function formatDelta(value, decimals = 1) {
    const rounded = Number(value.toFixed(decimals));
    if (rounded === 0)
        return "0%";
    const sign = rounded > 0 ? "+" : "−";
    return `${sign}${Math.abs(rounded).toFixed(decimals)}%`;
}
/**
 * Money in a tight space, e.g. 453229 -> "453.2K MAD".
 *
 * The Reports revenue card shows this and puts the exact figure in a `title`,
 * because a KPI card is 40px of display type and "453,229 MAD" either wraps or
 * shrinks below the size the rest of the cluster uses. The full number is one
 * hover away and always in the CSV export.
 */
export function formatCompactCurrency(value) {
    return `${formatCompact(value)} ${currency}`;
}
/**
 * A delta measured in PERCENTAGE POINTS, e.g. 4.2 -> "+4.2 pts".
 *
 * Deliberately distinct from `formatDelta`, which renders "+4.2%". The two say
 * genuinely different things about a percentage KPI and the difference matters:
 * a conversion rate moving 18% -> 22% has gained 4 POINTS but risen 22
 * PERCENT. Printing the first as "%" is the standard way dashboards overstate
 * their own results.
 *
 * Uses a real minus sign (U+2212), matching formatDelta.
 */
export function formatDeltaPoints(value, decimals = 1) {
    const rounded = Number(value.toFixed(decimals));
    if (rounded === 0)
        return "0 pts";
    const sign = rounded > 0 ? "+" : "−";
    return `${sign}${Math.abs(rounded).toFixed(decimals)} pts`;
}
/**
 * "5 days ago" from a whole number of days.
 *
 * Takes a day count rather than a Date on purpose. Seed records store
 * `daysAgo`, which means the mock never calls `Date.now()` during render — a
 * timestamp computed on the server and again on the client can straddle a tick
 * and produce two different strings, which is a hydration mismatch that only
 * shows up intermittently and is miserable to track down.
 *
 * TODO(backend): when records carry real ISO timestamps, convert to a day count
 * in a `useEffect` (client-side only) and keep passing it here.
 */
export function formatDaysAgo(days) {
    if (days <= 0)
        return "Today";
    if (days === 1)
        return "Yesterday";
    return `${days} days ago`;
}
/**
 * An ISO calendar date as a short label, e.g. "2026-09-15" -> "15 Sep".
 *
 * PARSED BY HAND, AND FORMATTED IN UTC. `new Date("2026-09-15")` is defined as
 * UTC midnight, so formatting it in any timezone west of Greenwich renders the
 * PREVIOUS day — a target date typed as the 15th would show as the 14th for
 * anyone in Casablanca during winter time, and the agency is in Morocco. Fixing
 * the parse and the timezone together is what makes the string say what was
 * typed.
 *
 * Returns "" for null, so a caller can render the absence rather than "Invalid
 * Date".
 */
export function formatShortDate(iso) {
    if (!iso)
        return "";
    const [year, month, day] = iso.split("-").map(Number);
    if (!year || !month || !day)
        return "";
    return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day)));
}
/** The same date with the year, for places with room, e.g. "15 Sep 2026". */
export function formatDate(iso) {
    if (!iso)
        return "";
    const [year, month, day] = iso.split("-").map(Number);
    if (!year || !month || !day)
        return "";
    return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day)));
}
/** "4 days in stage" — the label under a kanban card. */
export function formatDaysInStage(days) {
    return `${days} ${days === 1 ? "day" : "days"} in stage`;
}
/**
 * Initials for an avatar, e.g. "Youssef El Amrani" -> "YE".
 *
 * First and last word rather than the first two, so "Youssef El Amrani" reads
 * YA-style rather than picking up the particle. Falls back to "?" for an empty
 * name instead of rendering a blank circle.
 */
export function initialsOf(name) {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0)
        return "?";
    if (words.length === 1)
        return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
/** First word of a name, for the dashboard greeting. */
export function firstNameOf(name) {
    return name.trim().split(/\s+/)[0] ?? name;
}
/**
 * Fills `{token}` placeholders in a config string.
 * `template("Hello, {firstName}", { firstName: "Hicham" })` -> "Hello, Hicham".
 */
export function template(text, values) {
    return text.replace(/\{(\w+)\}/g, (match, key) => key in values ? String(values[key]) : match);
}
