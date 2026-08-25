import { ClientsView } from "./clients-view";
export const metadata = {
    title: "Clients",
    description: "Everyone who has converted into a paying client for Stallion Advertising.",
};
// TODO(backend): once the API is live, fetch the clients here and pass them
// down as props. selectClients in lib/store/selectors.ts documents the one
// rule the endpoint has to reproduce: a client is a lead in the stage
// flagged isWon, never a separate table.
export default function ClientsPage() {
    return <ClientsView />;
}
