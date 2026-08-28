"use client";
import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimeInput } from "@/components/deck/time-input";
import { fieldBase } from "@/components/deck/field";
import { cn } from "@/lib/utils";

// The one date/datetime input for the console — a real branded picker
// (Popover + the shadcn Calendar, both already themed to the app's brand
// colors via --primary) instead of the native <input type="date">, whose
// popup calendar is OS-rendered and can't be restyled past color-scheme.
// The time half (withTime) uses TimeInput, the same branded-picker
// treatment, instead of the native <input type="time"> — see that file.

function parseValue(value, withTime) {
  if (!value) return { date: undefined, time: "" };
  const [datePart, timePart] = withTime ? value.split("T") : [value, ""];
  const [y, m, d] = (datePart ?? "").split("-").map(Number);
  const date = y && m && d ? new Date(y, m - 1, d) : undefined;
  return { date, time: timePart ?? "" };
}

function formatDatePart(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function DateInput({
  withTime = false,
  value,
  onChange,
  className,
  placeholder = "Select date",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const { date, time } = parseValue(value, withTime);

  function emit(nextDatePart, nextTime) {
    if (!nextDatePart) {
      onChange({ target: { value: "" } });
      return;
    }
    const next = withTime ? `${nextDatePart}T${nextTime || "00:00"}` : nextDatePart;
    onChange({ target: { value: next } });
  }

  return (
    <div className="flex w-full items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            fieldBase,
            "flex h-10 w-full items-center gap-2 whitespace-nowrap px-3 text-left text-[0.8125rem]",
            !date && "text-ink-muted",
            disabled && "cursor-not-allowed opacity-50",
            className,
          )}
        >
          <CalendarIcon aria-hidden className="size-3.5 shrink-0 text-ink-muted" />
          {date ? formatDatePart(date) : placeholder}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto border-hairline bg-deck-card p-0"
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={(picked) => {
              if (!picked) return;
              emit(formatDatePart(picked), time);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {withTime && (
        <TimeInput
          value={time}
          disabled={disabled || !date}
          onChange={(e) => emit(date ? formatDatePart(date) : null, e.target.value)}
        />
      )}
    </div>
  );
}
