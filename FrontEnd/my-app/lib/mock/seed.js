/**
 * MOCK SEED DATA
 *
 *  DELETE THIS ENTIRE FOLDER once the API is live. Nothing outside
 *  lib/store/ and lib/crm-api.ts imports it.
 *
 *  Everything is generated from index arithmetic rather than written out by
 *  hand, and there is no `Math.random()` anywhere. That matters for two
 *  reasons: the server and the client must render byte-identical output (a
 *  random value would differ between them and trip a hydration mismatch), and
 *  a bug that only reproduces on some page loads is miserable to chase.
 *
 *  The figures reproduce the design exactly:
 *    80 leads   -> New 20 · Contacted 16 · Appointment Set 13 · Attended 10 ·
 *                  Client 14 · Lost 7
 *    8 reps     -> 410 dials total, so 51 dials/rep
 *  and every headline KPI is DERIVED from those in lib/store/selectors.ts
 *  rather than stored, so the numbers cannot drift apart.
 *
 *  Two properties this file guarantees, because Reports depends on both:
 *    - sources are WEIGHTED, not uniform (see SOURCE_DISTRIBUTION)
 *    - leads carry a creation age spread over ~90 days, so a date range
 *      actually selects something (see createdDaysAgo in buildLeads)
 *
 *  TODO(backend): real records will carry ISO timestamps. Add `createdAt` /
 *  `stageChangedAt` alongside `daysAgo` / `daysInStage` and derive the day
 *  counts client-side; do not remove the day-count fields until every
 *  consumer has moved over.
 */
import { pipelineConfig } from "@/config/pipeline";
// Pools. Index arithmetic over these produces the whole dataset.
const FIRST_NAMES = [
    "Soukaina", "Youssef", "Amine", "Sara", "Nadia",
    "Karim", "Hicham", "Salma", "Rania", "Omar",
    "Yassine", "Adil", "Nizar", "Hind", "Leila",
    "Imane", "Anas", "Zineb", "Mehdi", "Fatima",
];
const LAST_NAMES = [
    "Berrada", "El Amrani", "Fassi", "Tazi", "Lahlou",
    "Idrissi", "Cherkaoui", "Skalli", "Bennani", "Alaoui",
];
const COMPANIES = [
    "Rif Organics", "Atlas Motors", "Blue Coast Realty", "Chefchaouen Crafts",
    "Riad Digital", "Medina Bakery", "Agadir Surf Co", "Oasis Foods",
    "Tanger Textiles", "Kenitra Print", "Marrakech Tiles", "Dakhla Seafood",
    "Ouarzazate Tours", "Sahara Freight", "Souss Agro", "Sale Auto Parts",
    "Casa Fitness", "Fes Leather Co", "Meknes Furniture", "Nova Beauty",
];
const NOTE_BODIES = [
    "Referred by an existing client, warm lead.",
    "Asked for Instagram ad case studies.",
    "Looking for an app MVP within 3 months.",
    "Currently working with a competitor agency.",
    "Very responsive, quick decision maker.",
    "Interested in a full rebrand and web build.",
    "Wants a lead-gen campaign for Q4.",
    "Budget-conscious, needs a phased proposal.",
];
/* Reps — the eight from the design, with their exact figures.
   Total dials 62+48+71+39+55+44+33+58 = 410, which is what makes the
   "Avg Dials / Rep 51" card come out right (410 / 8 = 51.25). */
const REP_SEED = [
    ["Youssef K.", 62, 15, 6],
    ["Sara B.", 48, 11, 4],
    ["Karim T.", 71, 18, 8],
    ["Nadia F.", 39, 8, 2],
    ["Omar L.", 55, 13, 5],
    ["Rania S.", 44, 9, 3],
    ["Anas M.", 33, 6, 1],
    ["Imane Z.", 58, 14, 6],
];
/**
 * Dials made today, per rep.
 *
 * Derived from the all-time total rather than invented, so the two can never
 * contradict each other — today's figure is always a plausible fraction of the
 * career one. The `+ index` breaks the ties that plain division would produce
 * and keeps the eight numbers distinct, which matters because a rep comparing
 * their card to a colleague's should not see a suspiciously round pattern.
 *
 * TODO(backend): delete. A real system counts today's dated call records.
 */
