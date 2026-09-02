# Ad Spend Import + Economics Tab

## What this is, in plain terms

We need two things added to the CRM:

1. **An Ad Spend upload page in Settings.** A place to upload a CSV (exported from Meta Ads Manager — campaign name, ad set, date, amount spent). It reads the rows and saves them to the database.
2. **An Economics tab in Reports.** Shows CAC (cost per customer), cost per lead, and a table of campaign performance — leads, spend, deals won, revenue per campaign.

**Why:** right now the CRM shows how many leads came in, but not what they cost or which campaigns actually make money. This connects ad spend to the pipeline so you get real cost-per-lead / cost-per-customer / campaign ROI numbers instead of just lead counts.

**Important — this is mostly wiring, not new math.** The KPI calculations already exist and are correct — `app/Services/KpiService.php` computes CAC, cost-per-lead, campaign/creative performance, gross margin, MRR, LTV, all of it. `GET /api/analytics/kpis` already returns the full payload. Nobody has built a screen that shows it — Reports currently only shows 4 basic numbers computed a completely different, simpler way, client-side. Don't touch `KpiService`'s math unless you find an actual bug in it.

**One gotcha to know going in:** ad spend is matched to leads by exact campaign/ad-set/creative **name matching** — there's no real API connection to the Meta ad account, just string equality between `ad_spend.campaign` and `lead_attributions.utm_campaign` (auto-captured from the landing page's URL params). So the campaign names in the uploaded CSV need to match the campaign names used in the ad links, or spend just won't attribute to those leads. This is documented, expected behavior in `KpiService`, not a bug to "fix."

---

## The prompt to hand to Claude Code (or any coding agent)

Paste everything below this line into a fresh agent session in this repo.

---

### Task: Ad Spend import + Economics tab in Reports (Stallion CRM)

#### Context you need before touching anything

This is a Laravel 13 (`BackEnd/my-app`) + Next.js (`FrontEnd/my-app`) CRM. Auth is Sanctum bearer tokens in `Authorization` headers (no cookies) — every admin-only frontend call already goes through `lib/axios.js`'s `api` instance and `role:admin` middleware on the backend.

