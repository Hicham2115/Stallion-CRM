"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { StallionLogo } from "@/components/brand/stallion-logo";
import { ConsoleNav } from "@/components/console/console-nav";
import { SidebarStat } from "@/components/console/sidebar-stat";
import { SignOutLink } from "@/components/console/sign-out-link";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger, } from "@/components/ui/sheet";
import { brandConfig } from "@/config/brand";
import { consoleConfig } from "@/config/console";
import { roleDefinitions } from "@/config/roles";
// Slide-over rather than a squeezed rail below `lg`, since an icon-only
// column would permanently cost a fifth of the width on a phone. Closes
// itself on navigation.
export function MobileNav({ role }) {
    const [open, setOpen] = useState(false);
    return (<Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<button type="button" aria-label={consoleConfig.content.openMenu} className="grid size-10 place-items-center rounded-xl border border-hairline bg-white/[0.03] text-ink-soft transition-colors hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 lg:hidden"/>}>
        <Menu aria-hidden className="size-[1.15rem]"/>
      </SheetTrigger>

      <SheetContent side="left" className="deck-grid w-[17rem] border-hairline bg-deck-rail p-0">
        {/* Both are required for an accessible dialog. The description is
            visually hidden because the menu explains itself on sight. */}
        <SheetTitle className="sr-only">{brandConfig.productName} navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Links to every section of the console.
        </SheetDescription>

        <div className="relative z-10 flex h-full flex-col">
          <div className="flex h-[4.5rem] shrink-0 items-center gap-3 px-5">
            <StallionLogo variant="lockup" className="h-6"/>
            <span className="font-mono text-xs uppercase tracking-[0.24em] text-brand">
              {brandConfig.productName}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pt-2">
            <ConsoleNav role={role} onNavigate={() => setOpen(false)}/>
          </div>

          <div className="mt-auto flex flex-col gap-2 p-3">
            {consoleConfig.features.sidebarStat &&
            roleDefinitions[role].sidebarStat !== "none" && <SidebarStat />}
            <SignOutLink onNavigate={() => setOpen(false)}/>
          </div>
        </div>
      </SheetContent>
    </Sheet>);
}
