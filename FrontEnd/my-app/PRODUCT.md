# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

All four roles are built, each with its own front and its own route guard.

The map of which role writes which field, and which fields must never reach
which audience, is `config/roles.ts`. Read it before adding a screen.

- **Admin (built).** The agency lead running Stallion Advertising's sales
  operation: watching pipeline health, reading rep performance, adding clients,
  editing stages and reps. Everything under `app/(console)/admin/` is this
  person's surface.
- **Client (built, 2026-08-21).** A paying client signing in to see their own
  project: overall progress, what stage the work is at, the preview and live
  links, files and invoices. Everything under `app/(console)/portal/`, with its
  copy and flags in `config/portal.ts`. A client never sees the pipeline, any
  other client, the internal notes, the lead source or the sales timeline —
  that boundary is stated as the CLIENT-SAFE RULE at the top of
  `config/portal.ts` and mirrored on the types in `lib/types.ts`.
- **Dev team (built, 2026-08-22).** The agency's developers, who pick up work
  once a lead becomes a paying client. Everything under `app/(console)/dev/`,
  with its copy and flags in `config/dev.ts`. The workspace is the WRITE SIDE
  of the client portal: ticking a step moves the client's progress rail, adding
  a preview turns on their preview card, saving a live URL turns on their
  live-site card, and posting an update lands in their feed. A developer never
  sees the pipeline, the lead source, the internal notes or the sales timeline.
- **Sales rep (built, 2026-08-23; analysis added 2026-09-01).** Works their OWN leads
  day to day: dials, stage moves, notes, appointments. Everything under
  `app/(console)/rep/`, with its copy and flags in `config/rep.js`. It is the
  agency console narrowed to one person — the kanban, the funnel and the stage
  breakdown are the SAME components with a `leads` prop, so a rep and their manager
  are always reading the same instrument. A rep never sees another rep's leads, the
  team KPIs, the leaderboard, Reports or Settings. A single deliberate exception is
  `/rep/analysis` (campaign acquisition costs and return), which is per-campaign
  rather than per-person and enables reps to know which lead sources are expensive.

## Product Purpose

Stallion CRM is Stallion Advertising's own operating console. Its job is to
connect the parties in one agency relationship — the agency, its clients, its
sales reps, and its developers — around a single lead record, so that a lead's
history, delivery milestones, files and invoices stay in one place as it moves
from first contact to paying client to delivered work.

Success is that the admin can answer "where does everything stand" without
asking anyone, and that a lead handed from a rep to the dev team arrives with
its context attached.

Commercial trajectory is **not settled**. Asked whether this is internal-only,
internal-now-sellable-later, a product for other agencies, or a demonstration
piece, the answer was that all four framings apply to some degree. Treat it as
internal-first: Stallion's own workflow is the requirement, and nothing may be
generalized at the cost of fitting Stallion. Do not add multi-tenant,
white-label or plan/billing concepts until that decision is actually made.

## Positioning

A generic CRM tracks a deal until it closes. Stallion CRM carries the same
record past the close: a "client" is not a separate entity but a lead whose
stage is the won stage (`isWon` in `config/pipeline.ts`), and that record then
carries milestones, files and invoices for the delivery team. The pipeline and
the client list can therefore never disagree, and the handoff from sales to
delivery loses nothing.

## Operating Context

- Agency in Morocco. Figures are formatted `en-MA` / **MAD** (`config/admin.ts`).
- The work is a phone-and-pipeline sales motion: dials, appointments,
  conversions per rep are the tracked metrics, and leads arrive from named
  sources tracked for reporting.
- Once a lead converts, work becomes delivery: milestones, attached files, and
  invoices with paid / overdue / pending states.
- Reps coordinate through in-app team chat rather than only external tools.
- **Desktop-first.** Real use is at a desk; phone must work for checking in, but
  it is not the primary data-entry surface.
- The codebase is handed to other developers on the agency team.

## Capabilities and Constraints

Built today (admin console): Dashboard with computed KPIs, Clients list and
lead detail, Pipeline kanban with drag between stages, Team Chat, Reports,
Settings (reps + stage editor).

Built today (client portal): My Project (progress, plain-language status,
preview + live links, stage track, updates, billing summary, named contact),
Previews, Files, Invoices.

Built today (dev workspace): Projects grid (search, status filter, overdue
markers, New project), and one project — step checklist with drag reorder,
inline rename and target dates; client previews with screenshot upload and link
sharing; live-site URL; client update composer.

Built today (rep workspace): Dashboard (four first-person KPIs, My Leads by
Stage, My Clients), My Clients (search, add, table + phone cards), My Pipeline
(kanban ⇄ funnel, scoped), Team Chat (one thread with the manager), Analysis
(`/rep/analysis` — campaign ROI & acquisition cost breakdown), and a scoped lead
page with notes, log-a-call and a stage control.

- **A rep's figures are derived from their LEADS, not from the `Rep`
  counters.** The rep record carries its own `conversions`, and in the seed it
  disagrees with the leads (Sara B. is recorded with 4, and has 2 in the Client
  stage). On admin screens the two never appear together; on a rep's own
  dashboard they would sit inches apart. `selectRepKpis()` derives the rates
  from the leads and leaves the counter to the admin leaderboard — replace both
  with dated call/appointment records when the backend lands.
