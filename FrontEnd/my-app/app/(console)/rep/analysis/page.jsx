import { AnalysisView } from "@/components/analysis/analysis-view";
export const metadata = {
    title: "Analysis",
    description: "Acquisition cost, unit economics and campaign return for Stallion Advertising.",
};
/** /rep/analysis — the same screen as /admin/analysis, and deliberately NOT
 *  scoped to the signed-in rep: ad spend is a company figure, and a "cost per
 *  customer" narrowed to one rep's leads would not be one. See AnalysisView. */
export default function RepAnalysisPage() {
    return <AnalysisView />;
}
