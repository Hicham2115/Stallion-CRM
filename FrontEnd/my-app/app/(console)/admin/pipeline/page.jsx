import { PipelineView } from "./pipeline-view";
export const metadata = {
    title: "Pipeline",
    description: "Drag leads between stages as they move through the Stallion Advertising sales funnel.",
};
export default function PipelinePage() {
    return <PipelineView />;
}
