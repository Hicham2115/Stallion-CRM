import { ReportsView } from "./reports-view";
export const metadata = {
    title: "Reports",
    description: "Performance across sources, stages and reps for the Stallion Advertising sales team.",
};
// TODO(backend): once the API is live this page should take the range from
// searchParams, fetch server-side, and pass the figures down — which also
// makes a report URL shareable. See the note in reports-view.tsx.
export default function ReportsPage() {
    return <ReportsView />;
}
