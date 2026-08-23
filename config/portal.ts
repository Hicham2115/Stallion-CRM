/**
 * ============================================================================
 *  CLIENT PORTAL CONFIGURATION
 * ============================================================================
 *  Single source of truth for everything under app/(console)/portal/ — the
 *  half of the product a PAYING CLIENT signs in to.
 *
 *  Nothing user-facing is hard-coded in the portal's JSX. To change what a
 *  client reads, edit this file only.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  THE CLIENT-SAFE RULE  ←←← read this before adding anything to the portal
 *  ──────────────────────────────────────────────────────────────────────────
 *  The portal renders a `Lead`, and a Lead carries the agency's private view
 *  of that person. These fields MUST NEVER reach a portal screen:
 *
 *    lead.notes         "Currently working with a competitor agency."
 *    lead.source        "Cold Outreach" — how we found them
 *    lead.stageId       "Attended", "Lost" — our funnel, not their project
 *    lead.activity      "First dial attempt made" — the sales timeline
 *    rep figures        dials, appointments, conversions
 *    any other lead     a client sees their own record and nothing else
 *
 *  The portal shows the CLIENT-VISIBLE fields instead: `projectSummary`,
 *  `milestones`, `previews`, `liveUrl`, `updates`, `files`, `invoices`. That
 *  split is documented on the types themselves in lib/types.ts.
 *
 *  TODO(backend): enforce this on the SERVER. Filtering in the UI is a
 *  courtesy; the portal's API must return a client-shaped record that never
 *  contained the internal fields in the first place, so a mistake in one
 *  component cannot leak them.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  ON LANGUAGE
 *  ──────────────────────────────────────────────────────────────────────────
 *  No jargon reaches this surface. There is no "staging", no "deploy", no
 *  "environment", no "stage", no "lead". A client gets "preview" for the
 *  version we are building and "live" for the one their own customers use —
 *  see `content.links`. If a word would need explaining on a phone call, it
 *  does not belong here.
 *
 *  Quick answers to the usual requests:
 *    - Hide a panel ..................... features.<panel> = false
 *    - Point the demo at another client . demo.leadId
 *    - Reword anything .................. `content`
 *    - Add a portal page ................ add a NavItem with roles ["client"]
 *                                         in config/navigation.ts, then a
 *                                         folder under app/(console)/portal/
 * ============================================================================
 */

/** Toggles for optional blocks. Each removes its UI completely when false. */
export interface PortalFeatureFlags {
  /** The "Where things stand" panel under the header. */
  statusPanel: boolean;
  /** Preview + live-site cards. The client's two most-wanted links. */
  projectLinks: boolean;
  /** Screenshot gallery of shared previews. */
  previewGallery: boolean;
  /** Delivery milestone track. */
  milestones: boolean;
  /** Agency-authored updates feed. */
  updates: boolean;
  /** Invoice summary on the overview, and the Billing screen. */
  invoices: boolean;
  /** Downloadable files. */
  files: boolean;
  /** "Your Stallion contact" card with the assigned rep. */
  contact: boolean;
  /**
   * Show the client the target date on stages that have one.
   *
   * A date is a PROMISE, and this is where the agency makes it in writing. On
   * by default, because a client who can see when each stage is expected stops
   * having to ask — which is most of what the portal is for.
   *
   * Turn it off if the team would rather commit to dates over email, on the
   * projects where they mean them, rather than on every project by default.
   */
  stepTargetDates: boolean;
  /**
   * Show the client their own outstanding balance.
   *
   * On by default: not telling someone what they owe, on the one screen they
   * open to find out, is the most annoying possible omission. Turn it off if
   * billing is handled entirely outside the product.
   */
  outstandingBalance: boolean;
  /**
   * Let the contact card place real phone / email / WhatsApp actions.
   *
   * These are `tel:` / `mailto:` / `wa.me` links, so they work today with no
   * backend at all — which is why they are the portal's answer to "how do I
   * ask a question" while there is no messaging thread.
   */
  contactActions: boolean;
}

/** Every route the portal links to. In one place so a rename is one edit here
 *  plus one folder move. */
export interface PortalRoutes {
  home: string;
  previews: string;
  files: string;
  billing: string;
}

/**
 * Which record the preview build signs a client in as.
 *
 * DELETE WITH THE MOCK. Once auth is real, the signed-in client's own id comes
 * from the session (`Session.clientLeadId` in lib/session.ts) and this whole
 * object goes away.
 */
export interface PortalDemo {
  /**
   * The `Lead.id` shown when someone picks "Client" on the login card.
   *
   * `lead-1` is Soukaina Berrada / Rif Organics — the client from the original
   * design, whose project is fully delivered and launched, so both the preview
   * card and the live-site card have something to show. Point this at any
   * other client id (`lead-1` … `lead-14` in lib/mock/seed.ts) to see a
   * mid-flight project instead; every screen is built for both states.
   */
  leadId: string;
}

