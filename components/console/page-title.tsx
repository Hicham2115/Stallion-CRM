"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * ============================================================================
 *  DYNAMIC PAGE TITLE
 * ============================================================================
 *  Lets a detail page override the topbar heading that config/navigation.ts
 *  would otherwise supply for its route.
 *
 *  WHY THIS EXISTS. Titles are looked up from the route, which is exactly right
 *  for the six fixed screens: a page gets its heading by existing, and the
 *  heading can never disagree with the sidebar item pointing at it. But
 *  /admin/clients/[leadId] resolves to the Clients nav item, so every lead
 *  would have opened under a topbar reading "Clients" — the one place on the
 *  page where the record's name belongs.
 *
 *  The route lookup stays the default and this is a narrow override, so the
 *  six static screens are untouched. An override is automatically dropped when
 *  the page unmounts, which means navigating away can never leave a stale lead
 *  name in the bar.
 * ============================================================================
 */

interface PageTitleValue {
  title: string | null;
  subtitle: string | null;
  /** Breadcrumb shown above the title, e.g. back to Clients. */
  parent: { label: string; href: string } | null;
  set: (value: Omit<PageTitleValue, "set">) => void;
}

const EMPTY: Omit<PageTitleValue, "set"> = {
  title: null,
  subtitle: null,
  parent: null,
};

const PageTitleContext = createContext<PageTitleValue | null>(null);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState(EMPTY);

  const set = useCallback((next: Omit<PageTitleValue, "set">) => {
    setValue(next);
  }, []);

  const contextValue = useMemo<PageTitleValue>(
    () => ({ ...value, set }),
    [value, set],
  );

  return (
    <PageTitleContext.Provider value={contextValue}>
      {children}
    </PageTitleContext.Provider>
  );
}

/** Read the current override. Returns nulls when the route title should win. */
export function usePageTitle(): Omit<PageTitleValue, "set"> {
  const context = useContext(PageTitleContext);
  if (!context) return EMPTY;
  const { title, subtitle, parent } = context;
  return { title, subtitle, parent };
}

/**
 * Override the topbar heading for as long as the calling component is mounted.
 *
 * Pass `null` for the title while data is still loading — the route title shows
 * in the meantime, which is a better placeholder than an empty bar.
 */
export function useSetPageTitle(next: {
  title: string | null;
  subtitle?: string | null;
  parent?: { label: string; href: string } | null;
}): void {
  const context = useContext(PageTitleContext);
  const set = context?.set;

  const { title, subtitle = null, parent = null } = next;
  const parentLabel = parent?.label ?? null;
  const parentHref = parent?.href ?? null;

  useEffect(() => {
    if (!set) return;

    set({
      title,
      subtitle,
      parent: parentLabel && parentHref
        ? { label: parentLabel, href: parentHref }
        : null,
    });

    // Clearing on unmount is what keeps the override from outliving the page.
    return () => set(EMPTY);
    // Primitives rather than the object, so a caller passing an inline literal
    // does not re-fire this effect on every render.
  }, [set, title, subtitle, parentLabel, parentHref]);
}
