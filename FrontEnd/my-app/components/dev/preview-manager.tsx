"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import {
  ArrowUpRight,
  ImageOff,
  ImagePlus,
  Link2,
  LoaderCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/deck/confirm-dialog";
import { fieldBase, fieldErrorText } from "@/components/deck/field";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { Button } from "@/components/ui/button";
import { devConfig } from "@/config/dev";
import { formatDaysAgo, template } from "@/lib/format";
import { formatBytes, prepareScreenshot } from "@/lib/image-upload";
import { useCrm } from "@/lib/store/crm-store";
import type { Lead, ProjectPreview } from "@/lib/types";
import { cn } from "@/lib/utils";

const { content, features, uploads } = devConfig;
const copy = content.previews;

/**
 * ============================================================================
 *  CLIENT PREVIEWS
 * ============================================================================
 *  Where a developer shows the client what has been built.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  THE GOAL, AND WHY THE DESIGN CHANGED SHAPE
 *  ─────────────────────────────────────────────────────────────────────────
 *  The prototype was a large empty grey rectangle labelled "Drop a platform
 *  screenshot", with a label and URL row underneath. Three problems, all of
 *  them about the same thing — what the panel is FOR is publishing to a
 *  client, and none of it said so:
 *
 *   1. THE DROP ZONE WAS THE WHOLE PANEL, forever. Once three previews exist,
 *      the useful content is the previews, and a 300px hole above them pushes
 *      the actual work below the fold. The zone is now big while the panel is
 *      empty — when it IS the content — and a compact bar once there is
 *      something to show.
 *
 *   2. IT WAS DRAG-ONLY. A grey rectangle with no button cannot be used from a
 *      keyboard at all, and drag-and-drop is genuinely awkward on a laptop
 *      trackpad. It is now a real <label> over a real file input: click,
 *      Tab-and-Enter, and drag all reach the same place.
 *
 *   3. A DROP PUBLISHED IMMEDIATELY. "Upload it directly" reads well until a
 *      developer drags the wrong file and a client sees a half-finished screen
 *      with a filename for a caption. A dropped image is now STAGED — it
 *      appears as a thumbnail beside the label field, pre-filled from the
 *      filename, and one deliberate click publishes it. One click is a very
 *      cheap price for never publishing something by accident.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  A screenshot and a link are the same record, on purpose. `ProjectPreview`
 *  carries both, either may be null, and the client's gallery renders whatever
 *  is there. Modelling them separately would mean two panels here and two
 *  lists there, for one idea: "here is a version to look at".
 * ============================================================================
 */
