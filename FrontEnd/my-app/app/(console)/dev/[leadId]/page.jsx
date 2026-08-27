import { DevProjectView } from "./project-view";
export const metadata = {
    title: "Project",
};
// Next 16 makes `params` a Promise (reading params.leadId synchronously, as
// in Next 14, no longer works), so this component is async and awaits it.
//
// TODO(backend): fetch the project here and call notFound() server-side on a
// 404 — that returns a real 404 status, which the client-side check in the
// view can't (the response has already streamed as a 200 by then).
export default async function DevProjectPage({ params, }) {
    const { leadId } = await params;
    return <DevProjectView leadId={leadId}/>;
}
