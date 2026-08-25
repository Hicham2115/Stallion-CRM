import type { CSSProperties, ReactNode } from "react";

import { consoleConfig } from "@/config/console";
import { cn } from "@/lib/utils";

/**
 * The content column every console page renders into.
 *
 * WHY THIS EXISTS. Each screen previously repeated
 * `mx-auto flex w-full max-w-[105rem] flex-col gap-5` — nine copies of the same
 * literal, which is nine chances for one screen to end up a different width
 * from the one beside it. The pages are meant to line up, so the measurement
 * lives in `consoleConfig.layout.contentMaxWidth` and is applied here once.
 *
 * The width comes through a CSS custom property rather than a Tailwind class,
 * because an arbitrary-value class has to be a literal at build time — Tailwind
 * scans source text and cannot see a value that only exists at runtime.
 */
export function PageShell({
  children,
  className,
  /** Vertical rhythm between panels. Screens with their own grid can drop it. */
  gap = true,
  ...props
}: React.ComponentProps<"div"> & {
  children: ReactNode;
  className?: string;
  gap?: boolean;
}) {
  return (
    <div
      {...props}
      style={
        { "--content-max": consoleConfig.layout.contentMaxWidth } as CSSProperties
      }
      className={cn(
        "mx-auto flex w-full max-w-(--content-max) flex-col",
        gap && "gap-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
