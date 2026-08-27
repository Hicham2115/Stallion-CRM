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
import { consoleConfig } from "@/config/console";
import { cn } from "@/lib/utils";
// The content column every console page renders into, so the max width
// lives once in consoleConfig.layout.contentMaxWidth instead of being
// repeated per screen. Applied via a CSS custom property, not a Tailwind
// class, since Tailwind can't see a value that only exists at runtime.
export function PageShell(_a) {
    var { children, className, 
    /** Vertical rhythm between panels. Screens with their own grid can drop it. */
    gap = true } = _a, props = __rest(_a, ["children", "className", "gap"]);
    return (<div {...props} style={{ "--content-max": consoleConfig.layout.contentMaxWidth }} className={cn("mx-auto flex w-full max-w-(--content-max) flex-col", gap && "gap-5", className)}>
      {children}
    </div>);
}
