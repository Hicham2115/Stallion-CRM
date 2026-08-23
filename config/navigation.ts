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
  CodeXml,
  Columns3,
  Eye,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  PanelsTopLeft,
  Receipt,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import { adminConfig } from "@/config/admin";
import { devConfig } from "@/config/dev";
import { loginConfig } from "@/config/login";
import { portalConfig } from "@/config/portal";
import { repConfig } from "@/config/rep";
import { roleDefinitions, type Role } from "@/config/roles";

/**
 * Who a person is.
 *
 * DEFINED IN config/roles.ts, and re-exported here so the many files that
 * already import `Role` from this module keep working. That file is also where
 * the data-flow map lives — which role writes which field, and which fields
 * must never reach which audience. Read it before adding a screen.
 *
 * TODO(backend): this must come from the authenticated session, not the client.
 * Hiding a nav item is a convenience, NOT a security boundary — a determined
 * user can still type the URL. Every route must also be authorised server-side.
 */
export type { Role };

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
   * Where each role lands after sign-in.
   *
   * DERIVED from `roleDefinitions` in config/roles.ts — the home route is
   * declared there, next to that role's purpose and permissions, so there is
   * one place to change it rather than two that can disagree. `homeFor()` in
   * lib/session.ts is what callers should actually use.
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
        /* ------------------------------------------------------------------
           THE AGENCY CONSOLE — admin only.

           These four were `["admin", "sales"]` while a rep had no front of
           their own. They are now admin-only: a rep gets the same four screens
           narrowed to their own leads, under /rep. Leaving sales here as well
           would give a rep two Dashboards in one sidebar, one of which shows
           the whole company's pipeline.
           ------------------------------------------------------------------ */
        {
          label: "Dashboard",
          href: adminConfig.routes.home,
          icon: LayoutDashboard,
          roles: ["admin"],
          title: "Hello, {firstName}",
          subtitle: "Here's your team's pipeline overview.",
        },
        {
          label: "Clients",
          href: adminConfig.routes.clients,
          icon: Users,
          roles: ["admin"],
          matchNested: true,
          title: "Clients",
          subtitle: "Everyone who has converted into a paying client.",
        },
        {
          label: "Pipeline",
          href: adminConfig.routes.pipeline,
          icon: Columns3,
          roles: ["admin"],
          title: "Pipeline",
          subtitle: "Drag leads between stages as they move forward.",
        },
        {
          label: "Team Chat",
          href: adminConfig.routes.chat,
          icon: MessageSquare,
          roles: ["admin"],
          title: "Team Chat",
          subtitle: "Message any rep on your team.",
        },
        {
          label: "Reports",
          href: adminConfig.routes.reports,
          icon: ChartColumn,
          roles: ["admin"],
          title: "Reports",
          subtitle: "Performance across sources, stages and reps.",
        },
        {
          label: "Settings",
          href: adminConfig.routes.settings,
          icon: Settings,
          roles: ["admin"],
          title: "Settings",
          subtitle: "Manage reps and pipeline stages.",
        },

        /* ------------------------------------------------------------------
           THE CLIENT PORTAL

           Same section on purpose. Every item above is `roles: ["admin",
           "sales"]` and every item below is `roles: ["client"]`, so the filter
           in components/console/console-nav.tsx renders one group or the
           other and never a mix — a client's sidebar shows these four and
           nothing else.

           Copy for the screens themselves lives in config/portal.ts; only the
           destination and its topbar heading are here.
           ------------------------------------------------------------------ */
        /* ------------------------------------------------------------------
           THE SALES REP WORKSPACE

           The same four destinations as the console above, narrowed to one
           person. The labels all start with "My" for exactly that reason: a
           rep opening "Pipeline" and seeing ten leads where their manager sees
           eighty should never have to wonder which one is broken.
           ------------------------------------------------------------------ */
        {
          label: "Dashboard",
          href: repConfig.routes.home,
          icon: LayoutDashboard,
          roles: ["sales"],
          title: "Hello, {firstName}",
          subtitle: "Your personal performance and pipeline.",
        },
        {
          label: "My Clients",
          href: repConfig.routes.clients,
          icon: Users,
          roles: ["sales"],
          title: "My Clients",
          subtitle: "Clients you have personally converted.",
        },
        {
          label: "My Pipeline",
          href: repConfig.routes.pipeline,
          icon: Columns3,
          roles: ["sales"],
          // Keeps "My Pipeline" lit on /rep/leads/[id] — the lead page is
          // reached from the board, so the board is where you came from.
          matchNested: true,
          title: "My Pipeline",
          subtitle: "Your own leads, staged toward conversion.",
        },
        {
          label: "Team Chat",
          href: repConfig.routes.chat,
          icon: MessageSquare,
          roles: ["sales"],
          title: "Team Chat",
          subtitle: "Message your manager.",
        },

        {
          label: "My Project",
          href: portalConfig.routes.home,
          icon: PanelsTopLeft,
          roles: ["client"],
          title: "Hello, {firstName}",
          subtitle: "Here is how your project is going.",
        },
        {
          label: "Previews",
          href: portalConfig.routes.previews,
          icon: Eye,
          roles: ["client"],
          title: "Previews",
          subtitle: "Everything we have shared with you so far.",
        },
        {
          label: "Files",
          href: portalConfig.routes.files,
          icon: FolderOpen,
          roles: ["client"],
          title: "Your files",
          subtitle: "Briefs, contracts and finished work.",
        },
        {
          label: "Invoices",
          href: portalConfig.routes.billing,
          icon: Receipt,
          roles: ["client"],
          title: "Invoices",
          subtitle: "What you have been billed, and what is outstanding.",
        },

        /* ------------------------------------------------------------------
           THE DEV WORKSPACE

           One destination on purpose. A developer opens this product to answer
           "what am I building and what have I shipped" — a second nav item
           would be a place for that answer to be split in half. Everything
           else lives on the project itself at /dev/[leadId].
           ------------------------------------------------------------------ */
        {
          label: "Projects",
          href: devConfig.routes.home,
          icon: CodeXml,
          roles: ["dev"],
          matchNested: true,
          title: "Projects",
          subtitle: "Every client project you are delivering.",
        },
      ],
    },
  ],

  // Derived, so a role's landing route is declared exactly once — beside its
  // purpose and its permissions in config/roles.ts.
  roleHome: Object.fromEntries(
    Object.values(roleDefinitions).map((role) => [role.id, role.home]),
  ) as Record<Role, string>,

  signOut: {
    label: "Log Out",
    // The sign-in route is declared once, in config/login.ts — this used to be
    // a second copy of the string "/login".
    href: loginConfig.routes.login,
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
