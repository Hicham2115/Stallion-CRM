import Link from "next/link";
import { UserX } from "lucide-react";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { adminConfig } from "@/config/admin";
import { leadConfig } from "@/config/lead";
const { content } = leadConfig;
// Scoped to this route segment rather than the app-wide 404, so the console
// shell (sidebar, topbar) stays around it instead of dropping the user out.
export default function LeadNotFound() {
    return (<div className="mx-auto w-full max-w-2xl">
      <Panel>
        <EmptyState icon={UserX} title={content.notFoundTitle} description={content.notFoundDescription} action={<Link href={adminConfig.routes.clients} className="mt-1 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-[0.875rem] font-semibold text-deck-void transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-deck-surface">
              {content.notFoundAction}
            </Link>}/>
      </Panel>
    </div>);
}
