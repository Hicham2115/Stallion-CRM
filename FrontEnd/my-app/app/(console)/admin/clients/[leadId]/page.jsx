import { LeadDetailView } from "./lead-detail-view";
export const metadata = {
    title: "Lead detail",
};
// Next 16 makes `params` a Promise (reading params.leadId synchronously, as
// in Next 14, no longer works), so this component is async and awaits it.
//
// TODO(backend): once the API is live, fetch the lead here and call
// notFound() server-side on a 404 — that returns a real 404 status, which
// the client-side check in the view can't (the response has already
// streamed as a 200 by then).
export default async function LeadDetailPage({ params, }) {
    const { leadId } = await params;
    return <LeadDetailView leadId={leadId}/>;
}