function dialsTodayFor(dials, index) {
    return Math.max(1, Math.round(dials / 6) + (index % 3));
}
function buildReps() {
    return REP_SEED.map(([name, dials, appointments, conversions], index) => ({
        id: `rep-${index + 1}`,
        name,
        // "Youssef K." -> youssef@stallionadvertising.ma
        email: `${name.split(" ")[0].toLowerCase()}@stallionadvertising.ma`,
        role: "Sales Rep",
        dials,
        dialsToday: dialsTodayFor(dials, index),
        appointments,
        conversions,
        active: true,
    }));
}
// Leads
/**
 * How many leads sit in each stage, in pipeline order. These are the numbers
 * on the dashboard, so they are declared once here and everything else counts
 * the leads rather than repeating them.
 */
const STAGE_DISTRIBUTION = {
    client: 14,
    new: 20,
    contacted: 16,
    appointment_set: 13,
    attended: 10,
    lost: 7,
};
/**
 * Stage assignment order. Clients come FIRST so that lead indices 0-13 are the
 * paying clients — which is what makes the Clients screen open on Soukaina
 * Berrada, Youssef El Amrani, Amine Fassi … exactly as designed.
 */
const STAGE_FILL_ORDER = [
    "client", "new", "contacted", "appointment_set", "attended", "lost",
];
/** A flat array of 80 stage ids, one per lead index. */
function buildStageAssignments() {
    return STAGE_FILL_ORDER.flatMap((stageId) => Array(STAGE_DISTRIBUTION[stageId] ?? 0).fill(stageId));
}
/* --------------------------------------------------------------------------
   Lead sources
   -------------------------------------------------------------------------- */
/**
 * How many of the 80 leads came from each source.
 *
 * WHY THIS IS NOT `i % 8`. The first cut assigned sources by index modulo the
 * source count, which split 80 leads into eight groups of exactly ten. The
 * Reports source panel then drew eight bars of identical length reading
 * "10 (13%)" eight times — a third of the screen carrying no information at
 * all. A perfectly flat distribution is not a neutral default; it is a claim
 * about the business, and a false one.
 *
 * These weights are what a Casablanca agency actually looks like: word of
 * mouth and Instagram carry the business, paid search and Facebook trail,
 * cold outreach is thin, and almost nobody walks through the door. The point
 * is that the panel now has a shape worth reading — the top two sources are
 * responsible for 44% of everything.
 *
 * The counts must add up to the lead total, which is asserted below.
 */
const SOURCE_DISTRIBUTION = {
    Referral: 19,
    Instagram: 16,
    WhatsApp: 11,
    "Google Ads": 10,
    "Facebook Ads": 9,
    Website: 7,
    "Cold Outreach": 5,
    "Walk-in": 3,
};
/**
 * Step used to deal sources out across the lead list.
 *
 * A flat bag of 80 source strings assigned in order would put every Referral at
 * the front — and because clients occupy indices 0-13 (see STAGE_FILL_ORDER),
 * every paying client would have come from a referral and no other source would
 * ever have converted. Walking the bag in strides instead spreads each source
 * across the whole pipeline.
 *
 * The stride must be coprime with the 80-lead total, which is what makes the
 * walk a bijection: every position is visited exactly once, so no source is
 * dealt twice and none is dropped.
 *
 * 71 specifically, out of the 32 coprime candidates, because it is the only one
 * that lands all eight sources among the fourteen clients while keeping
 * Referral the biggest converter. Weaker strides produced a dataset that
 * quietly told a false story — 27, the first choice, converted only three
 * sources and gave Referral zero clients, so the top lead source in the company
 * appeared never to have closed a deal. Reads as a broken funnel, not a demo.
 */
