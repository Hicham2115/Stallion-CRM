import type { Metadata } from "next";

import { PreviewsView } from "./previews-view";

export const metadata: Metadata = {
  title: "Previews",
};

/** /portal/previews — see app/(console)/portal/page.tsx for the pattern. */
export default function PortalPreviewsPage() {
  return <PreviewsView />;
}
