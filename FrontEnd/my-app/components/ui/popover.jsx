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
import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";
function Popover(_a) {
    var props = __rest(_a, []);
    return <PopoverPrimitive.Root data-slot="popover" {...props}/>;
}
function PopoverTrigger(_a) {
    var props = __rest(_a, []);
    return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props}/>;
}
function PopoverContent(_a) {
    var { className, align = "center", alignOffset = 0, side = "bottom", sideOffset = 4 } = _a, props = __rest(_a, ["className", "align", "alignOffset", "side", "sideOffset"]);
    return (<PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset} className="isolate z-50">
        <PopoverPrimitive.Popup data-slot="popover-content" className={cn("z-50 flex w-72 origin-(--transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className)} {...props}/>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>);
}
function PopoverHeader(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<div data-slot="popover-header" className={cn("flex flex-col gap-0.5 text-sm", className)} {...props}/>);
}
function PopoverTitle(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<PopoverPrimitive.Title data-slot="popover-title" className={cn("font-medium", className)} {...props}/>);
}
function PopoverDescription(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<PopoverPrimitive.Description data-slot="popover-description" className={cn("text-muted-foreground", className)} {...props}/>);
}
export { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger, };
