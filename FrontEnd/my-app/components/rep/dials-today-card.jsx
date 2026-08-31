"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { fieldBase } from "@/components/deck/field";
import { formatNumber, template } from "@/lib/format";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";
import { cn } from "@/lib/utils";

// The one editable KPI card on the rep dashboard — every other card here is
// read-only (derived from leads), but dial counts have no phone-system
// integration to read from; a rep types their own number in. Real data
// (GET/PATCH /api/dials/today), same card proportions as KpiCard so it
// sits in the same row without looking like a different kind of thing.
export function DialsTodayCard({ definition, revealDelay = 0 }) {
  const Icon = definition.icon;
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["dials-today"],
    queryFn: async () => (await api.get("/api/dials/today")).data,
  });
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(false);

  const save = useMutation({
    mutationFn: async (count) => (await api.patch("/api/dials/today", { count })).data,
    onSuccess: (updated) => {
      queryClient.setQueryData(["dials-today"], updated);
      toast.success("Dial count saved");
      setEditing(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const today = data?.today ?? 0;
  const allTime = data?.all_time ?? 0;

  function startEditing() {
    setValue(String(today));
    setEditing(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const count = Number(value);
    if (!Number.isFinite(count) || count < 0) return;
    save.mutate(Math.round(count));
  }

  return (
    <div
      className="reveal deck-inset relative flex flex-col overflow-hidden rounded-md border border-hairline bg-deck-surface p-5"
      style={{ "--reveal-delay": `${revealDelay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
          {definition.label}
        </p>
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-md border border-hairline bg-white/[0.03] text-ink-muted"
        >
          <Icon className="size-4" />
        </span>
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="1"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={cn(fieldBase, "h-11 w-24 px-3 font-display text-[1.5rem]")}
          />
          <button
            type="submit"
            disabled={save.isPending}
            aria-label="Save dial count"
            className="grid size-9 shrink-0 place-items-center rounded-md bg-brand text-deck-void transition hover:brightness-110 disabled:opacity-50"
          >
            <Check aria-hidden className="size-4" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={startEditing}
          disabled={isPending}
          className="mt-4 flex items-baseline gap-2 text-left"
        >
          <span className="deck-nums font-display text-[2.5rem] font-semibold leading-none tracking-[-0.04em] text-ink">
            {formatNumber(today)}
          </span>
          <span className="text-[0.75rem] text-ink-muted underline-offset-2 hover:underline">
            edit
          </span>
        </button>
      )}

      <div className="mt-auto pt-4">
        <p className="text-[0.8125rem] text-ink-muted">
          {template(definition.caption, { n: formatNumber(allTime) })}
        </p>
      </div>
    </div>
  );
}
