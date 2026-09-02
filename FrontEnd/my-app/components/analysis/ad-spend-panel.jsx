"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Trash2, Upload, Wallet } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/deck/confirm-dialog";
import { DataCell, DataRow, DataTable } from "@/components/deck/data-table";
import { EmptyState } from "@/components/deck/empty-state";
import { fieldLabel } from "@/components/deck/field";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { analysisConfig } from "@/config/analysis";
import { api } from "@/lib/axios";
import { formatCurrency, formatDate, formatNumber, template } from "@/lib/format";
import { getErrorMessage } from "@/lib/get-error-message";
const { content, features, spendColumns, upload } = analysisConfig;
const HIDE_BELOW = {
    sm: "hidden sm:table-cell",
    md: "hidden md:table-cell",
    lg: "hidden lg:table-cell",
    xl: "hidden xl:table-cell",
};
/**
 * The write side of the Analysis screen: a Meta Ads Manager CSV goes in,
 * `ad_spend` rows come out, and every cost figure on the Economics tab is
 * built from them.
 *
 * The file is uploaded RAW — no client-side parsing. The server owns header
 * mapping, date and amount parsing, and per-row validation (see
 * AdSpendController), so there is exactly one implementation of "what counts
 * as a valid row" rather than two that can disagree. The only checks here are
 * the two that save a pointless round trip: type and size, both mirroring the
 * server's own rule.
 */
