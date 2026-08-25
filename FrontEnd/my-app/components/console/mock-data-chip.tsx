"use client";

import { Database } from "lucide-react";

import { WarningChip } from "@/components/deck/warning-chip";
import { consoleConfig } from "@/config/console";

/**
 * The "Mock data" marker in the topbar.
 *
 * WHY THIS EXISTS: console state persists to localStorage, so it survives a
 * refresh, keeps the rows you added, and behaves exactly like a real database.
 * That is what makes it demoable — and also what makes it dangerous. Without a
 * standing marker, someone will screenshot a number from this console and put
 * it in a report.
 *
 * The chip treatment itself lives in components/deck/warning-chip.tsx, shared
 * with the login card's preview-build notice — the two make the same promise
 * and should never drift into making it differently.
 *
 * Remove it by setting `consoleConfig.features.mockDataChip = false`, which is
 * step 4 of connecting the backend (see lib/crm-api.ts).
 */
export function MockDataChip() {
  if (!consoleConfig.features.mockDataChip) return null;

  return (
    <WarningChip
      icon={Database}
      label={consoleConfig.content.mockDataLabel}
      title={consoleConfig.content.mockDataTooltip}
      // Hidden on the narrowest screens, where the topbar has to give its width
      // to the page title.
      // NOTE: this is why the guarantee above does not hold on a phone. See the
      // critique snapshot in .impeccable/critique/ — worth revisiting.
      className="hidden sm:inline-flex"
    />
  );
}
