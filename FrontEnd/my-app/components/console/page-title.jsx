"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from "react";
const EMPTY = {
    title: null,
    subtitle: null,
    parent: null,
};
const PageTitleContext = createContext(null);
export function PageTitleProvider({ children }) {
    const [value, setValue] = useState(EMPTY);
    const set = useCallback((next) => {
        setValue(next);
    }, []);
    const contextValue = useMemo(() => (Object.assign(Object.assign({}, value), { set })), [value, set]);
    return (<PageTitleContext.Provider value={contextValue}>
      {children}
    </PageTitleContext.Provider>);
}
// Returns nulls when the route title should win.
export function usePageTitle() {
    const context = useContext(PageTitleContext);
    if (!context)
        return EMPTY;
    const { title, subtitle, parent } = context;
    return { title, subtitle, parent };
}
// Overrides the topbar heading for as long as the caller is mounted. Pass
// null for the title while data is still loading — the route title shows
// in the meantime.
export function useSetPageTitle(next) {
    const context = useContext(PageTitleContext);
    const set = context?.set;
    const { title, subtitle = null, parent = null } = next;
    const parentLabel = parent?.label ?? null;
    const parentHref = parent?.href ?? null;
    useEffect(() => {
        if (!set)
            return;
        set({
            title,
            subtitle,
            parent: parentLabel && parentHref
                ? { label: parentLabel, href: parentHref }
                : null,
        });
        // Clears on unmount so the override doesn't outlive the page.
        return () => set(EMPTY);
        // Primitives, not the object, so an inline literal doesn't re-fire this.
    }, [set, title, subtitle, parentLabel, parentHref]);
}
