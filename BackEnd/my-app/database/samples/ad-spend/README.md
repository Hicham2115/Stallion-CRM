# Ad Spend — sample CSVs

Drop these into **Analysis → Ad Spend → Import** to exercise the importer
without waiting for a real Meta Ads Manager export. They are QA fixtures, not
seed data: nothing loads them automatically.

## What the importer actually needs

Only two columns are **required** — a date and an amount. Everything else is
optional, and column **names and order do not need to match exactly**: headers
are matched by alias, lowercased and trimmed, with any trailing `(...)` suffix
stripped, so `Amount spent (MAD)` and `Amount spent (EUR)` and `Spend` all land
on the same field.

| Field | Accepted header spellings | Required |
| --- | --- | --- |
| `date` | `Day`, `Date`, `Reporting starts`, `Reporting start`, `Date start` | **yes** |
| `spend` | `Amount spent`, `Spend`, `Cost`, `Amount`, `Total spent` | **yes** |
| `campaign` | `Campaign name`, `Campaign` | no |
| `ad_set` | `Ad set name`, `Adset name`, `Ad set`, `Adset` | no |
| `creative` | `Ad name`, `Creative name`, `Creative`, `Ad` | no |
| `platform` | `Platform`, `Publisher platform` | no — defaults to `meta` |

Unrecognized columns are ignored, which is why the samples carry `Impressions`
and `Link clicks`: they prove a full export imports cleanly today, and neither
column is stored yet (`ad_spend` has nowhere to put them — the Acquisition
board's impressions/clicks stay `—` until there is a real Meta integration).

Amounts tolerate currency symbols and either separator convention: `1,234.56`,
`1.234,56`, `1,50` and `€ 99` all parse. Whichever of `.` or `,` comes **last**
is treated as the decimal point.

## The one thing that decides whether spend attributes to anything

**`Campaign name` must equal the `utm_campaign` on your ad links, character for
character.** There is no Meta API connection — spend is joined to a lead by
exact string match against `lead_attributions.utm_campaign` / `ad_set` /
`creative_id`, captured from the landing page's URL params.

`Spring Launch` in the CSV and `utm_campaign=spring-launch` on the link are two
different campaigns as far as this system is concerned. That is why the sample
data uses slug-style names — copy the style, and match your real UTMs.

A campaign row with a blank **Spend** or **CPL** column on the Economics tab is
almost always this, not a missing import.

## Exporting the real thing from Ads Manager

Break down by **Day** (so spend is per-date, not one lump sum) and include
Campaign name, Ad set name, Ad name and Amount spent. Export as CSV.

## The files, and exactly what each should do

Dates are 24–27 Aug 2026, so everything lands inside the screen's default
"Last 30 days" range and shows up without touching the date filter.

| File | Expect |
| --- | --- |
| `meta-ads-export.csv` | `imported: 12, skipped: 0`. Total spend **3,142.05 MAD** — `stallion-q3-webdev` 2,705.45, `stallion-q3-ecom` 436.60. |
| `meta-ads-export-corrected.csv` | `imported: 12, skipped: 0`. Still **12 rows total**, not 24. Total becomes **3,213.80 MAD**. |
| `meta-ads-export-with-bad-rows.csv` | `imported: 2, skipped: 3`, with three reasons listed on screen. Adds 465.65 MAD across two new 27 Aug rows. |

### The override test

`meta-ads-export-corrected.csv` is the **same twelve** day + campaign + ad set +
ad combinations as `meta-ads-export.csv` with restated amounts — the way Ads
Manager restates spend once billing settles. Import them in order:

1. Import `meta-ads-export.csv` → 12 rows, 3,142.05 MAD.
2. Import `meta-ads-export-corrected.csv` → **still 12 rows**, now 3,213.80 MAD.

If you end up with 24 rows or ~6,355 MAD, the dedupe is broken. Each imported
row carries a `dedupe_key` (a sha1 of date + platform + campaign + ad set +
creative) with a unique index, and the import writes through `upsert()`, so a
re-import overwrites the amount instead of adding a second row.

Re-importing `meta-ads-export.csv` afterwards puts the totals back to 3,142.05 —
the last import of a given row always wins.

### The bad-row test

`meta-ads-export-with-bad-rows.csv` is deliberately broken in three different
ways, one per row, and also drops the `Impressions`/`Link clicks` columns and
uses the bare `Amount spent` header — so it doubles as proof that a
differently-shaped export still imports.

| Row | Problem | Result |
| --- | --- | --- |
| `not-a-date,...` | unparseable date | skipped, reported |
| `...,broad-morocco,video-testimonial-a,` | empty amount | skipped, reported |
| `...,static-offer-b,-42.00` | negative amount (a refund or a broken export — never silently subtracted from CAC) | skipped, reported |

The two valid rows still import. The file also ends with a blank line, which is
what a real export does and is **not** counted as an error.
