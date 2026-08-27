"use client";
import { useState } from "react";
import { Check, MoreHorizontal, Trash2, UserMinus, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/deck/confirm-dialog";
import { DataCell, DataRow, DataTable } from "@/components/deck/data-table";
import { EmptyState } from "@/components/deck/empty-state";
import { InitialsAvatar } from "@/components/deck/initials-avatar";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { StatusPill } from "@/components/deck/status-pill";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { settingsConfig } from "@/config/settings";
import { template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { cn } from "@/lib/utils";
const { content } = settingsConfig;
const COLUMNS = [
    { key: "rep", label: content.repColumn, width: "w-[15rem]" },
    { key: "email", label: content.emailColumn, hideBelow: "md" },
    { key: "status", label: content.statusColumn, width: "w-[8rem]" },
    { key: "actions", label: content.actionsColumn, srOnly: true, width: "w-[7rem]" },
];
// Edit stays inline (common, harmless); Deactivate/Delete move into a row
// menu, since Delete sitting one mis-click from Deactivate — an irreversible
// action beside a reversible one, styled identically — was the prototype's
// risk. Inactive rows dim and carry a pill so deactivation has a visible result.
export function RepsPanel() {
    const { state, actions } = useCrm();
    const [editingId, setEditingId] = useState(null);
    const [draftName, setDraftName] = useState("");
    const [pendingDelete, setPendingDelete] = useState(null);
    function startEdit(rep) {
        setEditingId(rep.id);
        setDraftName(rep.name);
    }
    async function saveEdit(rep) {
        const name = draftName.trim();
        // Empty name: treat as a cancel rather than saving a blank record.
        if (!name || name === rep.name) {
            setEditingId(null);
            return;
        }
        const result = await actions.saveRep(Object.assign(Object.assign({}, rep), { name }));
        if (result.ok)
            toast.success(template(content.saveRepToast, { name }));
        setEditingId(null);
    }
    async function toggleActive(rep) {
        const result = await actions.setRepActive(rep, !rep.active);
        if (!result.ok)
            return;
        toast.success(template(rep.active ? content.deactivateToast : content.reactivateToast, { name: rep.name }));
    }
    async function confirmDelete() {
        const rep = pendingDelete;
        if (!rep)
            return;
        const result = await actions.deleteRep(rep.id);
        if (result.ok) {
            toast.success(template(content.deleteRepToast, { name: rep.name }));
        }
    }
    return (<Panel>
      <PanelHeader title={content.repsTitle} hint={content.repsHint}/>

      <PanelBody flush>
        {state.reps.length === 0 ? (<EmptyState icon={UserPlus} title={content.emptyReps}/>) : (<DataTable columns={COLUMNS} caption={content.repsCaption} minWidth="38rem">
            {state.reps.map((rep) => {
                const editing = editingId === rep.id;
                return (<DataRow key={rep.id} className={cn(!rep.active && "opacity-55")}>
                  <DataCell>
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={rep.name}/>

                      {editing ? (<input autoFocus value={draftName} onChange={(event) => setDraftName(event.target.value)} onKeyDown={(event) => {
                            if (event.key === "Enter")
                                void saveEdit(rep);
                            if (event.key === "Escape")
                                setEditingId(null);
                        }} aria-label={`${content.editLabel} ${rep.name}`} className="deck-input h-8 min-w-0 flex-1 rounded-lg border border-brand/45 bg-white/[0.04] px-2.5 text-[0.875rem] text-ink caret-brand outline-none focus:ring-2 focus:ring-brand/25"/>) : (<span className="min-w-0">
                          <span className="block truncate text-[0.875rem] font-medium text-ink">
                            {rep.name}
                          </span>
                          <span className="block truncate text-[0.75rem] text-ink-muted">
                            {rep.role}
                          </span>
                        </span>)}
                    </div>
                  </DataCell>

                  <DataCell className="hidden md:table-cell">
                    <span className="block max-w-[16rem] truncate text-[0.8125rem] text-ink-soft">
                      {rep.email}
                    </span>
                  </DataCell>

                  <DataCell>
                    <StatusPill tone={rep.active ? "good" : "neutral"} label={rep.active ? content.activeLabel : content.inactiveLabel}/>
                  </DataCell>

                  <DataCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {editing ? (<>
                          <Button variant="ghost" size="icon-sm" aria-label={content.saveLabel} onClick={() => void saveEdit(rep)} className="text-brand">
                            <Check aria-hidden/>
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label={content.cancelLabel} onClick={() => setEditingId(null)} className="text-ink-muted">
                            <X aria-hidden/>
                          </Button>
                        </>) : (<>
                          <Button variant="ghost" size="sm" onClick={() => startEdit(rep)} className="text-ink-muted hover:text-ink">
                            {content.editLabel}
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${content.rowActionsLabel} — ${rep.name}`} className="text-ink-muted hover:text-ink"/>}>
                              <MoreHorizontal aria-hidden/>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="min-w-[11rem] border border-hairline bg-deck-card">
                              <DropdownMenuItem onClick={() => void toggleActive(rep)}>
                                {rep.active ? (<>
                                    <UserMinus aria-hidden/>
                                    {content.deactivateLabel}
                                  </>) : (<>
                                    <UserPlus aria-hidden/>
                                    {content.reactivateLabel}
                                  </>)}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem variant="destructive" onClick={() => setPendingDelete(rep)}>
                                <Trash2 aria-hidden/>
                                {content.deleteRepLabel}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>)}
                    </div>
                  </DataCell>
                </DataRow>);
            })}
          </DataTable>)}
      </PanelBody>

      <ConfirmDialog open={pendingDelete !== null} onOpenChange={(open) => {
            if (!open)
                setPendingDelete(null);
        }} title={content.deleteRepTitle} description={content.deleteRepDescription} recordName={pendingDelete ? `${pendingDelete.name} · ${pendingDelete.email}` : undefined} confirmLabel={content.deleteRepConfirmLabel} onConfirm={confirmDelete}/>
    </Panel>);
}
