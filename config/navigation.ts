/**
 * ============================================================================
 *  CONSOLE NAVIGATION
 * ============================================================================
 *  The one list of destinations in the app. The sidebar, the mobile nav and
 *  the page-title lookup in the topbar all read from it, so a route added here
 *  appears everywhere at once and can never fall out of sync.
 *
 *  Quick answers to the usual requests:
 *    - Add a page ..................... push a NavItem into `sections`
 *    - Reorder the menu ............... reorder the array
 *    - Hide a page from sales reps .... trim its `roles` array
 *    - Rename the "MAIN MENU" label ... sections[n].label
 *    - Change where a role lands ...... roleHome
 * ============================================================================
 */

import {
  Bell,
  ChartColumn,
  Columns3,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Who a person is, which decides what they can see.
 *
 * TODO(backend): this must come from the authenticated session, not the client.
 * Hiding a nav item is a convenience, NOT a security boundary — a determined
 * user can still type the URL. Every route must also be authorised server-side.
 */
export type Role = "admin" | "sales" | "client";

export interface NavItem {
  /** Label shown in the sidebar. */
  label: string;
  /** Absolute route. Must match a folder under app/(console)/. */
  href: string;
  /** Icon component from lucide-react — passed as the component, not a string,
   *  so a typo is a TypeScript error rather than a blank square at runtime. */
  icon: LucideIcon;
  /** Roles allowed to see this item. Empty array = visible to nobody. */
  roles: Role[];
  /**
   * Page title + subtitle shown in the topbar for this route. Kept next to the
   * route so adding a page means editing exactly one object.
   */
  title: string;
  subtitle: string;
  /**
   * Marks routes whose children should keep the parent highlighted, e.g.
   * /admin/clients/[leadId] keeps "Clients" active. Without this the sidebar
   * goes blank the moment you open a detail page.
   */
  matchNested?: boolean;
}

export interface NavSection {
  /** Small uppercase heading above the group. Empty string renders no heading. */
  label: string;
  items: NavItem[];
}

export interface NavigationConfig {
  sections: NavSection[];
  /**
   * Where each role lands after sign-in. `lib/auth.ts` should read from this
   * once the session carries a role, instead of the single fixed
   * `loginConfig.routes.afterSignIn`.
   */
  roleHome: Record<Role, string>;
  /** The sign-out control at the bottom of the sidebar. */
  signOut: { label: string; href: string };
}

export const navigation: NavigationConfig = {
  sections: [
    {
      label: "Main menu",
      items: [
        {
          label: "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
          roles: ["admin", "sales"],
          title: "Hello, {firstName}",
          subtitle: "Here's your team's pipeline overview.",
        },
        {
          label: "Clients",
          href: "/admin/clients",
          icon: Users,
          roles: ["admin", "sales"],
          matchNested: true,
          title: "Clients",
          subtitle: "Everyone who has converted into a paying client.",
        },
        {
          label: "Pipeline",
          href: "/admin/pipeline",
          icon: Columns3,
          roles: ["admin", "sales"],
          title: "Pipeline",
          subtitle: "Drag leads between stages as they move forward.",
        },
        {
          label: "Team Chat",
          href: "/admin/chat",
          icon: MessageSquare,
          roles: ["admin", "sales"],
          title: "Team Chat",
          subtitle: "Message any rep on your team.",
        },
        {
          label: "Reports",
          href: "/admin/reports",
          icon: ChartColumn,
          roles: ["admin"],
          title: "Reports",
          subtitle: "Performance across sources, stages and reps.",
        },
        {
          label: "Settings",
          href: "/admin/settings",
          icon: Settings,
          roles: ["admin"],
          title: "Settings",
          subtitle: "Manage reps and pipeline stages.",
        },
      ],
    },
  ],

  roleHome: {
    admin: "/admin",
    sales: "/admin",
    client: "/admin",
  },

  signOut: {
    label: "Log Out",
    href: "/login",
  },
};

/** Every item across every section, flattened. */
export const allNavItems: NavItem[] = navigation.sections.flatMap(
  (section) => section.items,
);

/**
 * The nav item that owns a pathname, used for the active state and the topbar
 * title. Longest match wins, so /admin/clients beats /admin for
 * /admin/clients/42 — a plain `startsWith` scan would light up both.
 */
export function findNavItem(pathname: string): NavItem | undefined {
  return allNavItems
    .filter((item) =>
      item.matchNested
        ? pathname === item.href || pathname.startsWith(`${item.href}/`)
        : pathname === item.href,
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
}

/** Icon for the topbar notification control. Here so the shell imports one module. */
export const notificationIcon = Bell;
