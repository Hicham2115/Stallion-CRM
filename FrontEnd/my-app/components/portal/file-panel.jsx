import { Download, FileText, FolderOpen } from "lucide-react";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { portalConfig } from "@/config/portal";
const { content } = portalConfig;
// Download is a disabled button, not a dead link — there are no file bytes
// behind these names yet, and a link that silently does nothing is worse
// than a control that plainly says "not available".
//
// TODO(backend): serve a signed, expiring URL per file and link each row to
// it. Don't serve the bytes through the app or put them at a guessable path
// — a signed contract is on this list.
export function FilePanel({ files }) {
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={content.files.title} hint={content.files.hint}/>

      <PanelBody className="flex flex-1 flex-col">
        {files.length === 0 ? (<EmptyState icon={FolderOpen} title={content.files.emptyTitle} description={content.files.emptyDescription}/>) : (<ul className="flex flex-col gap-2.5">
            {files.map((file) => (<li key={file.id} className="flex items-center gap-3 rounded-xl border border-hairline bg-white/[0.02] px-3.5 py-3">
                <FileText aria-hidden className="size-4 shrink-0 text-ink-muted"/>

                <span className="min-w-0 flex-1 truncate text-[0.875rem] text-ink-soft">
                  {file.name}
                </span>

                <button type="button" disabled title={content.files.downloadUnavailable} aria-label={`${content.files.downloadLabel} ${file.name}`} className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-faint transition-colors disabled:cursor-not-allowed" data-print="hide">
                  <Download aria-hidden className="size-3.5"/>
                </button>
              </li>))}
          </ul>)}
      </PanelBody>
    </Panel>);
}
