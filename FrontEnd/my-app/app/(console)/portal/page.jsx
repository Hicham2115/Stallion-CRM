import { PortalView } from "./portal-view";
export const metadata = {
    title: "My project",
};
// Route already guarded by app/(console)/portal/layout.tsx, so nothing to
// check here.
//
// TODO(backend): fetch the signed-in client's record here, server-side, from
// the session's client id (never a param) and pass it down — that's what
// makes the CLIENT-SAFE RULE enforceable, rather than internal fields
// reaching the browser and being politely ignored.
export default function PortalPage() {
    return <PortalView />;
}
