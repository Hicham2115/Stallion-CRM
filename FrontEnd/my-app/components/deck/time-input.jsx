"use client";
import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fieldBase } from "@/components/deck/field";
import { cn } from "@/lib/utils";

// The one time input for the console — a branded two-column picker (same
// Popover mechanism as DateInput) instead of the native <input type="time">,
// whose dropdown is OS-rendered (a blue-highlighted wheel/list on most
// platforms) and can't be restyled past color-scheme. DateInput's `withTime`
// mode renders this for the time half.

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function parseValue(value) {
  if (!value) return { hour: null, minute: null };
  const [h, m] = value.split(":");
  return { hour: h ?? null, minute: m ?? null };
}

/** One scrollable column of two-digit values, the active one lime-filled
 * and auto-scrolled into view whenever the picker opens. */
function TimeColumn({ values, active, onPick, open }) {
  const activeRef = useRef(null);

  useEffect(() => {
    if (open) activeRef.current?.scrollIntoView({ block: "center" });
  }, [open]);

  return (
    <ScrollArea className="h-56 w-14">
      <div className="flex flex-col gap-0.5 p-1">
        {values.map((v) => {
          const isActive = v === active;
          return (
            <button
              key={v}
              ref={isActive ? activeRef : undefined}
              type="button"
              onClick={() => onPick(v)}
              className={cn(
                "deck-nums rounded-md px-2 py-1.5 text-center text-[0.8125rem] transition-colors",
                isActive
                  ? "bg-brand text-deck-void font-medium"
                  : "text-ink-soft hover:bg-white/[0.06]",
              )}
            >
              {v}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export function TimeInput({
  value,
  onChange,
  className,
  placeholder = "Time",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const { hour, minute } = parseValue(value);

  function emit(nextHour, nextMinute) {
    onChange({ target: { value: `${nextHour}:${nextMinute}` } });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          fieldBase,
          "flex h-10 w-[6.5rem] items-center gap-2 whitespace-nowrap px-3 text-left text-[0.8125rem]",
          !value && "text-ink-muted",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <Clock aria-hidden className="size-3.5 shrink-0 text-ink-muted" />
        {value || placeholder}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto border-hairline bg-deck-card p-0">
        <div className="flex divide-x divide-hairline">
          <TimeColumn
            values={HOURS}
            active={hour}
            open={open}
            onPick={(h) => emit(h, minute ?? "00")}
          />
          <TimeColumn
            values={MINUTES}
            active={minute}
            open={open}
            onPick={(m) => emit(hour ?? "00", m)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
