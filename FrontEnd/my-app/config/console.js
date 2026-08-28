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
export const consoleConfig = {
    features: {
        notifications: true,
        // Disabled — mock (crm-store), not real dial data.
        sidebarStat: false,
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
        mockDataTooltip: "This console is running on sample data stored in your browser. Nothing here is real.",
        sidebarStatLabel: "Team dials / rep",
        repStatLabel: "My dials today",
        navLabel: "Main",
        undoLabel: "Undo",
        cancelLabel: "Cancel",
        storageFullTitle: "Changes are not being saved",
        storageFullBody: "This browser has run out of space for the demo data. Remove a screenshot or two, or reset the demo data in Settings.",
    },
};
