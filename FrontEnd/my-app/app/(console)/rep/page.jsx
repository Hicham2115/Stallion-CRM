import { RepDashboardView } from "./dashboard-view";
export const metadata = {
    title: "Dashboard",
    description: "Your own dials, appointments and pipeline at Stallion Advertising.",
};
// Route already guarded by app/(console)/rep/layout.tsx.
//
// TODO(backend): fetch this rep's leads here, server-side, filtered by the
// session's rep id — never a query param. selectRepKpis() in
// lib/store/selectors.ts documents every figure the API would need to return.
export default function RepDashboardPage() {
    return <RepDashboardView />;
}
