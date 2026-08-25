import Image from "next/image";

import { brandConfig } from "@/config/brand";
import { cn } from "@/lib/utils";

/**
 * The agency logo, served from /public/brand.
 *
 * Two variants exist because the artwork is used at two very different sizes:
 *  - "lockup" — horse mark + "stallion advertising" wordmark, for headers.
 *  - "mark"   — the horse "S" alone, for the oversized background watermark
 *               (decorative, so it is hidden from assistive tech).
 *
 * File paths and intrinsic dimensions live in config/brand.ts. If the agency
 * ships new artwork, drop it in /public/brand and update it there — this
 * component does not need to change.
 *
 * Always pass a height class (e.g. "h-8"); width stays auto so the aspect
 * ratio is preserved and next/image does not warn.
 */
export function StallionLogo({
  variant = "lockup",
  className,
  priority = false,
}: {
  variant?: "lockup" | "mark";
  className?: string;
  /** Set on the header lockup so it is not lazy-loaded above the fold. */
  priority?: boolean;
}) {
  const asset = variant === "lockup" ? brandConfig.lockup : brandConfig.mark;

  return (
    <Image
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt={asset.alt}
      priority={priority}
      aria-hidden={asset.alt === "" || undefined}
      className={cn("w-auto", className)}
    />
  );
}
