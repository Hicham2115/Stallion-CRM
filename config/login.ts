/**
 * ============================================================================
 *  LOGIN SCREEN CONFIGURATION
 * ============================================================================
 *  Single source of truth for the /login route.
 *
 *  Nothing on the login page is hard-coded in the JSX — every toggle, route,
 *  rule and string lives here. To change what the page says or which features
 *  it offers, edit this file only; you should never have to open a component.
 *
 *  Quick answers to the usual requests:
 *    - Hide the Google button ......... features.googleSignIn = false
 *    - Hide "Remember me" ............. features.rememberMe   = false
 *    - Hide "Forgot password?" ........ features.forgotPassword = false
 *    - Change where login lands ....... routes.afterSignIn
 *    - Translate the page ............. swap the `content` object
 * ============================================================================
 */

/** Toggles for optional blocks. Each one removes its UI completely when false. */
export interface LoginFeatureFlags {
  /**
   * Google SSO button above the email form.
   * When false the button AND the "or continue with email" divider disappear,
   * and the email form becomes the first thing in the card.
   */
  googleSignIn: boolean;
  /** "Remember me" checkbox next to the forgot-password link. */
  rememberMe: boolean;
  /** "Forgot password?" link in the password field header. */
  forgotPassword: boolean;
  /** Small "no account? contact your admin" line under the submit button. */
  supportFootnote: boolean;
  /**
   * The two background layers on the brand panel. Independent of each other —
   * either can be switched off without touching the other.
   *
   * Oversized horse mark behind the brand panel. It has two placements, one
   * for the desktop column and one for the short mobile strip; this flag
   * removes both. How heavy it sits is --deck-mark-opacity in globals.css.
   */
  logoWatermark: boolean;
  /** Live area chart along the bottom of the brand panel. Large screens only,
   *  because the shape needs the width to read as a horizon. */
  areaWatermark: boolean;
}

/** Every URL the page can navigate to. Keep them relative. */
export interface LoginRoutes {
  /** Target of the "Forgot password?" link. Build this route when you need it. */
  forgotPassword: string;
  /** Where a successful sign-in sends the user. */
  afterSignIn: string;
  /** Footer privacy link. */
  privacy: string;
}

/** Client-side validation rules. The server must re-validate regardless. */
export interface LoginValidation {
  /** Minimum characters before the form will submit. */
  minPasswordLength: number;
  /**
   * Deliberately permissive: it only catches obvious typos so we never reject
   * a legitimate address. Real verification happens server-side.
   */
  emailPattern: RegExp;
}

/** A logo file in /public plus its intrinsic size, for next/image. */
export interface LoginBrandAsset {
  src: string;
  width: number;
  height: number;
  alt: string;
}

/**
 * How a chart watermark keeps moving. Both loops run forever, not once on load.
 *
 *  1. Values. Every stepMs the feed advances by one reading and the chart
 *     tweens to the new shape over durationMs.
 *
 *  2. Opacity. The whole layer fades between fadeFrom and fadeTo on its own
 *     slower cycle, so the panel pulses as though it were working.
 */
export interface LoginChartMotion {
  /** Milliseconds between one reading and the next. 0 freezes it. */
  stepMs: number;
  /** Milliseconds a value takes to settle. Keep at or under stepMs. */
  durationMs: number;
  /** How far a value may wander from its base: 0.22 = plus or minus 22%. */
  driftRatio: number;
  /**
   * Layer opacity at its faintest and its brightest, absolute 0-1.
   *
   * The defaults are a watermark: it should sit under the page, not on it.
   * fadeFrom is 60% of fadeTo, so it breathes across that range. For a far
   * bolder graphic, raise both — 0.6 and 1 makes the chart a foreground
   * element rather than texture.
   */
  fadeFrom: number;
  fadeTo: number;
  /** Milliseconds for one full fade cycle, faint to bright and back. */
  fadeDurationMs: number;
}

/**
 * The rolling area chart along the bottom of the panel.
 *
 * It does not nudge existing figures — it behaves like
 * a live feed. On every tick a new reading is appended on the right and the
 * oldest drops off the left, so the whole series scrolls. New values continue
 * from the last one with a gentle pull back toward the mean, which keeps the
 * silhouette plausible instead of drifting into a flat line or off the top.
 */