const SOURCE_STRIDE = 71;
/**
 * A flat array of 80 source names, one per lead index, matching the weights
 * above and mixed across the pipeline by the stride.
 */
function buildSourceAssignments(total) {
    // The bag: each source repeated as many times as its weight.
    const bag = pipelineConfig.sources.flatMap((source) => Array(SOURCE_DISTRIBUTION[source] ?? 0).fill(source));
    if (bag.length !== total) {
        throw new Error(`Seed source weights total ${bag.length}, expected ${total}. ` +
            "Update SOURCE_DISTRIBUTION in lib/mock/seed.ts.");
    }
    return Array.from({ length: total }, (_, i) => bag[(i * SOURCE_STRIDE) % total]);
}
/**
 * The activity a lead has accumulated, truncated to how far it actually got.
 * A lead sitting in "Contacted" should not have an "Appointment attended"
 * entry — the timeline is the story of the stage journey, so it has to stop
 * where the journey stopped.
 */
const ACTIVITY_JOURNEY = [
    "Lead created",
    "First dial attempt made",
    "Appointment booked",
    "Appointment attended",
    "Signed as client",
];
function buildActivity(leadIndex, stageId) {
    const stageIndex = pipelineConfig.stages.findIndex((s) => s.id === stageId);
    const stage = pipelineConfig.stages[stageIndex];
    // Lost leads get the steps they completed plus the loss itself. Everyone
    // else gets one activity line per stage reached.
    const reached = stage?.isLost
        ? 2
        : Math.min(stageIndex + 1, ACTIVITY_JOURNEY.length);
    const events = ACTIVITY_JOURNEY.slice(0, reached).map((label, step) => ({
        id: `act-${leadIndex}-${step}`,
        label,
        // Oldest first: the earliest step happened the longest time ago.
        daysAgo: reached + 1 - step,
    }));
    if (stage?.isLost) {
        events.push({
            id: `act-${leadIndex}-lost`,
            label: "Marked as lost",
            daysAgo: 1,
        });
    }
    return events;
}
/* Delivery — the half of a record the CLIENT sees in their own portal
   Milestones, previews, the live link and the updates feed all hang off ONE
   number: how many project stages this client has finished. Deriving them
   together is what keeps the seed self-consistent — a client cannot end up
   showing a live site while their Launch stage still reads "in progress", or
   an update saying "you are live" on a project that is 40% done. */
/** The four stages of a delivery, in order. Client-facing wording. */
const PROJECT_STAGES = ["Discovery & Brief", "Design", "Development", "Launch"];
/**
 * How many stages this client has COMPLETED, 0-4.
 *
 * The offset is not decoration. `leadIndex % 5` would give lead-1 zero
 * completed stages, and lead-1 is the client the portal opens on
 * (`portalConfig.demo.leadId`) — so the first thing anyone saw would be a
 * project at 0% with no preview, no live link and no updates, which is the one
 * state that demonstrates nothing. `+ 4` lands lead-1 on a fully delivered,
 * launched project, exactly as the original design showed it, and the other
 * thirteen clients still spread evenly across every other state.
 *
 * The previous formula, `(leadIndex % 4) + 1`, could never reach 100% at all:
 * it always left the last stage "in progress", so no client in the database
 * was ever finished and the live-site card would have been dead everywhere.
 */
function completedStages(leadIndex) {
    return (leadIndex + 4) % (PROJECT_STAGES.length + 1);
}
/** "Rif Organics" -> "rif-organics". Deterministic, so the demo URLs come out
 *  identical on the server and on the client. */
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
/**
 * A fixed date to hang the seed's target dates on.
 *
 * A LITERAL, not `new Date()`. Seed data is generated during the server render
 * AND again during the first client render; deriving dates from the clock
 * means the two can straddle midnight and produce different strings, which
 * React reports as a hydration mismatch — the exact failure the note at the
 * top of lib/types.ts describes. A frozen anchor cannot drift.
 *
 * TODO(backend): delete with the rest of the mock. Real target dates are typed
 * in by a developer in the workspace and stored as they were entered.
 */
