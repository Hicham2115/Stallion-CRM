"use client";

import { useMemo, useState } from "react";
import { FolderGit2 } from "lucide-react";

import { PageShell } from "@/components/console/page-shell";
import { DevSkeleton } from "@/components/dev/dev-states";
import { NewProjectDialog } from "@/components/dev/new-project-dialog";
import { ProjectCard } from "@/components/dev/project-card";
import { useToday } from "@/components/dev/use-today";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { SegmentedControl } from "@/components/deck/segmented-control";
import { devConfig } from "@/config/dev";
import { template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { selectProjects } from "@/lib/store/selectors";
import { cn } from "@/lib/utils";
import { fieldBase } from "@/components/deck/field";

const { content, features } = devConfig;

/** All / Active / Launched. */
type StatusFilter = "all" | "active" | "launched";

/**
 * ============================================================================
 *  DEV WORKSPACE — PROJECTS
 * ============================================================================
 *  Every client project the team is delivering.
 *
 *  WHAT THE PROTOTYPE HAD, AND WHAT IT WAS MISSING. A grid of cards with a
 *  step count and a percentage — which answers "how far along is this" and
 *  stops there. With fourteen projects that is already a wall to read, and the
 *  question a developer actually opens this page with is narrower: which one
 *  needs me today. So three things were added, all of them subtractive:
 *
 *    search        type two letters instead of scanning fourteen names
 *    filter        Active hides the finished ones, which is most of the noise
 *    overdue chip  the only signal urgent enough to interrupt a scan
 *
 *  ORDER IS THE STORE'S ORDER, deliberately. Sorting by "most urgent" is
 *  tempting and wrong: cards would move under the pointer as steps get ticked,
 *  and the muscle memory of "mine is the third one" — which is how people
 *  actually navigate a grid they see every day — would break every session.
 *  The filter narrows; it never rearranges.
 * ============================================================================
 */
export function ProjectsView() {
  const { state } = useCrm();
  const today = useToday();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const projects = useMemo(
    () => selectProjects(state, today),
    [state, today],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return projects.filter((row) => {
      if (status === "active" && row.progress.launched) return false;
      if (status === "launched" && !row.progress.launched) return false;

      if (!needle) return true;
      // Name and company both, because half the team thinks of a project by
      // the person and half by the brand.
      return (
        row.lead.name.toLowerCase().includes(needle) ||
        row.lead.company.toLowerCase().includes(needle)
      );
    });
  }, [projects, query, status]);

  const filtering = query.trim().length > 0 || status !== "all";

  // The store renders from the seed on the server and on the first client
  // render, so projects are present immediately. Only a genuinely empty store
  // that has not hydrated yet is worth a skeleton.
  if (projects.length === 0 && !state.hydrated) return <DevSkeleton />;

  return (
    <PageShell>
      {/* ------------------------------------------------------------------ */}
      {/* Toolbar                                                             */}
      {/* ------------------------------------------------------------------ */}
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
              // Quiet: the lime in the content column is spent on the New
              // project button beside it. See THE ONE LIME ANSWER RULE.
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

        {features.newProject && <NewProjectDialog />}
      </div>

      {/* A filter that silently removes rows is a filter people distrust. The
          count is only announced while something IS filtered, so the region
          stays quiet on the default view. */}
      <p aria-live="polite" className="sr-only">
        {filtering
          ? template(content.list.resultCount, {
              n: visible.length,
              total: projects.length,
            })
          : ""}
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* The grid                                                            */}
      {/* ------------------------------------------------------------------ */}
      {projects.length === 0 ? (
        <Panel>
          <EmptyState
            icon={FolderGit2}
            title={content.list.emptyTitle}
            description={content.list.emptyDescription}
            action={features.newProject ? <NewProjectDialog /> : undefined}
          />
        </Panel>
      ) : visible.length === 0 ? (
        // Distinct from "no projects at all". Telling someone their FILTER is
        // empty, and offering to clear it, is the difference between a dead end
        // and a wrong turn.
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
          {visible.map((row) => (
            <li key={row.lead.id} className="flex">
              <ProjectCard row={row} />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
