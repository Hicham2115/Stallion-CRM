import type { Metadata } from "next";

import { CreateAccountPanel } from "@/components/admin/settings/create-account-panel";
import { RepsPanel } from "@/components/admin/settings/reps-panel";
import { ResetDemoPanel } from "@/components/admin/settings/reset-demo-panel";
import { StageEditor } from "@/components/admin/settings/stage-editor";
import { settingsConfig } from "@/config/settings";
import { PageShell } from "@/components/console/page-shell";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage reps and pipeline stages for the Stallion Advertising console.",
};

const { features } = settingsConfig;

/**
 * /admin/settings
 *
 * A Server Component owning only layout — every panel below reads from the CRM
 * store in the browser.
 *
 * LAYOUT: the create form and the stage editor are both narrow, tall controls,
 * so they share a row; the rep roster is a table and gets the full width. The
 * demo-data reset sits last, away from the controls people use daily.
 *
 * The page heading comes from config/navigation.ts via the topbar.
 */
export default function SettingsPage() {
  return (
    <PageShell>
      {(features.createAccount || features.stageEditor) && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {features.createAccount && <CreateAccountPanel />}
          {features.stageEditor && <StageEditor />}
        </div>
      )}

      {features.repManagement && <RepsPanel />}

      {features.resetDemoData && <ResetDemoPanel />}
    </PageShell>
  );
}
