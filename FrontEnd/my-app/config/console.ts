/**
 * ============================================================================
 *  CONSOLE SHELL CONFIGURATION
 * ============================================================================
 *  Copy and toggles for the chrome that wraps every signed-in page: the
 *  sidebar, the topbar, and the mock-data banner.
 *
 *  Per-page copy is NOT here — it lives next to each route in
 *  config/navigation.ts (`title` / `subtitle`), so adding a page means editing
 *  one object rather than two files.
 *
 *  Quick answers to the usual requests:
 *    - Hide the notification bell ..... features.notifications = false
 *    - Hide the sidebar stat card ..... features.sidebarStat = false
 *    - Hide the MOCK DATA chip ........ features.mockDataChip = false
 *    - Change the sidebar width ....... layout.sidebarWidth
 * ============================================================================
 */

export interface ConsoleFeatureFlags {
  /**
   * Bell in the topbar. Nothing is wired behind it yet — turn it on once
   * there is a notification feed to show.
   */
  notifications: boolean;
  /**
   * The "TEAM DIALS / REP" readout pinned to the bottom of the sidebar.
   * Its value comes from the same computed KPI as the dashboard card, so the
   * two can never disagree.
   */
  sidebarStat: boolean;
  /**
   * The small "MOCK DATA" chip in the topbar.
   *
   * KEEP THIS ON until the backend is connected. Console data persists to
   * localStorage, which means it survives a refresh and looks exactly like
   * real data — this chip is the only thing telling someone it isn't.
   */
  mockDataChip: boolean;
  /** Let the sidebar collapse to an icon rail. */
  collapsibleSidebar: boolean;
}

export interface ConsoleConfig {
  features: ConsoleFeatureFlags;
  layout: {
    /**
     * Max width of the content column on every console page.
     *
     * One value rather than a literal repeated on each screen: the pages are
     * meant to line up, and nine copies of `max-w-[105rem]` is nine chances for
     * one of them to drift.
     */
    contentMaxWidth: string;
    /** Expanded sidebar width. Any CSS length. */
    sidebarWidth: string;
    /** Collapsed (icon-only) sidebar width. */
    sidebarCollapsedWidth: string;
    /**
     * Cookie holding the collapse state. Read on the server so the sidebar
     * renders at the right width on the very first paint — restoring it in a
     * useEffect instead would flash expanded-then-collapsed on every load.
     */
    sidebarCookie: string;
    /**
     * How long that preference is remembered, in days.
     *
     * It was `max-age=31536000` written inline in the component — a number
     * nobody would recognise as a year, in the one place a reader is not
     * looking for configuration.
     */
    sidebarCookieDays: number;
  };
  /**
   * How long an Undo stays on screen, in milliseconds.
   *
   * One value for the whole console, because it is a PROMISE about how long the
   * action can be taken back — two different windows on two screens would make
   * that promise unreliable.
   *
   * TODO(backend): this has to match whatever the server actually guarantees.
   * If a delete is held for 5s server-side, an 8s toast offers an undo that
   * will fail for the last three. See restoreLead() in lib/crm-api.ts.
   */
  undoWindowMs: number;

  content: {
    skipToContent: string;
    /** Announced while a page skeleton is on screen. */
    loadingLabel: string;
    openMenu: string;
    closeMenu: string;
    collapseSidebar: string;
    expandSidebar: string;
    notificationsLabel: string;
    userMenuLabel: string;
    mockDataLabel: string;
    mockDataTooltip: string;
    /** Sidebar footer readout, for an admin: the team average. */
    sidebarStatLabel: string;
    /** The same readout for a sales rep, whose figure is first-person. */
    repStatLabel: string;
    /** Accessible name of the navigation landmark. */
    navLabel: string;
    /**
     * The action on an undo toast. One label for the console, next to the
     * window it is shown for — the two describe the same promise.
     */
    undoLabel: string;
    /** Default dismiss label on a confirmation dialog. */
    cancelLabel: string;
    /**
     * Shown once when the browser refuses to save console state.
     *
     * Realistic since the dev workspace can store screenshots: localStorage is
     * ~5MB for the whole origin. Without this the console keeps working
     * perfectly on screen and quietly stops persisting, so every change since
     * is lost on refresh with nothing anywhere to explain it.
     */
    storageFullTitle: string;
    storageFullBody: string;
  };
}

export const consoleConfig: ConsoleConfig = {
  features: {
    notifications: true,
    sidebarStat: true,
    mockDataChip: true,
    collapsibleSidebar: true,
  },

  undoWindowMs: 8000,

  layout: {
    contentMaxWidth: "105rem",
    sidebarWidth: "16.25rem",
    sidebarCollapsedWidth: "4.5rem",
    sidebarCookie: "stallion-sidebar-collapsed",
    sidebarCookieDays: 365,
  },

  content: {
    skipToContent: "Skip to main content",
    loadingLabel: "Loading dashboard",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu",
    collapseSidebar: "Collapse sidebar",
    expandSidebar: "Expand sidebar",
    notificationsLabel: "Notifications",
    userMenuLabel: "Account menu",
    mockDataLabel: "Mock data",
    mockDataTooltip:
      "This console is running on sample data stored in your browser. Nothing here is real.",
    sidebarStatLabel: "Team dials / rep",
    repStatLabel: "My dials today",
    navLabel: "Main",
    undoLabel: "Undo",
    cancelLabel: "Cancel",
    storageFullTitle: "Changes are not being saved",
    storageFullBody:
      "This browser has run out of space for the demo data. Remove a screenshot or two, or reset the demo data in Settings.",
  },
};