**The KPI math already exists and is correct.** `app/Services/KpiService.php` computes CAC, cost-per-lead, campaign/creative performance, gross margin, MRR, LTV — all of it — and `GET /api/analytics/kpis` (`AnalyticsController::kpis`) already returns the full payload (`{ acquisition, middle_funnel, bottom_funnel, economics, sales, developers, timing, funnel, campaigns, creatives }`). **Nothing in Reports currently calls this endpoint** — `FrontEnd/my-app/app/(console)/admin/reports/reports-view.jsx` computes 4 basic metrics client-side from raw `/api/leads` data instead (see `config/pipeline-live.js`'s `liveKpisOf`). Do not touch KpiService's math — it's tested and correct. Your job is (a) get real spend data into the `ad_spend` table, and (b) render what the endpoint already returns.

**Critical limitation to preserve, not "fix":** ad spend has no real join key to a lead. `KpiService` matches spend to leads by **exact string equality** between `ad_spend.campaign`/`ad_set`/`creative` and `lead_attributions.utm_campaign`/`ad_set`/`creative_id` (auto-captured from the public intake form's URL params). There is no Meta Ads API integration. This means CSV campaign/ad set/creative names must match the UTM values used in ad links, or spend just won't attribute — that's documented, expected behavior (`KpiService::campaignPerformance()`'s doc comment), not a bug to solve here.

#### Existing pieces to reuse (read these first)

- `BackEnd/my-app/app/Models/AdSpend.php` — model already exists. Table `ad_spend`, fillable: `date, platform, campaign, ad_set, creative, spend`. `spend` is `decimal:2`, `date` is a date cast.
- `BackEnd/my-app/database/migrations/2026_08_28_123027_create_ad_spend_table.php` — schema already exists, do not re-migrate.
- **There is currently NO controller, NO routes, and NO frontend anywhere for AdSpend.** You're building this from scratch.
- `BackEnd/my-app/app/Http/Controllers/LeadController.php`'s `store()` method — reference for handling a multipart file upload in this codebase's style (`$request->file(...)`, transactions, validation patterns).
- `BackEnd/my-app/app/Services/KpiService.php` — read `economics()`, `campaignPerformance()`, `creativePerformance()`, and `adSpendTotal()`/`spendGroupedBy()` to understand exactly how `ad_spend` rows get consumed. Don't change this file unless you find an actual bug.
- `FrontEnd/my-app/components/admin/settings/create-account-panel.jsx` and `reps-panel.jsx` — the exact UI pattern to mirror for a new Settings panel (Panel/PanelHeader/PanelBody from `components/deck/panel.jsx`, tanstack-query `useMutation`/`useQuery`, `toast` from sonner, field styling from `components/deck/field.js`'s `fieldBase`/`fieldLabel`/`fieldErrorText`).
- `FrontEnd/my-app/app/(console)/admin/settings/page.jsx` — where the new panel gets added, gated by a new `settingsConfig.features.adSpend` flag (mirror the existing `features.*` pattern in `config/settings.js`).
- `FrontEnd/my-app/lib/export.js` — CSV **export** utility (RFC 4180 escaping, BOM for Excel). Not directly reusable for import, but match its no-external-library philosophy: don't add a CSV parsing npm package for this if it can reasonably be avoided.
- `FrontEnd/my-app/app/(console)/admin/reports/reports-view.jsx` and `FrontEnd/my-app/config/reports.js` — current Reports page. You're adding a second tab/section here, not replacing the existing one.
- `FrontEnd/my-app/components/admin/dashboard/kpi-card.jsx` — existing KPI tile component, reuse for the Economics tab's CAC/LTV/margin/MRR tiles rather than building new ones.
- `FrontEnd/my-app/lib/format.js` — has `formatCurrency`; use it for every money value, and note the whole app defaults to EUR (`config/admin.js`'s `currency`).
- `FrontEnd/my-app/lib/get-error-message.js` — standard axios error → toast message helper, used everywhere.

#### Part 1 — Backend: `AdSpendController`

Create `app/Http/Controllers/AdSpendController.php` with:

- `index(Request $request)` — list ad spend rows, newest `date` first, paginated or simply capped/ordered (match whatever's simplest given existing list endpoints like `UserController::index`).
- `store(Request $request)` — accepts a multipart file upload (field name `file`), parses it as CSV **server-side** using PHP's built-in `fgetcsv()` / `str_getcsv()` (no Composer package — mirror the frontend's "no library needed" philosophy).
  - **Header mapping must be flexible, not exact-match.** A Meta Ads Manager export's columns are commonly `Day` / `Date`, `Campaign name`, `Ad set name`, `Ad name`, `Amount spent (EUR)` / `Amount spent` — normalize headers (lowercase, trim, strip currency suffix) and map to `date, campaign, ad_set, creative, spend`. Make `platform` default to `'meta'` if not present as a column.
  - Validate each row: `date` parses to a real date, `spend` parses to a non-negative decimal. Skip rows that don't (don't fail the whole import over one bad row) and return a summary in the response: `{ imported: N, skipped: N, errors: [...] }` — mirror `LeadController::store`'s "best-effort, never block on one bad piece" philosophy (see its `brief_file` handling for the exact pattern of catching and continuing rather than failing the whole request).
  - Wrap the insert in a `DB::transaction()`. Bulk insert for performance on larger CSVs rather than one `AdSpend::create()` per row.
  - **Decide and document**: does re-uploading the same CSV create duplicate rows, or should there be some dedupe key (e.g. `date + campaign + ad_set + creative` unique)? Recommend adding a unique constraint on that tuple and using `upsert()`, so re-uploading an updated/corrected export doesn't double-count spend. Flag this decision in your PR description if you deviate.
- `destroy(AdSpend $adSpend)` — delete one row (for fixing a bad import without re-uploading everything).
- Consider also a `destroyAll` / "clear all ad spend" action for when someone uploads garbage and wants to start over — optional, use your judgment.

Add routes in `routes/api.php`, admin-only, following the exact existing pattern right next to the `/users` routes:
```php
Route::get('/ad-spend', [AdSpendController::class, 'index'])->middleware(['auth:sanctum', 'role:admin']);
Route::post('/ad-spend/import', [AdSpendController::class, 'store'])->middleware(['auth:sanctum', 'role:admin']);
Route::delete('/ad-spend/{adSpend}', [AdSpendController::class, 'destroy'])->middleware(['auth:sanctum', 'role:admin']);
```

Write feature tests under `tests/Feature/` (there's an existing `AnalyticsKpiTest.php` and `LeadWorkflowTest.php` to match style/conventions) covering: valid CSV imports correctly, malformed rows get skipped not fatal, non-admin gets 403, unauthenticated gets 401.

#### Part 2 — Frontend: "Ad Spend" panel in Settings

- New component `components/admin/settings/ad-spend-panel.jsx`, added to `app/(console)/admin/settings/page.jsx` behind a new `settingsConfig.features.adSpend` flag (default `true`).
- UI: a file input (`accept=".csv"`) + upload button, a `useMutation` posting `FormData` to `/api/ad-spend/import`, `toast.success`/`toast.error` on result showing the `{imported, skipped}` summary. Below it, a table of existing ad spend rows (`useQuery` on `/api/ad-spend`) with a delete action per row — mirror `reps-panel.jsx`'s `DataTable`/`DataRow`/`DataCell` usage exactly.
- On successful import, `queryClient.invalidateQueries` for both the ad-spend list and (important) the `analytics`/`kpis` query key, so Reports reflects new spend immediately without a manual refresh.
- No client-side CSV parsing needed — just upload the raw file, let the backend do the parsing/validation.

#### Part 3 — Frontend: "Economics" tab in Reports

- `FrontEnd/my-app/app/(console)/admin/reports/reports-view.jsx` currently has no tabs — add one using `components/ui/tabs.jsx` (already in the codebase, shadcn-based) with two tabs: the existing content (keep as-is, maybe label it "Overview") and a new "Economics" tab.
- Economics tab: a `useQuery` hitting `GET /api/analytics/kpis` (reuse the same date-range state already in `reports-view.jsx` — pass `date_from`/`date_to` matching whatever range is selected in the existing `ReportToolbar`).
- Render, using the existing `KpiCard` component:
  - `economics.cac`, `economics.ltv`, `economics.ltv_cac`, `economics.gross_profit`, `economics.gross_margin` (as %), `economics.mrr`, `economics.revenue`.
  - **Handle `null` correctly** — `KpiService` deliberately returns `null` (not 0) for CAC/LTV when there's no ad spend or `EXPECTED_RETENTION_MONTHS` isn't configured (see `economics().ltv_note` in the API response — surface that note in the UI, e.g. a small inline hint, when `ltv` is null). Render `null` as "—", never as "€0" or "0%" — a real zero and "no data" must look different, exactly like the rest of this app already does (see `KpiCard`'s existing null handling for the `impressions`/`clicks` fields as a reference).
- A campaign performance table (from `campaigns` array in the response): columns `campaign, leads, spend, cpl, consults, won, revenue`. Same null-as-"—" rule for `spend`/`cpl` when a campaign has no matching ad_spend rows (this will happen — it's the naming-mismatch caveat above, not a bug).
- A creative performance table (from `creatives` array), same shape plus `ad_set`.
- Add the corresponding copy strings to `config/reports.js` following its existing `content` object pattern rather than hardcoding strings in the component.

#### Acceptance checklist

- [ ] Uploading a real Meta Ads Manager CSV export (day-broken-down, with campaign/ad set/ad name/amount spent columns) succeeds and rows appear in the Settings list.
- [ ] A CSV with one bad row (missing spend, garbage date) imports the good rows and reports the bad one, doesn't 500 or reject the whole file.
- [ ] Re-uploading the same file doesn't silently double every spend number (decide + implement the dedupe behavior above).
- [ ] Economics tab shows real, non-null CAC/CPL once spend + a won deal with `contract_value` exist, and shows "—" (not "€0") when data's missing.
- [ ] Campaign performance table's `spend`/`cpl` populate only for campaigns whose name exactly matches an `ad_spend.campaign` value — confirm this against a real UTM-tagged test lead + a matching ad_spend row.
- [ ] Non-admin users get 403 from every new `/api/ad-spend/*` route; the Settings panel and Reports tab are both admin-gated in the UI too (`useSession()` role check, matching the rest of the console).

---

## What to export from Meta Ads Manager for testing

In Meta Ads Manager, when customizing columns (or building a Report):

**Required:**
- Campaign name
- Ad set name
- Ad name
- Amount spent
- Day (as the breakdown — so spend is split per date, not one lump sum)

**Nice to have (fills in the Acquisition board later — impressions/clicks currently show "—" in the app):**
- Impressions
- Link clicks (or just Clicks)
- CPC (cost per click)
- CPM

Export as CSV — column names/order don't need to match exactly, the importer just needs those pieces of data present.
