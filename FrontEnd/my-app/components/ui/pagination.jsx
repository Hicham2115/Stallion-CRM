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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
function Pagination(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<nav role="navigation" aria-label="pagination" data-slot="pagination" className={cn("mx-auto flex w-full justify-center", className)} {...props}/>);
}
function PaginationContent(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<ul data-slot="pagination-content" className={cn("flex items-center gap-0.5", className)} {...props}/>);
}
function PaginationItem(_a) {
    var props = __rest(_a, []);
    return <li data-slot="pagination-item" {...props}/>;
}
function PaginationLink(_a) {
    var { className, isActive, size = "icon" } = _a, props = __rest(_a, ["className", "isActive", "size"]);
    return (<Button variant={isActive ? "outline" : "ghost"} size={size} className={cn(className)} nativeButton={false} render={<a aria-current={isActive ? "page" : undefined} data-slot="pagination-link" data-active={isActive} {...props}/>}/>);
}
function PaginationPrevious(_a) {
    var { className, text = "Previous" } = _a, props = __rest(_a, ["className", "text"]);
    return (<PaginationLink aria-label="Go to previous page" size="default" className={cn("pl-1.5!", className)} {...props}>
      <ChevronLeftIcon data-icon="inline-start"/>
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>);
}
function PaginationNext(_a) {
    var { className, text = "Next" } = _a, props = __rest(_a, ["className", "text"]);
    return (<PaginationLink aria-label="Go to next page" size="default" className={cn("pr-1.5!", className)} {...props}>
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon data-icon="inline-end"/>
    </PaginationLink>);
}
function PaginationEllipsis(_a) {
    var { className } = _a, props = __rest(_a, ["className"]);
    return (<span aria-hidden data-slot="pagination-ellipsis" className={cn("flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4", className)} {...props}>
      <MoreHorizontalIcon />
      <span className="sr-only">More pages</span>
    </span>);
}
export { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, };
