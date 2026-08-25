/**
 * ============================================================================
 *  BRAND ASSETS
 * ============================================================================
 *  The agency's artwork and naming, shared by every surface (login, console,
 *  and any client / sales-rep screens added later).
 *
 *  This used to live inside `config/login.ts`, but the console sidebar needs the
 *  logo too and importing the *login* config to draw a sidebar made no sense.
 *  `config/login.ts` still re-exports it, so nothing that already imported it
 *  from there had to change.
 *
 *  Quick answers to the usual requests:
 *    - New logo artwork ......... drop the files in /public/brand, then update
 *                                 the `src` + `width` + `height` below
 *    - Rename the product ....... productName
 *    - Rename the company ....... companyName
 * ============================================================================
 */

/** An image file in /public plus its intrinsic size, for next/image. */
export interface BrandAsset {
  /** Path relative to /public, e.g. "/brand/stallion-logo.png". */
  src: string;
  /** Intrinsic pixel width of the file. next/image warns if this is wrong. */
  width: number;
  /** Intrinsic pixel height of the file. */
  height: number;
  /**
   * Alt text. An empty string marks the image as decorative, which also makes
   * `StallionLogo` set aria-hidden on it — use "" for watermarks only.
   */
  alt: string;
}

export interface BrandConfig {
  /** Full horizontal lockup: horse mark + "stallion advertising". */
  lockup: BrandAsset;
  /** Horse mark on its own, used as the oversized background watermark. */
  mark: BrandAsset;
  /** Product name shown next to the lockup. Rendered in lime, mono, tracked. */
  productName: string;
  /** Legal / company name, used in footers and copyright lines. */
  companyName: string;
}

export const brandConfig: BrandConfig = {
  lockup: {
    src: "/brand/stallion-logo.png",
    width: 1255,
    height: 485,
    alt: "Stallion Advertising",
  },
  mark: {
    src: "/brand/stallion-mark.png",
    width: 286,
    height: 485,
    alt: "",
  },
  productName: "CRM",
  companyName: "Stallion Advertising",
};
