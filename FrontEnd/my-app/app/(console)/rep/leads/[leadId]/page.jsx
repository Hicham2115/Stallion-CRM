import { RepLeadView } from "./lead-view";
export const metadata = { title: "Lead" };
// Next 16 makes `params` a Promise, so this component is async and awaits it.
//
// TODO(backend): fetch the lead here, scoped to the session's rep, and call
// notFound() server-side when it doesn't resolve — that's also where the
// ownership check stops being cosmetic.
export default async function RepLeadPage({ params, }) {
    const { leadId } = await params;
    return <RepLeadView leadId={leadId}/>;
}
