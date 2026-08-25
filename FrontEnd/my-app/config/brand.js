/**
 * BRAND ASSETS
 *
 * The agency's artwork and naming, shared by every surface (login, console,
 * and any client / sales-rep screens added later).
 *
 * This used to live inside `config/login.ts`, but the console sidebar needs the
 * logo too and importing the *login* config to draw a sidebar made no sense.
 * `config/login.ts` still re-exports it, so nothing that already imported it
 * from there had to change.
 *
 * Quick answers to the usual requests:
 *   - New logo artwork ......... drop the files in /public/brand, then update
 *                                the `src` + `width` + `height` below
 *   - Rename the product ....... productName
 *   - Rename the company ....... companyName
 */
export const brandConfig = {
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