export interface LoginAreaConfig {
  /** Line colour, and the top of the gradient beneath it. */
  color: string;
  /**
   * Reveal-on-hover plus a value readout.
   *
   * A watermark sitting at ~12% opacity is invisible, so an interactive one
   * that gave no sign of itself would be a trap. Instead the whole layer comes
   * up to hoverOpacity while the pointer is over it, the rolling feed freezes
   * so the number under the cursor holds still, and a crosshair and readout
   * follow the pointer. Moving away fades it back to a watermark.
   *
   * Pointer only, by design. It is decorative sample data, so it stays out of
   * the tab order — putting a fake chart between the top of the page and the
   * login form would cost keyboard users real time for no information. Nothing
   * inside is focusable, which is what makes the aria-hidden on it legitimate.
   */
  interactive: boolean;
  /** Opacity while the pointer is over it. Watermark bounds live in motion. */
  hoverOpacity: number;
  /** Caption above the number in the readout. */
  readoutLabel: string;
  /**
   * Seed readings, oldest first. Any length works; roughly 30 gives the dense
   * horizon in the reference. Only the SHAPE matters — nothing is labelled —
   * so treat these as a silhouette rather than as real figures.
   */
  data: number[];
  motion: LoginChartMotion;
}

export interface LoginConfig {
  features: LoginFeatureFlags;
  routes: LoginRoutes;
  validation: LoginValidation;
  area: LoginAreaConfig;
  brand: {
    /** Full horizontal lockup: horse mark + "stallion advertising". */
    lockup: LoginBrandAsset;
    /** Horse mark on its own, used as the oversized background watermark. */
    mark: LoginBrandAsset;
    /** Product name shown next to the lockup in the panel header. */
    productName: string;
  };
  content: {
    /** ---- Left brand panel ---- */
    eyebrow: string;
    headlineLead: string;
    /** Rendered in lime with the animated underline. */
    headlineAccent: string;
    subhead: string;
    statusLabel: string;
    /** ---- Right auth card ---- */
    cardKicker: string;
    title: string;
    subtitle: string;
    googleLabel: string;
    dividerLabel: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    /** Shown under the password field while Caps Lock is active. */
    capsLockWarning: string;
    /** aria-labels for the show/hide password toggle. */
    showPasswordLabel: string;
    hidePasswordLabel: string;
    forgotLabel: string;
    rememberLabel: string;
    submitLabel: string;
    submitPendingLabel: string;
    supportFootnote: string;
    supportLinkLabel: string;
    /** ---- Footer ---- */
    legal: string;
    privacyLabel: string;
    /** ---- Validation + error copy ---- */
    errors: {
      emailRequired: string;
      emailInvalid: string;
      passwordRequired: string;
      passwordTooShort: string;
      /** Fallback when the auth call throws unexpectedly. */
      unexpected: string;
    };
  };
}

export const loginConfig: LoginConfig = {
  features: {
    googleSignIn: false,
    rememberMe: true,
    forgotPassword: true,
    supportFootnote: false,
    logoWatermark: false,
    areaWatermark: true,
  },

  routes: {
    forgotPassword: "/forgot-password",
    afterSignIn: "/dashboard",
    privacy: "/privacy",
  },

  validation: {
    minPasswordLength: 8,
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  },

  /**
   * Seed silhouette: a climb, a trough, then a long rise to a peak that tapers
   * off — the shape reads as a month of trading rather than as noise.
   */
  area: {
    color: "var(--brand-lime)",
    interactive: true,
    hoverOpacity: 0.9,
    readoutLabel: "Revenue",
    data: [
      430, 470, 545, 600, 640, 662, 655, 671, 648, 590,
      560, 505, 430, 388, 372, 366, 380, 396, 402, 438,
      470, 520, 596, 648, 690, 742, 796, 828, 809, 772,
      742, 706, 688,
    ],
    motion: {
      stepMs: 900,
      durationMs: 850,
      driftRatio: 0.16,
      fadeFrom: 0.09,
      fadeTo: 0.15,
      fadeDurationMs: 9600,
    },
  },

  brand: {
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
  },

  content: {
    eyebrow: "Agency operations",
    headlineLead: "Welcome back to your",
    headlineAccent: "sales pipeline",
    subhead:
      "Track dials, appointments and conversions across the whole team — one dashboard, one source of truth.",
    statusLabel: "All systems operational",

    cardKicker: "Secure access",
    title: "Log in",
    subtitle: "Use your email and password to access the platform.",
    googleLabel: "Continue with Google",
    dividerLabel: "or continue with email",
    emailLabel: "Email address",
    emailPlaceholder: "you@stallionadvertising.ma",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 8 characters",
    capsLockWarning: "Caps Lock is on.",
    showPasswordLabel: "Show password",
    hidePasswordLabel: "Hide password",
    forgotLabel: "Forgot password?",
    rememberLabel: "Keep me signed in",
    submitLabel: "Log in",
    submitPendingLabel: "Verifying",
    supportFootnote: "No account yet?",
    supportLinkLabel: "Ask your administrator",

    legal: "Stallion Advertising",
    privacyLabel: "Privacy policy",

    errors: {
      emailRequired: "Enter your email address.",
      emailInvalid: "That does not look like a valid email address.",
      passwordRequired: "Enter your password.",
      passwordTooShort: "Password must be at least 8 characters.",
      unexpected: "Something went wrong. Please try again.",
    },
  },
};
