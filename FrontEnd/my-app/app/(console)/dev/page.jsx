import { ProjectsView } from "./projects-view";
export const metadata = {
    title: "Projects",
};
// Route already guarded by app/(console)/dev/layout.tsx. Real leads, scoped
// server-side to this developer's own assignments — see
// LeadController::index().
export default function DevProjectsPage() {
    return <ProjectsView />;
}
