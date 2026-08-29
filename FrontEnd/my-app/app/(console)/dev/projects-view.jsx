"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FolderGit2 } from "lucide-react";
import { PageShell } from "@/components/console/page-shell";
import { DevSkeleton } from "@/components/dev/dev-states";
import { LiveProjectCard } from "@/components/dev/live-project-card";
import { EmptyState } from "@/components/deck/empty-state";
import { fieldBase } from "@/components/deck/field";
import { Panel } from "@/components/deck/panel";
import { SegmentedControl } from "@/components/deck/segmented-control";
import { devConfig } from "@/config/dev";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";
import { cn } from "@/lib/utils";
const { content, features, routes } = devConfig;
// The list is real leads (GET /api/leads) — the backend always scopes this
// to leads where the signed-in dev is an assigned developer
// (LeadController::index), so there's no "all projects" view to
// accidentally show here. Step checklists/previews/live URL are real too
// (ProjectController) — DevProjectView fetches and syncs them itself once
// a card is opened, so this list only has to navigate there.
export function ProjectsView() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const {
    data: leads = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => (await api.get("/api/leads")).data,
  });

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error));
  }, [isError, error]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (status === "active" && (lead.stage === "delivered" || lead.stage === "lost")) return false;
      if (status === "launched" && lead.stage !== "delivered") return false;
      if (!needle) return true;
      return (
        lead.full_name?.toLowerCase().includes(needle) ||
        lead.business_type?.toLowerCase().includes(needle)
      );
    });
  }, [leads, query, status]);

  const filtering = query.trim().length > 0 || status !== "all";

  function openProject(lead) {
    router.push(routes.project(String(lead.id)));
  }

  if (isPending) return <DevSkeleton />;

  return (
    <PageShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {features.search && (
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={content.list.searchPlaceholder}
              aria-label={content.list.searchLabel}
              className={cn(fieldBase, "h-10 w-full px-3.5 sm:w-[18rem]")}
            />
          )}

          {features.statusFilter && (
            <SegmentedControl
              tone="quiet"
              label={content.list.filterLabel}
              value={status}
              onValueChange={setStatus}
              options={[
                { value: "all", label: content.list.filterAll },
                { value: "active", label: content.list.filterActive },
                { value: "launched", label: content.list.filterLaunched },
              ]}
            />
          )}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {filtering ? `${visible.length} of ${leads.length}` : ""}
      </p>

      {leads.length === 0 ? (
        <Panel>
          <EmptyState
            icon={FolderGit2}
            title={content.list.emptyTitle}
            description="Projects an admin assigns you to show up here."
          />
        </Panel>
      ) : visible.length === 0 ? (
        <Panel>
          <EmptyState
            icon={FolderGit2}
            title={content.list.noMatchTitle}
            description={content.list.noMatchDescription}
            action={
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
                className="mt-1 inline-flex h-10 items-center rounded-xl border border-hairline bg-white/[0.03] px-4 text-[0.875rem] font-medium text-ink transition-colors hover:border-hairline-strong hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                {content.list.clearFilters}
              </button>
            }
          />
        </Panel>
      ) : (
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((lead) => (
            <li key={lead.id} className="flex">
              <LiveProjectCard lead={lead} onOpen={openProject} />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