export function PreviewManager({ lead }: { lead: Lead }) {
  const { actions } = useCrm();
  const fileRef = useRef<HTMLInputElement>(null);

  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  /** A prepared screenshot waiting to be published. */
  const [staged, setStaged] = useState<{ dataUrl: string; bytes: number } | null>(
    null,
  );

  const [dragActive, setDragActive] = useState(false);
  const [reading, setReading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<ProjectPreview | null>(null);

  const atLimit = lead.previews.length >= uploads.maxPerProject;

  /* ---------------------------------------------------------------- intake */

  async function takeFile(file: File | undefined) {
    if (!file) return;

    setError(null);

    if (atLimit) {
      setError(template(copy.errors.tooMany, { max: uploads.maxPerProject }));
      return;
    }

    setReading(true);
    const result = await prepareScreenshot(file);
    setReading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setStaged({ dataUrl: result.dataUrl, bytes: result.bytes });

    // Pre-fill from the filename, minus the extension. "homepage-v2.png" is a
    // better first draft of a caption than an empty box, and the developer can
    // still type over it before publishing.
    if (!label.trim()) {
      setLabel(
        file.name.replace(/\.[^.]+$/, "").slice(0, uploads.maxLabelLength),
      );
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragActive(false);
    void takeFile(event.dataTransfer.files?.[0]);
  }

  /* --------------------------------------------------------------- publish */

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError(copy.errors.labelRequired);
      return;
    }
    if (!staged && !url.trim()) {
      setError(copy.errors.sourceRequired);
      return;
    }
    if (url.trim() && !/^https?:\/\/\S+\.\S+/i.test(url.trim())) {
      setError(copy.errors.urlInvalid);
      return;
    }

    setPending(true);
    const result = await actions.addPreview(lead, {
      label: label.trim(),
      imageUrl: staged?.dataUrl ?? null,
      url: url.trim() || null,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setLabel("");
    setUrl("");
    setStaged(null);
    if (fileRef.current) fileRef.current.value = "";
    toast.success(copy.addToast);
  }

  async function handleRemove(preview: ProjectPreview) {
    const result = await actions.removePreview(lead, preview.id);
    if (result.ok) toast.success(copy.removeToast);
    else toast.error(result.message);
  }

  const empty = lead.previews.length === 0;

  return (
    <Panel>
      <PanelHeader title={copy.title} hint={copy.hint} />

      <PanelBody>
        {/* The line from the design. It is the most important sentence on the
            page: it is the only thing telling a developer that what they do
            here is visible to someone outside the agency. */}
        <p className="text-[0.875rem] leading-relaxed text-ink-soft">
          {copy.description}
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* What the client can already see                                   */}
        {/* ---------------------------------------------------------------- */}
        {!empty && (
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {lead.previews.map((preview) => (
              <PreviewTile
                key={preview.id}
                preview={preview}
                onRemove={() => setRemoving(preview)}
              />
            ))}
          </ul>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Drop zone                                                         */}
        {/* ---------------------------------------------------------------- */}
        {features.previewUploads && (
          <DropZone
            compact={!empty}
            active={dragActive}
            reading={reading}
            disabled={atLimit}
            inputRef={fileRef}
            onFile={(file) => void takeFile(file)}
            onDragStateChange={setDragActive}
            onDrop={handleDrop}
          />
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Label + link + publish                                            */}
        {/* ---------------------------------------------------------------- */}
        <form onSubmit={handleAdd} className="mt-4 flex flex-wrap gap-2.5">
          {/* The staged screenshot rides INSIDE the label field's row, so the
              thing being published and the caption for it are visibly one
              item rather than two unrelated controls. */}
          {staged && (
            <span className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-brand/35 bg-brand/[0.07] py-1 pl-1 pr-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- a data
                  URL produced in this browser; there is no host for next/image
                  to be configured with. See lib/image-upload.ts. */}
              <img
                src={staged.dataUrl}
                alt=""
                className="h-9 w-14 rounded-lg object-cover"
              />
              <span className="deck-nums font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted">
                {formatBytes(staged.bytes)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setStaged(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                aria-label={copy.removeLabel}
                className="grid size-6 place-items-center rounded-md text-ink-muted transition-colors hover:bg-white/[0.08] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </span>
          )}

          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={copy.labelPlaceholder}
            aria-label={copy.labelPlaceholder}
            className={cn(fieldBase, "h-11 w-full px-3.5 sm:w-[15rem]")}
          />

          <input
            type="url"
            inputMode="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder={copy.urlPlaceholder}
            aria-label={copy.urlPlaceholder}
            className={cn(fieldBase, "h-11 min-w-0 flex-1 px-3.5")}
          />

          <Button
            type="submit"
            size="lg"
            disabled={pending || reading}
            className="h-11 shrink-0 font-semibold"
          >
            {pending && <LoaderCircle aria-hidden className="deck-spin size-4" />}
            {copy.addSubmit}
          </Button>
        </form>

        {/* One live region for every failure this panel can produce — a file
            that is too big, a malformed URL, a missing label. Announced when
            the message appears, not when the node is inserted. */}
        <div aria-live="polite">
          {error && (
            <p role="alert" className={cn("mt-2.5", fieldErrorText)}>
              {error}
            </p>
          )}
        </div>
      </PanelBody>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={copy.removeTitle}
        description={copy.removeDescription}
        recordName={removing?.label}
        confirmLabel={copy.removeConfirm}
        pendingLabel={copy.removePending}
        onConfirm={async () => {
          if (removing) await handleRemove(removing);
          setRemoving(null);
        }}
      />
    </Panel>
  );
}

/* --------------------------------------------------------------------------
   The drop zone
   -------------------------------------------------------------------------- */

function DropZone({
  compact,
  active,
  reading,
  disabled,
  inputRef,
  onFile,
  onDragStateChange,
  onDrop,
}: {
  /** Slim bar once previews exist; hero panel while there are none. */
  compact: boolean;
  active: boolean;
  reading: boolean;
  disabled: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File | undefined) => void;
  onDragStateChange: (active: boolean) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}) {
  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) onDragStateChange(true);
      }}
      onDragLeave={() => onDragStateChange(false)}
      onDrop={disabled ? (event) => event.preventDefault() : onDrop}
      className={cn(
        "mt-5 flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed transition-colors",
        compact ? "px-4 py-4" : "flex-col px-6 py-14",
        active
          ? "border-brand/60 bg-brand/[0.07]"
          : "border-hairline-strong bg-white/[0.015] hover:border-brand/35 hover:bg-white/[0.03]",
        disabled && "cursor-not-allowed opacity-55 hover:border-hairline-strong hover:bg-white/[0.015]",
        // The ring lands on the label because the input inside it is visually
        // hidden — without this a keyboard user tabs onto an invisible control.
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-brand/60 focus-within:ring-offset-2 focus-within:ring-offset-deck-surface",
      )}
    >
      {/* A real file input, not `.click()` on a hidden button: it is the
          control that opens the picker, it is keyboard-reachable, and screen
          readers announce it as a file field because it is one. */}
      <input
        ref={inputRef}
        type="file"
        accept={uploads.accept}
        disabled={disabled}
        onChange={(event) => onFile(event.target.files?.[0])}
        className="sr-only"
      />

      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-xl border border-hairline bg-white/[0.03]",
          compact ? "size-9" : "size-11",
        )}
      >
        {reading ? (
          <LoaderCircle aria-hidden className="deck-spin size-4 text-brand" />
        ) : (
          <ImagePlus aria-hidden className="size-[1.15rem] text-ink-muted" />
        )}
      </span>

      <span className={cn("min-w-0", compact ? "text-left" : "text-center")}>
        <span className="block text-[0.875rem] font-medium text-ink-soft">
          {reading
            ? copy.uploading
            : active
              ? copy.dropActive
              : `${copy.dropTitle} — ${copy.dropHint}`}
        </span>

        {/* The limits, stated before anyone hits them. Discovering a size cap
            by being refused is a worse way to learn it. */}
        <span className="mt-1 block font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
          {template(copy.dropLimits, {
            accept: uploads.acceptLabel,
            max: formatBytes(uploads.maxSourceBytes),
          })}
        </span>
      </span>
    </label>
  );
}

