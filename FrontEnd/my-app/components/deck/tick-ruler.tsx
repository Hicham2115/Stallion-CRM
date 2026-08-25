import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * A hairline with measurement marks along it — the ruler from the login
 * footer, now shared.
 *
 * On the dashboard it runs under the KPI cluster, which is what makes four
 * cards read as one instrument rather than four unrelated boxes. The gradient
 * lives in `.deck-ruler` (app/globals.css) so the long
 * repeating-linear-gradient string is not copy-pasted around the JSX.
 */
export function TickRuler({
  className,
  fade,
}: {
  className?: string;
  /**
   * Where the ruling fades out, as a CSS percentage. Defaults to 92% — long,
   * for the wide dashboard cluster. The login footer passes "78%", which is
   * the shorter ruler that layout was designed around.
   */
  fade?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "deck-ruler h-2.5 w-full border-t border-hairline opacity-40",
        className,
      )}
      style={fade ? ({ "--deck-ruler-fade": fade } as CSSProperties) : undefined}
    />
  );
}
