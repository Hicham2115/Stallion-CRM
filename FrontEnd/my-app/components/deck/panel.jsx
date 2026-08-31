var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { CornerTick } from "@/components/deck/corner-tick";
import { cn } from "@/lib/utils";
// Every block on every admin screen is a Panel; restyle the app's surfaces here.
// Uses .deck-inset (hard 1px ring + inner highlight) rather than .deck-lift's
// floating shadow — a dozen floating cards on one dashboard reads as clutter.
// .deck-lift stays reserved for things genuinely above the page: menus,
// dialogs, the card being dragged.
export function Panel(_a) {
    var { className, children, ticks = false } = _a, props = __rest(_a, ["className", "children", "ticks"]);
    return (<section className={cn("deck-inset relative rounded-md border border-hairline bg-deck-surface", className)} {...props}>
      {ticks && (
        // Smaller and fainter than the login's marks. At full size on a panel
        // this close to real controls, a crosshair starts reading as a "+"
        // button — which is the last thing a decorative mark should suggest.
        <>
          <CornerTick className="left-3 top-3 size-2.5 opacity-70"/>
          <CornerTick className="bottom-3 right-3 size-2.5 opacity-70"/>
        </>)}
      {children}
    </section>);
}
/** Title row. Put actions (filters, toggles) in `actions`. */
export function PanelHeader({ title, hint, actions, className, }) {
    return (<header className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6", className)}>
      <div className="min-w-0">
        <h2 className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
          {title}
        </h2>
        {hint && (<p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
            {hint}
          </p>)}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>);
}
/** Panel body. `flush` removes the padding for edge-to-edge tables. */
export function PanelBody(_a) {
    var { className, flush = false } = _a, props = __rest(_a, ["className", "flush"]);
    return (<div className={cn(flush ? "mt-5" : "p-5 pt-5 sm:p-6", className)} {...props}/>);
}
