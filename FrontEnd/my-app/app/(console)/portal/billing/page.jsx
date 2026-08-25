import { BillingView } from "./billing-view";
export const metadata = {
    title: "Invoices",
};
/** /portal/billing — see app/(console)/portal/page.tsx for the pattern. */
export default function PortalBillingPage() {
    return <BillingView />;
}