- **`ChatMessage.fromMe` is re-derived per viewer.** It is stored from the
  manager's point of view, so every flag is backwards on the rep's side of the
  same thread. `messagesForViewer()` computes it from the author at render
  time; drop the stored flag once messages carry an author id.

- **The three-state bridge.** A developer sees one checkbox per step; a client
  sees Complete / In progress / Not started. The middle state is DERIVED after
  every edit by `normalizeMilestones()` in `lib/crm-api.ts` — the first unticked
  step is the one in progress. Nothing else may write `Milestone.status`.
- **Screenshots are a stopgap.** Dropped images are downscaled in the browser
  and stored as data URLs in `localStorage` (`lib/image-upload.ts`), with hard
  caps, because the ~5MB origin quota is shared with every other record.
  Replace with object storage plus a signed URL; the limits then belong to the
  server.

- **No backend yet.** `lib/auth.ts` and `lib/crm-api.ts` are the two integration
  boundaries, each gated by a `*_BACKEND_CONNECTED` flag. All console data is
  seeded mock data persisted to `localStorage` behind a versioned key.
- **Mock data must never pass as real.** The `MOCK DATA` chip and the reset
  control in Settings are load-bearing product guarantees, not decoration.
- **Nav filtering is convenience, not security.** Role-based hiding in
  `config/navigation.ts` must be backed by server-side authorization when the
  backend lands.
- **Translation is coming.** French and/or Arabic are expected. Arabic implies
  RTL. All user-facing copy already lives in `config/*.ts` `content` objects;
  layouts must survive both a longer language and a mirrored one.
- **Dark only.** No light mode. (User decision, 2026-08-19.)
- Login is email + password + forgot-password. No language switcher on the
  login screen. (User decisions, 2026-08-18.)
- **Role comes from the session, not from the login form** — the 2026-08-18
  decision stands as the end state. The one exception is the preview build: an
  Admin / Dev / Client switch on the login card, because with credentials
  unchecked there is otherwise nothing that can tell the three fronts apart and
  two of them are reachable only by typing the URL. It is gated on
  `features.previewRoleSwitch` **and** on `authBackendConnected` being false,
  so it removes itself the day auth lands rather than needing to be remembered.
  (User decision, 2026-08-21, amending the above for the preview build only.)
- **Role isolation is a display switch, not a boundary, until the backend
  lands.** `lib/session.ts` reads an unsigned cookie; the two route guards
  (`admin`, `rep`, `dev` and `portal` layouts under `app/(console)/`) are the
  right shape — server-side, before any markup — but become real only once
  `readSession()` reads a verified session AND the API filters its responses by
  role. Both are required. Two of the four matter most: `/dev`, which shows
  every client's project to whoever gets in, and `/rep`, whose whole premise is
  that `lead.assignedRepId === session.repId` is enforced somewhere real.
- Terminology: *lead* is the single record type; *client* = lead in the won
  stage; *rep* = sales rep; *stage* = pipeline column; *source* = lead origin.
  On the delivery side a *milestone* is called a **step** to a developer and a
  **stage** to a client — same field, two audiences, and the words are in
  `config/dev.ts` and `config/portal.ts` respectively.
- Dates format day-first (`locale` is `en-GB` in `config/admin.ts`). `en-MA`
  resolves to US month-first ordering in ICU, which is wrong for Morocco; every
  other formatted figure is identical between the two.

## Brand Commitments

- Name: **Stallion Advertising**, product **CRM** (`config/brand.ts`).
- Artwork: horse-mark lockup and standalone mark in `public/brand/`.
- Voice in the console is plain and operational — direct labels, no marketing
  tone inside the product.
- Code style is itself a commitment: user-facing copy, feature flags and routes
  live in typed config modules with generous "to change X, edit Y" comments, so
  another agency developer can change the product without reading component
  internals.

## Evidence on Hand

- Prototype screens from Hicham for 7 screens (Dashboard, Clients, Clients +
  Add modal, Pipeline, Team Chat, Settings, Lead Detail). A **Reports prototype
  screenshot is still outstanding**.
- Brand artwork: `public/brand/stallion-logo.png`, `public/brand/stallion-mark.png`.
- Seeded sample data: `lib/mock/seed.ts`.
- **There is no real customer data, no real revenue figure, no testimonial, no
  case study and no benchmark.** Every number visible in the console is
  invented sample data. Nothing may be presented as an actual Stallion result,
  and no client name may be published as a reference.

## Product Principles

1. **One record, many views.** Lead, client, pipeline card and delivery file are
   the same record seen from different angles — never parallel entities that can
   drift apart.
2. **Fake data must announce itself.** Anything running on mock data says so and
   offers a way back to a clean state.
3. **Editable by the next developer.** Copy, flags and routes in typed config;
   integrations behind a single boundary file; comments that say where to edit.
4. **Roles decide the surface, the server decides the permission.** Hiding is
   never the security boundary.
5. **Built to be translated and to be read at a desk.** No string trapped in JSX,
   no layout that only holds at one language, one direction, or one width.

## Accessibility & Inclusion

No formal external standard has been mandated. The project has been holding
these as working floors and future work should not drop below them:

- 4.5:1 text contrast on console surfaces (an earlier `--ink-muted` value failed
  this and was corrected).
- Keyboard and touch operability for the pipeline drag — the reason `@dnd-kit`
  was chosen over native HTML5 drag events.
- Skip-to-content link and labelled controls in the console shell.
- RTL support becomes an accessibility requirement the moment Arabic ships.
