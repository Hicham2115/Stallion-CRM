import { ProjectsView } from "./projects-view";
export const metadata = {
    title: "Projects",
};
// Route already guarded by app/(console)/dev/layout.tsx.
//
// TODO(backend): fetch the projects here, server-side, filtered to what this
// developer is allowed to see. Today it shows every client, which is right
// for a four-person agency and wrong once there are contractors.
export default function DevProjectsPage() {
    return <ProjectsView />;
}
