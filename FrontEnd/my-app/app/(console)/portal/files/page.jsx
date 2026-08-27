import { FilesView } from "./files-view";
export const metadata = {
    title: "Your files",
};
/** /portal/files — see app/(console)/portal/page.tsx for the pattern. */
export default function PortalFilesPage() {
    return <FilesView />;
}
