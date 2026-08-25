"use client";
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
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cn } from "@/lib/utils";
function Progress(_a) {
    var { className, children, value } = _a, props = __rest(_a, ["className", "children", "value"]);
    return (<ProgressPrimitive.Root value={value} data-slot="progress" className={cn("flex flex-wrap gap-3", className)} {...props}>
      {children}
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressPrimitive.Root>);
}
function ProgressTrack(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<ProgressPrimitive.Track className={cn("relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted", className)} data-slot="progress-track" {...props}/>);
}
function ProgressIndicator(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<ProgressPrimitive.Indicator data-slot="progress-indicator" className={cn("h-full bg-primary transition-all", className)} {...props}/>);
}
function ProgressLabel(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<ProgressPrimitive.Label className={cn("text-sm font-medium", className)} data-slot="progress-label" {...props}/>);
}
function ProgressValue(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<ProgressPrimitive.Value className={cn("ml-auto text-sm text-muted-foreground tabular-nums", className)} data-slot="progress-value" {...props}/>);
}
export { Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue, };