/**
 * How a client can actually reach the agency from the contact card.
 *
 * The rep on a lead has a name and an email but no phone number — see `Rep` in
 * lib/types.ts — so Call and WhatsApp use the agency's own line. That is also
 * the honest arrangement: a client should reach the agency, not one person's
 * mobile, and the agency answers whoever is available.
 *
 * An empty string removes that action entirely rather than rendering a dead
 * button, so an agency with no WhatsApp line simply sets it to "".
 */
export interface PortalContact {
  /** E.164, for `tel:` links. e.g. "+212522000000". */
  phone: string;
  /** Digits only, for `wa.me`. e.g. "212600000000" — no +, no spaces. */
  whatsapp: string;
}

export interface PortalConfig {
  features: PortalFeatureFlags;
  routes: PortalRoutes;
  demo: PortalDemo;
  contact: PortalContact;
  content: {
    /** ---- Header ---------------------------------------------------- */
    header: {
      /** `{name}` is replaced with the client's name. */
      titleTemplate: string;
      /** Fallback when a client has no project summary written yet. */
      summaryFallback: string;
      progressLabel: string;
      /** Screen-reader name for the progress bar. */
      progressAccessibleLabel: string;
      /** `{done}` / `{total}` are replaced. */
      progressDetail: string;
    };

    /** ---- "Where things stand" -------------------------------------- */
    status: {
      title: string;
      hint: string;
      /** Headline + body for each of the three project states. */
      startingTitle: string;
      startingBody: string;
      /** `{phase}` is replaced with the stage currently in progress. */
      workingTitle: string;
      workingBody: string;
      launchedTitle: string;
      launchedBody: string;
      /** Label above the next stage. */
      nextLabel: string;
      nextNone: string;
    };

    /** ---- Preview + live links --------------------------------------
     *  The wording the whole feature turns on. "Preview" is the version being
     *  built; "live" is the one their customers use. Neither needs explaining,
     *  which is the entire requirement. */
    links: {
      title: string;
      hint: string;

      previewBadge: string;
      previewTitle: string;
      previewBody: string;
      previewAction: string;
      /** `{when}` is replaced by a "2 days ago" style string. */
      previewUpdated: string;
      previewEmptyTitle: string;
      previewEmptyBody: string;

      liveBadge: string;
      liveTitle: string;
      liveBody: string;
      liveAction: string;
      liveEmptyTitle: string;
      liveEmptyBody: string;

      /** Sits under the preview card. Says where the link may be shared. */
      privacyNote: string;
      /** Appended for screen readers on links that open a new tab. */
      newTabLabel: string;
    };

    /** ---- Preview gallery ------------------------------------------- */
    previews: {
      title: string;
      hint: string;
      seeAll: string;
      openLabel: string;
      /** Caption on a preview with no screenshot uploaded yet. */
      noScreenshot: string;
      emptyTitle: string;
      emptyDescription: string;
    };

    /** ---- Milestones ------------------------------------------------- */
    milestones: {
      title: string;
      hint: string;
      status: { done: string; in_progress: string; pending: string };
      /** `{date}` is replaced. Shown on unfinished stages that carry a date. */
      expectedBy: string;
      emptyTitle: string;
      emptyDescription: string;
    };

    /** ---- Updates ---------------------------------------------------- */
    updates: {
      title: string;
      hint: string;
      emptyTitle: string;
      emptyDescription: string;
    };

    /** ---- Invoices --------------------------------------------------- */
    invoices: {
      title: string;
      hint: string;
      /** Shorter title for the summary card on the overview. */
      summaryTitle: string;
      status: { paid: string; pending: string; overdue: string };
      outstandingLabel: string;
      allSettledLabel: string;
      /** Under the outstanding figure. Say how to actually resolve it. */
      payNote: string;
      seeAll: string;
      emptyTitle: string;
      emptyDescription: string;
    };

    /** ---- Files ------------------------------------------------------ */
    files: {
      title: string;
      hint: string;
      downloadLabel: string;
      /** Why the download button is inert until the backend exists. */
      downloadUnavailable: string;
      emptyTitle: string;
      emptyDescription: string;
    };

    /** ---- Contact ---------------------------------------------------- */
    contact: {
      title: string;
      hint: string;
      /** Sits under the rep's name — what this person is here for. */
      roleLabel: string;
      emailAction: string;
      callAction: string;
      whatsappAction: string;
      /** `{project}` is replaced with the client's project title. */
      emailSubject: string;
      unassignedTitle: string;
      unassignedDescription: string;
    };

    /** ---- Signed-in identity, shown in the topbar -------------------- */
    identity: {
      /** Uppercase pill beside the client name. */
      roleBadge: string;
      /** Under the name when the record carries no company. */
      titleFallback: string;
      /** Used only if the record cannot be found at all. */
      nameFallback: string;
    };

    /** ---- Whole-screen states ---------------------------------------- */
    missingTitle: string;
    missingDescription: string;
    missingAction: string;
    /** Shown when a client's record exists but has no project on it yet. */
    noProjectTitle: string;
    noProjectDescription: string;
  };
}

