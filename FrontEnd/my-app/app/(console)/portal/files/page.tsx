import type { Metadata } from "next";

import { FilesView } from "./files-view";

export const metadata: Metadata = {
  title: "Your files",
};

/** /portal/files — see app/(console)/portal/page.tsx for the pattern. */
export default function PortalFilesPage() {
  return <FilesView />;
}
