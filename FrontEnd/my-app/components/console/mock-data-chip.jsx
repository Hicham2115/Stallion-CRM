"use client";
import { Database } from "lucide-react";
import { WarningChip } from "@/components/deck/warning-chip";
import { consoleConfig } from "@/config/console";
// Console state persists to localStorage and behaves like a real database,
// which is what makes it demoable and also dangerous without a standing
// "mock data" marker. Remove by setting
// consoleConfig.features.mockDataChip = false (step 4 of connecting the
// backend, see lib/crm-api.ts).
export function MockDataChip() {
    if (!consoleConfig.features.mockDataChip)
        return null;
    return (<WarningChip icon={Database} label={consoleConfig.content.mockDataLabel} title={consoleConfig.content.mockDataTooltip}
    // Hidden on the narrowest screens (topbar needs the width for the page
    // title) — the mock-data guarantee above doesn't hold on a phone. See
    // the critique snapshot in .impeccable/critique/.
    className="hidden sm:inline-flex"/>);
}