/* --------------------------------------------------------------------------
   One published preview
   -------------------------------------------------------------------------- */

function PreviewTile({
  preview,
  onRemove,
}: {
  preview: ProjectPreview;
  onRemove: () => void;
}) {
  return (
    <li className="group relative flex flex-col overflow-hidden rounded-xl border border-hairline bg-white/[0.02]">
      {preview.imageUrl ? (
        /* Same reasoning as the staged thumbnail above: a data URL produced in
           this browser, so there is no host for next/image to be configured
           with. See lib/image-upload.ts. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview.imageUrl}
          alt={preview.label}
          className="aspect-video w-full border-b border-hairline object-cover"
        />
      ) : (
        // A link with no screenshot. The same designed placeholder the client
        // sees, so a developer knows exactly what was published.
        <span className="deck-grid grid aspect-video w-full place-items-center border-b border-hairline bg-deck-void/40">
          <ImageOff aria-hidden className="size-5 text-ink-faint" />
        </span>
      )}

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <span className="truncate text-[0.875rem] font-medium text-ink">
          {preview.label}
        </span>

        <span className="flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
          {preview.url ? (
            <Link2 aria-hidden className="size-3 shrink-0" />
          ) : (
            <ImageOff aria-hidden className="size-3 shrink-0" />
          )}
          {preview.imageUrl && preview.url
            ? formatDaysAgo(preview.updatedDaysAgo)
            : preview.url
              ? copy.linkOnly
              : copy.imageOnly}
        </span>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          {preview.url ? (
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/link inline-flex items-center gap-1 text-[0.8125rem] font-medium text-ink-soft transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              {copy.openLabel}
              <ArrowUpRight aria-hidden className="size-3.5" />
              <span className="sr-only">{preview.label}</span>
            </a>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onRemove}
            aria-label={`${copy.removeLabel} ${preview.label}`}
            className="rounded px-1.5 py-0.5 text-[0.8125rem] font-medium text-status-critical/85 transition-colors hover:text-status-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-critical/50"
          >
            {copy.removeLabel}
          </button>
        </div>
      </div>
    </li>
  );
}
