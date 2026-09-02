import { AnalysisView } from "@/components/analysis/analysis-view";
export const metadata = {
    title: "Analysis",
    description: "Acquisition cost, unit economics and campaign return for Stallion Advertising.",
};
/** /admin/analysis — the same screen as /rep/analysis. See AnalysisView for
 *  why one component serves both roles. */
export default function AdminAnalysisPage() {
    return <AnalysisView />;
}
