import { CreateAccountPanel } from "@/components/admin/settings/create-account-panel";
import { RepsPanel } from "@/components/admin/settings/reps-panel";
import { ResetDemoPanel } from "@/components/admin/settings/reset-demo-panel";
import { StageEditor } from "@/components/admin/settings/stage-editor";
import { settingsConfig } from "@/config/settings";
import { PageShell } from "@/components/console/page-shell";
export const metadata = {
    title: "Settings",
    description: "Manage reps and pipeline stages for the Stallion Advertising console.",
};
const { features } = settingsConfig;
export default function SettingsPage() {
    return (<PageShell>
      {(features.createAccount || features.stageEditor) && (<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {features.createAccount && <CreateAccountPanel />}
          {features.stageEditor && <StageEditor />}
        </div>)}

      {features.repManagement && <RepsPanel />}

      {features.resetDemoData && <ResetDemoPanel />}
    </PageShell>);
}
