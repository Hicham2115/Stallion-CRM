"use client";

import { devConfig } from "@/config/dev";
import { template } from "@/lib/format";

/**
 * ============================================================================
 *  SCREENSHOT INTAKE  —  browser-side, and temporary
 * ============================================================================
 *  Turns a dropped file into something small enough to keep in localStorage
 *  next to the rest of the mock data.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  WHY THIS EXISTS AT ALL
 *  ──────────────────────────────────────────────────────────────────────────
 *  There is no file storage yet, and the dev workspace has to be demoable: a
 *  developer drops a screenshot, and the client sees it on their dashboard.
 *  Storing the raw file is not an option — localStorage is roughly 5MB for the
 *  entire origin and a single modern screenshot can be 4MB.
 *
 *  So the image is drawn onto a canvas at a bounded size and re-encoded as
 *  JPEG. A 3840×2160 PNG at 4.2MB comes out around 90KB, which is small enough
 *  to sit beside eighty lead records and still be a recognisable screenshot at
 *  the size the portal shows it.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  WHY IT REFUSES RATHER THAN TRUNCATES
 *  ──────────────────────────────────────────────────────────────────────────
 *  Every limit below returns an error the user can read and act on. The
 *  alternative — accept everything and let `localStorage.setItem` throw — is
 *  the failure mode this whole file is built to avoid: once the quota is gone
 *  the console keeps working on screen and silently stops persisting ANYTHING,
 *  so an hour of work disappears on refresh with no error anywhere. A refusal
 *  at the door is worth a great deal more than a generous door.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  TODO(backend): DELETE THIS FILE
 *  ──────────────────────────────────────────────────────────────────────────
 *  Replace with a real upload: ask your API for a signed PUT, send the ORIGINAL
 *  file to object storage, and store the returned URL on the preview record.
 *  Then
 *    - the client gets a full-resolution screenshot instead of a JPEG thumbnail
 *    - the size limit becomes the server's, where it belongs (a client-side
 *      check is a courtesy to the user, never a constraint on what can be sent)
 *    - `ProjectPreview.imageUrl` stops being a data URL, which must never go
 *      into a database column
 *  Serve them from signed, expiring URLs — a client preview can show unreleased
 *  branding and must not sit at a guessable path.
 * ============================================================================
 */

const { uploads } = devConfig;
const copy = devConfig.content.previews.errors;

/** Bytes as something a person can read, e.g. "8 MB". Used only in messages. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export type ImageIntakeResult =
  | { ok: true; dataUrl: string; bytes: number }
  | { ok: false; message: string };

/** The accepted MIME types, from config, as a set for cheap checking. */
const ACCEPTED = new Set(
  uploads.accept.split(",").map((entry) => entry.trim().toLowerCase()),
);

/**
 * Read a dropped or chosen file, downscale it, and return a data URL.
 *
 * Never throws — every failure is a `{ ok: false, message }` the caller can put
 * straight in front of the user, matching the contract in lib/crm-api.ts.
 */
export async function prepareScreenshot(
  file: File,
): Promise<ImageIntakeResult> {
  if (!ACCEPTED.has(file.type.toLowerCase())) {
    return { ok: false, message: copy.fileType };
  }

  if (file.size > uploads.maxSourceBytes) {
    return {
      ok: false,
      message: template(copy.fileTooLarge, {
        max: formatBytes(uploads.maxSourceBytes),
      }),
    };
  }

  try {
    const bitmap = await loadBitmap(file);
    const dataUrl = drawScaled(bitmap);

    // `close()` frees the decoded pixels immediately rather than waiting for
    // GC. It matters here: a few 4K screenshots held in memory at once is tens
    // of megabytes, on a page that is also holding the whole console state.
    if ("close" in bitmap) bitmap.close();

    if (!dataUrl) return { ok: false, message: copy.readFailed };

    // Data URLs are base64, so the stored size is ~4/3 of the raw bytes. The
    // string length IS the cost to localStorage, so measure that rather than
    // the notional image size.
    const bytes = dataUrl.length;

    if (bytes > uploads.maxStoredBytes) {
      return {
        ok: false,
        message: template(copy.stillTooLarge, {
          max: formatBytes(uploads.maxStoredBytes),
        }),
      };
    }

    return { ok: true, dataUrl, bytes };
  } catch (error) {
    console.warn("[image-upload] could not read the dropped file", error);
    return { ok: false, message: copy.readFailed };
  }
}

/**
 * Decode the file to something drawable.
 *
 * `createImageBitmap` where it exists: it decodes off the main thread, so a
 * large screenshot does not freeze the page mid-drop. The `<img>` fallback
 * covers older Safari, which is still common enough on the agency's machines
 * to matter.
 */
async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("decode failed"));
      image.src = url;
    });
  } finally {
    // Revoked either way — leaking object URLs keeps the whole file alive in
    // memory for the lifetime of the document.
    URL.revokeObjectURL(url);
  }
}

/** Draw at a bounded size and re-encode. Returns null if canvas is unavailable. */
function drawScaled(source: ImageBitmap | HTMLImageElement): string | null {
  const sourceWidth = "width" in source ? source.width : 0;
  const sourceHeight = "height" in source ? source.height : 0;
  if (!sourceWidth || !sourceHeight) return null;

  // Never scale UP. A small screenshot enlarged to the cap would be blurrier
  // AND bigger — worse on both counts.
  const scale = Math.min(
    1,
    uploads.maxEdge / Math.max(sourceWidth, sourceHeight),
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));

  const context = canvas.getContext("2d");
  if (!context) return null;

  // A white ground before drawing. JPEG has no alpha, and a transparent PNG
  // drawn straight onto an empty canvas encodes its transparent pixels as
  // BLACK — which turns a screenshot with rounded corners into one with four
  // black wedges.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  // JPEG rather than PNG: these are photographic screenshots, and PNG would be
  // five to ten times the size for no visible gain at this scale.
  return canvas.toDataURL("image/jpeg", uploads.quality);
}
