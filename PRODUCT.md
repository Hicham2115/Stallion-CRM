# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Four roles are planned. Only the first is built today; the other three are
confirmed as coming, and no screen for them has been designed yet.

- **Admin (built, and the only front that exists today).** The agency lead
  running Stallion Advertising's sales operation: watching pipeline health,
  reading rep performance, adding clients, editing stages and reps. Everything
  under `app/(console)/admin/` is this person's surface.
- **Sales rep (planned).** Works leads day to day — dials, stage moves, notes,
  team chat. Present in `navigation.ts` as the `sales` role and in the data
  model as `Rep`, but has no dedicated front yet.
- **Dev team (planned).** The agency's developers, who pick up work once a lead
  becomes a paying client and delivery milestones start. **Not yet represented
  in code** — `Role` in `config/navigation.ts` is `"admin" | "sales" | "client"`
  and will need a fourth member.
- **Client (planned).** A paying client signing in to see their own delivery
  status, files and invoices. The `client` role exists in `navigation.ts` but
  currently lands on `/admin`, which is a placeholder, not a decision.

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
- Login is email + password + forgot-password. No role-picker buttons — role
  comes from the backend session. No language switcher on the login screen.
  (User decisions, 2026-08-18.)
- Terminology: *lead* is the single record type; *client* = lead in the won
  stage; *rep* = sales rep; *stage* = pipeline column; *source* = lead origin.

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