export const portalConfig: PortalConfig = {
  features: {
    statusPanel: true,
    projectLinks: true,
    previewGallery: true,
    milestones: true,
    updates: true,
    invoices: true,
    files: true,
    contact: true,
    stepTargetDates: true,
    outstandingBalance: true,
    contactActions: true,
  },

  routes: {
    home: "/portal",
    previews: "/portal/previews",
    files: "/portal/files",
    billing: "/portal/billing",
  },

  demo: {
    leadId: "lead-1",
  },

  // TODO(backend): replace with the agency's real numbers before this ships to
  // a client. These are placeholders in the right format, not working lines.
  contact: {
    phone: "+212522000000",
    whatsapp: "212600000000",
  },

  content: {
    header: {
      titleTemplate: "{name}’s project",
      summaryFallback: "Your project with Stallion Advertising.",
      progressLabel: "Overall progress",
      progressAccessibleLabel: "Overall project progress",
      progressDetail: "{done} of {total} stages complete",
    },

    status: {
      title: "Where things stand",
      hint: "Updated as we go",
      startingTitle: "We’re getting started",
      startingBody:
        "Your project is booked in. The first work appears here as soon as it is ready to look at.",
      workingTitle: "We’re working on {phase}",
      workingBody:
        "This is the part of your project we are building right now. You will see it here first.",
      launchedTitle: "Your project is live",
      launchedBody:
        "Everything we agreed is delivered and online. We are still here if you need anything.",
      nextLabel: "Up next",
      nextNone: "Nothing left — you are all done.",
    },

    links: {
      title: "Your links",
      hint: "Preview and live",

      previewBadge: "Work in progress",
      previewTitle: "Preview your project",
      previewBody:
        "A private link to what we are building. It changes as we work, so expect things to move around.",
      previewAction: "Open preview",
      previewUpdated: "Updated {when}",
      previewEmptyTitle: "No preview yet",
      previewEmptyBody:
        "As soon as there is something to look at, the link appears here.",

      liveBadge: "Live",
      liveTitle: "Your live site",
      liveBody: "The version your customers see. This one is public.",
      liveAction: "Visit your site",
      liveEmptyTitle: "Not live yet",
      liveEmptyBody: "Once we launch, your public link will be right here.",

      privacyNote:
        "The preview link is private — please keep it inside your team.",
      newTabLabel: "opens in a new tab",
    },

    previews: {
      title: "Previews",
      // Not a restatement of the topbar subtitle above it. The subtitle says
      // what the screen is; the hint says how to read the list.
      hint: "Newest first",
      seeAll: "See all previews",
      openLabel: "Open",
      noScreenshot: "Screenshot coming soon",
      emptyTitle: "Nothing shared yet",
      emptyDescription:
        "When we have something for you to look at, it shows up here first.",
    },

    milestones: {
      title: "Your project stages",
      hint: "Start to launch",
      // "Not started" rather than "Pending" — pending sounds like something is
      // waiting on the client, and none of these are.
      status: {
        done: "Complete",
        in_progress: "In progress",
        pending: "Not started",
      },
      expectedBy: "Expected by {date}",
      emptyTitle: "No stages yet",
      emptyDescription:
        "Your project plan appears here once we have agreed the scope.",
    },

    updates: {
      title: "Latest updates",
      hint: "Newest first",
      emptyTitle: "No updates yet",
      emptyDescription: "We post here whenever something moves forward.",
    },

    invoices: {
      title: "Invoices",
      hint: "Your billing",
      summaryTitle: "Billing",
      // "Due" rather than "Pending": the client's question is whether they owe
      // it, and "pending" reads as "we are still deciding".
      status: { paid: "Paid", pending: "Due", overdue: "Overdue" },
      outstandingLabel: "Outstanding",
      allSettledLabel: "Nothing outstanding",
      payNote: "Questions about an invoice? Ask your contact.",
      seeAll: "See all invoices",
      emptyTitle: "No invoices yet",
      emptyDescription: "Anything we bill you for is listed here.",
    },

    files: {
      title: "Your files",
      // Same rule as the previews hint: the topbar already says what these
      // are, so the hint says what you can do with them.
      hint: "Yours to keep",
      downloadLabel: "Download",
      downloadUnavailable: "File downloads arrive with the backend",
      emptyTitle: "No files yet",
      emptyDescription:
        "Signed documents and finished work appear here as we go.",
    },

    contact: {
      title: "Your Stallion contact",
      hint: "One person, not a queue",
      roleLabel: "Looking after your project",
      emailAction: "Email",
      callAction: "Call",
      whatsappAction: "WhatsApp",
      emailSubject: "Question about {project}",
      unassignedTitle: "Contact coming soon",
      unassignedDescription:
        "We are assigning someone to look after your project. Until then, reply to your last email from us.",
    },

    identity: {
      roleBadge: "Client",
      titleFallback: "Client",
      nameFallback: "Your account",
    },

    missingTitle: "We cannot find your project",
    missingDescription:
      "The link may be out of date. Sign in again, or contact us and we will sort it out.",
    missingAction: "Back to sign in",
    noProjectTitle: "Your project has not started yet",
    noProjectDescription:
      "As soon as we kick off, your stages, previews and invoices appear here.",
  },
};
