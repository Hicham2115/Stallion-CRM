import { Download, FileText, FolderOpen } from "lucide-react";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { leadConfig } from "@/config/lead";
const { content } = leadConfig;
// Download is a disabled button, not a dead link — there are no file bytes
// behind these names yet.
//
// TODO(backend): serve a signed, expiring URL per file and link each row to
// it. Don't serve the file through the app or put it behind a guessable path
// — a CRM attachment can be a signed contract.
export function FilesPanel({ files }) {
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={content.filesTitle} hint={content.filesHint}/>

      <PanelBody className="flex flex-1 flex-col">
        {files.length === 0 ? (<EmptyState icon={FolderOpen} title={content.filesEmptyTitle} description={content.filesEmptyDescription}/>) : (<ul className="flex flex-col gap-2.5">
            {files.map((file) => (<li key={file.id} className="flex items-center gap-3 rounded-xl border border-hairline bg-white/[0.02] px-3.5 py-2.5">
                <FileText aria-hidden className="size-4 shrink-0 text-ink-muted"/>

                <span className="min-w-0 flex-1 truncate text-[0.875rem] text-ink-soft">
                  {file.name}
                </span>

                <button type="button" disabled title={content.fileDownloadUnavailable} aria-label={`${content.fileDownloadLabel} ${file.name}`} className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors disabled:cursor-not-allowed" data-print="hide">
                  <Download aria-hidden className="size-3.5"/>
                </button>
              </li>))}
          </ul>)}
      </PanelBody>
    </Panel>);
}
