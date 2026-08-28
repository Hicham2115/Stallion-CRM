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
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react";
const Select = SelectPrimitive.Root;
function SelectGroup(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<SelectPrimitive.Group data-slot="select-group" className={cn("scroll-my-1 p-1", className)} {...props}/>);
}
function SelectValue(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<SelectPrimitive.Value data-slot="select-value" className={cn("flex flex-1 text-left", className)} {...props}/>);
}
function SelectTrigger(_a) {
    var { className, size = "default", children } = _a, props = __rest(_a, ["className", "size", "children"]);
    return (<SelectPrimitive.Trigger data-slot="select-trigger" data-size={size} className={cn("deck-input flex w-fit items-center justify-between gap-1.5 rounded-xl border border-hairline bg-white/[0.02] py-2 pr-2 pl-2.5 text-sm whitespace-nowrap text-ink caret-brand outline-none transition duration-200 select-none hover:border-hairline-strong hover:bg-white/[0.035] focus-visible:border-brand/55 focus-visible:bg-white/[0.05] focus-visible:ring-4 focus-visible:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-status-critical/45 aria-invalid:ring-4 aria-invalid:ring-status-critical/10 data-placeholder:text-ink-muted data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className)} {...props}>
      {children}
      <SelectPrimitive.Icon render={<ChevronDownIcon className="pointer-events-none size-4 text-ink-muted"/>}/>
    </SelectPrimitive.Trigger>);
}
function SelectContent(_a) {
    var { className, children, side = "bottom", sideOffset = 4, align = "center", alignOffset = 0, alignItemWithTrigger = true } = _a, props = __rest(_a, ["className", "children", "side", "sideOffset", "align", "alignOffset", "alignItemWithTrigger"]);
    return (<SelectPrimitive.Portal>
      <SelectPrimitive.Positioner side={side} sideOffset={sideOffset} align={align} alignOffset={alignOffset} alignItemWithTrigger={alignItemWithTrigger} className="isolate z-50">
        <SelectPrimitive.Popup data-slot="select-content" data-align-trigger={alignItemWithTrigger} className={cn("deck-lift relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl border border-hairline bg-deck-card text-ink duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className)} {...props}>
          <SelectScrollUpButton />
          <SelectPrimitive.List className="p-1">{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>);
}
function SelectLabel(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<SelectPrimitive.GroupLabel data-slot="select-label" className={cn("px-1.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted", className)} {...props}/>);
}
// Selected row gets the same brand-lime fill as TimeInput's active value and
// the Calendar's selected day — one "this is the chosen one" treatment
// reused everywhere instead of a generic accent-colored highlight.
function SelectItem(_a) {
    var { className, children } = _a, props = __rest(_a, ["className", "children"]);
    return (<SelectPrimitive.Item data-slot="select-item" className={cn("relative flex w-full cursor-default items-center gap-1.5 rounded-lg py-1.5 pr-8 pl-2.5 text-[0.8125rem] outline-hidden select-none transition-colors data-highlighted:bg-white/[0.06] data-selected:bg-brand data-selected:text-deck-void data-selected:font-medium data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2", className)} {...props}>
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator render={<span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center"/>}>
        <CheckIcon className="pointer-events-none"/>
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>);
}
function SelectSeparator(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<SelectPrimitive.Separator data-slot="select-separator" className={cn("pointer-events-none -mx-1 my-1 h-px bg-hairline", className)} {...props}/>);
}
function SelectScrollUpButton(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<SelectPrimitive.ScrollUpArrow data-slot="select-scroll-up-button" className={cn("top-0 z-10 flex w-full cursor-default items-center justify-center bg-deck-card py-1 text-ink-muted [&_svg:not([class*='size-'])]:size-4", className)} {...props}>
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>);
}
function SelectScrollDownButton(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<SelectPrimitive.ScrollDownArrow data-slot="select-scroll-down-button" className={cn("bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-deck-card py-1 text-ink-muted [&_svg:not([class*='size-'])]:size-4", className)} {...props}>
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>);
}
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue, };