export function AdSpendPanel() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState(null);
    const [skippedRows, setSkippedRows] = useState([]);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [confirmClearAll, setConfirmClearAll] = useState(false);

    const { data, isPending, isError, error } = useQuery({
        queryKey: ["ad-spend"],
        queryFn: async () => (await api.get("/api/ad-spend")).data,
    });

    useEffect(() => {
        if (isError) toast.error(getErrorMessage(error));
    }, [isError, error]);

    const rows = data?.data ?? [];
    const total = data?.total ?? 0;

    /** New spend changes every cost figure on the other tab, so both caches
     *  go — otherwise Economics keeps showing pre-import numbers until
     *  something else happens to refetch it. */
    function invalidateSpendAndKpis() {
        queryClient.invalidateQueries({ queryKey: ["ad-spend"] });
        queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }

    function clearFileInput() {
        setFile(null);
        setFileError(null);
        // The input keeps its own value; without this, picking the SAME file
        // again after a failed import fires no change event.
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    const importCsv = useMutation({
        mutationFn: async (csv) => {
            const form = new FormData();
            form.append("file", csv);
            return (await api.post("/api/ad-spend/import", form)).data;
        },
        onSuccess: (result) => {
            invalidateSpendAndKpis();
            // Kept on screen rather than in the toast: a list of skipped rows
            // is something you read and act on, and a toast disappears.
            setSkippedRows(result.errors ?? []);
            clearFileInput();

            const summary = template(content.importToast, {
                imported: formatNumber(result.imported),
            });
            const detail = result.skipped > 0
                ? template(content.importToastDetail, { skipped: formatNumber(result.skipped) })
                : content.importToastClean;

            // Zero imported is not a success worth a green toast — every row
            // in the file was rejected.
            if (result.imported === 0) {
                toast.error(content.importedNothing, { description: detail });
                return;
            }
            toast.success(summary, { description: detail });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const removeRow = useMutation({
        mutationFn: async (id) => (await api.delete(`/api/ad-spend/${id}`)).data,
        onSuccess: () => {
            invalidateSpendAndKpis();
            toast.success(content.deleteRowToast);
            setPendingDelete(null);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const clearAll = useMutation({
        mutationFn: async () => (await api.delete("/api/ad-spend/all")).data,
        onSuccess: (result) => {
            invalidateSpendAndKpis();
            setSkippedRows([]);
            toast.success(template(content.clearAllToast, { n: formatNumber(result.deleted) }));
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    function handleFileChange(event) {
        const chosen = event.target.files?.[0] ?? null;
        setSkippedRows([]);

        if (!chosen) {
            clearFileInput();
            return;
        }
        if (chosen.size > upload.maxBytes) {
            setFile(null);
            setFileError(content.fileTooLarge);
            return;
        }
        // Browsers report a CSV's type as text/csv, application/vnd.ms-excel
        // or "" depending on the OS, so the extension is the reliable check.
        // The server re-checks regardless.
        if (!chosen.name.toLowerCase().endsWith(".csv")) {
            setFile(null);
            setFileError(content.fileWrongType);
            return;
        }
        setFile(chosen);
        setFileError(null);
    }

    return (<>
      <Panel>
        <PanelHeader title={content.uploadTitle} hint={content.uploadHint}/>

        <PanelBody className="flex flex-col gap-4">
          <p className="max-w-2xl text-[0.875rem] leading-relaxed text-ink-soft">
            {content.uploadHelp}
          </p>

          <div className="flex flex-col gap-2">
            <label htmlFor="ad-spend-file" className={fieldLabel}>
              {content.fileLabel}
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <input ref={fileInputRef} id="ad-spend-file" type="file" accept={upload.accept} onChange={handleFileChange} aria-invalid={fileError ? "true" : undefined} aria-describedby={fileError ? "ad-spend-file-error" : undefined} className="deck-input max-w-full flex-1 rounded-md border border-hairline bg-white/[0.02] py-2 pr-3.5 text-[0.875rem] text-ink-soft outline-none transition duration-200 hover:border-hairline-strong focus:border-brand/55 focus:ring-4 focus:ring-brand/10 file:mr-3.5 file:cursor-pointer file:rounded-md file:border-0 file:bg-white/[0.06] file:px-3.5 file:py-2 file:font-mono file:text-[0.6875rem] file:uppercase file:tracking-[0.14em] file:text-ink-soft hover:file:bg-white/[0.09] hover:file:text-ink"/>

              <Button onClick={() => importCsv.mutate(file)} disabled={!file || importCsv.isPending} className="h-10 shrink-0 rounded-md">
                {importCsv.isPending ? (<LoaderCircle aria-hidden className="animate-spin"/>) : (<Upload aria-hidden/>)}
                {importCsv.isPending ? content.uploadPendingLabel : content.uploadSubmitLabel}
              </Button>
            </div>

            {fileError && (<p id="ad-spend-file-error" className="text-[0.8125rem] text-status-critical">
                {fileError}
              </p>)}
          </div>

          <p className="text-[0.8125rem] leading-relaxed text-ink-muted">
            {content.reimportNote}
          </p>

          {skippedRows.length > 0 && (
            // Warning, not critical: the import succeeded, these rows did
            // not. The heading carries that in words as well as in colour.
            <div className="rounded-md border border-status-warning/28 bg-status-warning/10 p-4">
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-status-warning">
                {content.importErrorsTitle}
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {skippedRows.map((message) => (<li key={message} className="text-[0.8125rem] leading-relaxed text-ink-soft">
                    {message}
                  </li>))}
              </ul>
            </div>)}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title={content.spendTitle} hint={content.spendHint} actions={features.clearAllSpend && rows.length > 0 ? (<Button variant="ghost" size="sm" onClick={() => setConfirmClearAll(true)} className="text-status-critical hover:bg-status-critical/10 hover:text-status-critical">
              <Trash2 aria-hidden/>
              {content.clearAllLabel}
            </Button>) : undefined}/>

        <PanelBody flush>
          {isPending ? (<div className="flex flex-col gap-3 p-5 sm:p-6">
              {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full"/>))}
            </div>) : rows.length === 0 ? (<div className="px-5 pb-6 sm:px-6">
              <EmptyState icon={Wallet} title={content.emptySpend}/>
            </div>) : (<>
              <DataTable columns={spendColumns} caption={content.spendCaption} minWidth="44rem">
                {rows.map((row) => (<DataRow key={row.id}>
                    {spendColumns.map((column) => {
                        const hidden = column.hideBelow ? HIDE_BELOW[column.hideBelow] : undefined;
                        if (column.key === "actions") {
                            return (<DataCell key={column.key} className="text-right">
                            <Button variant="ghost" size="icon-sm" aria-label={`${content.deleteRowLabel} — ${row.campaign ?? row.date}`} onClick={() => setPendingDelete(row)} className="text-ink-muted hover:text-status-critical">
                              <Trash2 aria-hidden/>
                            </Button>
                          </DataCell>);
                        }
                        return (<DataCell key={column.key} numeric={column.numeric} className={hidden}>
                          {renderSpendCell(row, column)}
                        </DataCell>);
                    })}
                  </DataRow>))}
              </DataTable>

              {total > rows.length && (<p className="px-5 py-4 text-[0.8125rem] text-ink-muted sm:px-6">
                  {template(content.spendLimitNote, {
                        limit: formatNumber(rows.length),
                        total: formatNumber(total),
                    })}
                </p>)}
            </>)}
        </PanelBody>
      </Panel>

      <ConfirmDialog open={pendingDelete !== null} onOpenChange={(open) => {
            if (!open) setPendingDelete(null);
        }} title={content.deleteRowTitle} description={content.deleteRowDescription} recordName={pendingDelete ? spendRecordName(pendingDelete) : undefined} confirmLabel={content.deleteRowConfirmLabel} onConfirm={() => removeRow.mutateAsync(pendingDelete.id)}/>

      <ConfirmDialog open={confirmClearAll} onOpenChange={setConfirmClearAll} title={content.clearAllTitle} description={content.clearAllDescription} recordName={template(content.clearAllRecord, { n: formatNumber(total) })} confirmLabel={content.clearAllConfirmLabel} onConfirm={() => clearAll.mutateAsync()}/>
    </>);
}
/** The line the confirm dialog names, so nobody deletes the wrong row. */
function spendRecordName(row) {
    return [formatDate(row.date), row.campaign, row.creative, formatCurrency(Math.round(row.spend))]
        .filter(Boolean)
        .join(" · ");
}
function renderSpendCell(row, column) {
    const value = row[column.key];
    if (value === null || value === undefined || value === "") {
        return (<>
      <span aria-hidden>{content.noData}</span>
      <span className="sr-only">{content.noDataSr}</span>
    </>);
    }
    if (column.key === "date") return formatDate(value);
    if (column.key === "spend") return formatCurrency(Math.round(value));
    return value;
}