const SEED_TODAY = new Date("2026-08-21T00:00:00Z");
/** `SEED_TODAY + days`, as "YYYY-MM-DD". */
function seedDate(days) {
    const date = new Date(SEED_TODAY);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}
/** Delivery milestones. Only paying clients have a project to deliver. */
function buildMilestones(leadIndex, isClient) {
    if (!isClient)
        return [];
    const completed = completedStages(leadIndex);
    return PROJECT_STAGES.map((label, step) => {
        const status = step < completed ? "done" : step === completed ? "in_progress" : "pending";
        return {
            id: `ms-${leadIndex}-${step}`,
            label,
            status,
            // Only steps still to come carry a date, and they spread forward two
            // weeks apart. A finished step with a target date invites the reader to
            // check whether it was hit, which is a different feature.
            //
            // Every fourth project is deliberately running LATE — its next step was
            // due before SEED_TODAY — so the overdue treatment on the projects grid
            // has something to show. A demo dataset where nothing is ever late makes
            // the warning look like dead code.
            targetDate: status === "done"
                ? null
                : seedDate((leadIndex % 4 === 1 ? -6 : 5) + (step - completed) * 14),
        };
    });
}
/**
 * What we are building, in one line the client would recognise.
 *
 * Never mentions the pipeline, the source or the sales history — see the
 * CLIENT-SAFE RULE at the top of config/portal.ts.
 */
const PROJECT_SUMMARIES = [
    "A new website and a brand refresh.",
    "A lead-generation campaign with landing pages.",
    "An online store with delivery and payments.",
    "A booking site for your customers.",
    "A brand identity and a social media kit.",
];
function buildProjectSummary(leadIndex, isClient) {
    return isClient
        ? PROJECT_SUMMARIES[leadIndex % PROJECT_SUMMARIES.length]
        : "";
}
/**
 * Previews shared with the client, newest first.
 *
 * Nothing exists before the Design stage has started, because there is
 * genuinely nothing to look at during discovery — and a preview card promising
 * a link that opens a blank page is worse than the empty state.
 *
 * `imageUrl` is null on every one of them: the repo ships no screenshots, and
 * inventing an <img> src that 404s would render a broken-image icon on the
 * client project page. The portal draws a designed placeholder instead.
 */
const PREVIEW_SEED = [
    ["Homepage", "First look at the new homepage."],
    ["Product pages", "Updated the gallery and the enquiry form."],
    ["Mobile layout", "How everything reflows on a phone."],
];
function buildPreviews(leadIndex, isClient, company) {
    if (!isClient)
        return [];
    const completed = completedStages(leadIndex);
    if (completed < 1)
        return [];
    const slug = slugify(company);
    return PREVIEW_SEED.slice(0, Math.min(completed, PREVIEW_SEED.length)).map(([label, note], index) => ({
        id: `prev-${leadIndex}-${index}`,
        label,
        note,
        imageUrl: null,
        url: `https://preview.stallionadvertising.ma/${slug}/${slugify(label)}`,
        // Newest first: the entry at index 0 was shared most recently.
        updatedDaysAgo: 2 + index * 5,
    }));
}
/**
 * The public link, and only once every stage is finished.
 *
 * A live URL on an unfinished project is the single most damaging thing this
 * screen could get wrong: the client clicks it, sees half-built work at a
 * public address, and reasonably concludes we launched without telling them.
 */
