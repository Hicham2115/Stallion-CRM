import type { Metadata } from "next";

import { ClientsView } from "./clients-view";

export const metadata: Metadata = {
  title: "Clients",
  description:
    "Everyone who has converted into a paying client for Stallion Advertising.",
};

/**
 * /admin/clients
 *
 * A Server Component owning only the metadata — the list itself reads from the
 * CRM store, which lives in the browser.
 *
 * TODO(backend): once the API is live, fetch the clients here and pass them
 * down as props. `selectClients` in lib/store/selectors.ts documents the one
 * rule the endpoint has to reproduce: a client is a lead in the stage flagged
 * isWon, never a separate table.
 *
 * The page heading comes from config/navigation.ts via the topbar.
 */
export default function ClientsPage() {
  return <ClientsView />;
}
