import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProgressIndicator({ steps, currentStep }) {
  const percent = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isDone = index < currentStep;
          const isActive = index === currentStep;
          return (
            <div key={step.key} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors sm:size-8",
                  isDone && "border-[#bafc0c] bg-[#bafc0c] text-[#0f1215]",
                  isActive && !isDone && "border-[#bafc0c] text-[#bafc0c]",
                  !isActive && !isDone && "border-white/15 text-white/40",
                )}
              >
                {isDone ? <Check className="size-4" /> : <Icon className="size-3.5 sm:size-4" />}
              </div>
              <span
                className={cn(
                  "hidden text-[11px] font-medium sm:block",
                  isActive || isDone ? "text-white/80" : "text-white/35",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#bafc0c] transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2 text-center text-xs font-medium text-white/40">
        Step {currentStep + 1} of {steps.length}
      </p>
    </div>
  );
}