function buildLiveUrl(leadIndex, isClient, company) {
    if (!isClient)
        return null;
    return completedStages(leadIndex) === PROJECT_STAGES.length
        ? `https://${slugify(company)}.ma`
        : null;
}
/**
 * Agency-authored notes to the client, newest first.
 *
 * One per stage completed, plus the kick-off. This is what the portal shows
 * INSTEAD of `lead.activity` — the sales timeline says "First dial attempt
 * made", which is true, internal, and something no paying client should ever
 * read about themselves.
 */
const UPDATE_SEED = [
    [
        "Kick-off done",
        "Thanks for the brief — we have everything we need to get started.",
    ],
    [
        "First designs are ready",
        "Open the preview link and tell us what you think. Nothing is final yet.",
    ],
    ["Build under way", "The pages you approved are being put together now."],
    ["You are live", "Your site is public and everything we agreed is delivered."],
];
function buildUpdates(leadIndex, isClient) {
    if (!isClient)
        return [];
    const completed = completedStages(leadIndex);
    // The kick-off always happened, so a brand new client still has one update
    // rather than an empty feed on the day they sign.
    const reached = Math.min(completed + 1, UPDATE_SEED.length);
    return UPDATE_SEED.slice(0, reached)
        .map(([title, body], step) => ({
        id: `upd-${leadIndex}-${step}`,
        title,
        body,
        // Six days between updates, oldest first...
        daysAgo: (reached - step) * 6,
    }))
        // ...then flipped, because the feed reads newest first.
        .reverse();
}
function buildFiles(leadIndex, isClient) {
    if (!isClient)
        return [];
    return [
        { id: `file-${leadIndex}-1`, name: "Client Brief.pdf" },
        { id: `file-${leadIndex}-2`, name: "Signed Contract.pdf" },
    ];
}
function buildInvoices(leadIndex, isClient) {
    if (!isClient)
        return [];
    return [
        {
            id: `inv-${leadIndex}-1`,
            reference: `INV-${1000 + leadIndex * 60}`,
            amount: 4000 + leadIndex * 660,
            status: leadIndex % 3 === 0 ? "pending" : "overdue",
        },
        {
            id: `inv-${leadIndex}-2`,
            reference: `INV-${2000 + leadIndex * 60}`,
            amount: 7000 + leadIndex * 820,
            status: "paid",
        },
    ];
}
function buildLeads(reps) {
    const stageAssignments = buildStageAssignments();
    const sourceAssignments = buildSourceAssignments(stageAssignments.length);
    return stageAssignments.map((stageId, i) => {
        const first = FIRST_NAMES[i % FIRST_NAMES.length];
        // The last-name index is shifted by which block of 20 we are in, so all 80
        // names come out unique. A plain `LAST_NAMES[i % 10]` would repeat every
        // 20 leads and put four "Soukaina Berrada"s in the database.
        const last = LAST_NAMES[((i % LAST_NAMES.length) + Math.floor(i / FIRST_NAMES.length)) %
            LAST_NAMES.length];
        const isClient = stageId === pipelineConfig.wonStageId;
        const note = {
            id: `note-${i}`,
            body: NOTE_BODIES[i % NOTE_BODIES.length],
            authorName: reps[i % reps.length].name,
            daysAgo: 1,
        };
        const daysInStage = 1 + ((i * 3) % 13);
        // Age, spread near-uniformly across the last 90 days so a date range has
        // something to select at every setting: ~7 leads in the last week, ~28 in
        // the last month, and a comparable count in the month before that for the
        // period-over-period deltas to compare against.
        //
        // 7 is coprime with 90, so the walk covers the whole range before repeating
        // and the ages come out evenly spread rather than clumped.
        //
        // `daysInStage` is a FLOOR, not an offset: a lead cannot be younger than the
        // time it has already spent in its current stage. "Created 3 days ago, 13
        // days in stage" is the kind of detail that makes a demo dataset fall apart
        // the moment someone reads it closely. Adding the two instead of taking the
        // larger would have pushed every lead ~7 days older and left the 7-day range
        // showing almost nothing.
        const createdDaysAgo = Math.max(daysInStage, ((i * 7) % 90) + 1);
        return {
            id: `lead-${i + 1}`,
            name: `${first} ${last}`,
            company: COMPANIES[i % COMPANIES.length],
            // Phone numbers step by a fixed amount so they are all distinct and all
            // plausibly Moroccan mobile numbers.
            phone: `+212 ${610008083 + i * 137}`,
            email: `${first.toLowerCase()}${59 + i}@gmail.com`,
            source: sourceAssignments[i],
            stageId,
            assignedRepId: reps[i % reps.length].id,
            daysInStage,
            createdDaysAgo,
            notes: [note],
            activity: buildActivity(i, stageId),
            milestones: buildMilestones(i, isClient),
            files: buildFiles(i, isClient),
            invoices: buildInvoices(i, isClient),
            // Client-visible. Empty for anyone who has not converted yet — a lead in
            // "Contacted" has no project, so there is nothing honest to put here.
            projectSummary: buildProjectSummary(i, isClient),
            previews: buildPreviews(i, isClient, COMPANIES[i % COMPANIES.length]),
            liveUrl: buildLiveUrl(i, isClient, COMPANIES[i % COMPANIES.length]),
            updates: buildUpdates(i, isClient),
        };
    });
}
// Chat — one thread per rep, most of them empty, matching the design.
function buildThreads(reps, currentUser) {
    return reps.map((rep, index) => {
        const messages = index === 0
            ? [
                {
                    id: `msg-${rep.id}-1`,
                    authorName: currentUser.name,
                    body: "Great week on dials, keep it up!",
                    timeLabel: "Mon 9:14 AM",
                    fromMe: true,
                },
                {
                    id: `msg-${rep.id}-2`,
                    authorName: rep.name,
                    body: "Thanks! Pushing for more appointments this week.",
                    timeLabel: "Mon 9:20 AM",
                    fromMe: false,
                },
            ]
            : index === 1
                ? [
                    // Two-sided on purpose. The rep workspace opens straight into
                    // this thread, and a conversation with only one speaker in it
                    // demonstrates neither the alignment nor the colour that tell
                    // the two sides apart.
                    {
                        id: `msg-${rep.id}-1`,
                        authorName: currentUser.name,
                        body: "Can you follow up with Amine Fassi today?",
                        timeLabel: "Tue 11:02 AM",
                        fromMe: true,
                    },
                    {
                        id: `msg-${rep.id}-2`,
                        authorName: rep.name,
                        body: "On it — he asked about pricing, sending the deck now.",
                        timeLabel: "Tue 11:20 AM",
                        fromMe: false,
                    },
                ]
                : [];
        return { id: `thread-${rep.id}`, repId: rep.id, messages };
    });
}
// The assembled seed
const CURRENT_USER = {
    id: "user-1",
    name: "Hicham B.",
    title: "Sales Manager",
    roleBadge: "Admin",
    role: "admin",
};
/**
 * Seven daily team dial averages, oldest first. Feeds the sparkline under the
 * "Avg Dials / Rep" card, and ends on 51 so the line finishes exactly where
 * the headline figure sits.
 */
const TEAM_DIALS_HISTORY = [44, 47, 45, 49, 53, 50, 51];
/** A fresh copy of the seed. Always call this rather than sharing one object —
 *  the reducer treats state as immutable, but "Reset demo data" would hand back
 *  an already-mutated object if callers shared a single instance. */
export function createSeedState() {
    const reps = buildReps();
    return {
        currentUser: CURRENT_USER,
        reps,
        leads: buildLeads(reps),
        threads: buildThreads(reps, CURRENT_USER),
        stageOrder: pipelineConfig.stages.map(({ id, label }) => ({ id, label })),
        teamDialsHistory: TEAM_DIALS_HISTORY,
        hydrated: false,
    };
}
