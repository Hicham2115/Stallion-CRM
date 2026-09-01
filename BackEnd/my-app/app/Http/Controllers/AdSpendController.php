<?php

namespace App\Http\Controllers;

use App\Models\AdSpend;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * ============================================================================
 *  AD SPEND IMPORT — the numbers behind every cost figure in Analysis
 * ============================================================================
 *  Reads a Meta Ads Manager CSV export into the `ad_spend` table, which is
 *  the ONLY source of spend for KpiService (CAC, CPL, campaign/creative
 *  cost). Without rows here every cost metric is null — deliberately, see
 *  KpiService's NULL VS ZERO note.
 *
 *  HOW SPEND REACHES A LEAD (read this before debugging a "missing" cost):
 *  there is no Meta API integration and no ad-platform id on a lead. Spend
 *  is attributed by EXACT STRING EQUALITY between the `campaign`/`ad_set`/
 *  `creative` stored here and `lead_attributions.utm_campaign`/`ad_set`/
 *  `creative_id`, which the public intake form captures from the landing
 *  page's URL params. A campaign named "Spring Launch" in the CSV and
 *  utm_campaign=spring-launch on the ad link are two different campaigns as
 *  far as this system is concerned. That is documented, expected behaviour
 *  (see KpiService::campaignPerformance()), not a bug — which is why nothing
 *  here "helpfully" lowercases or slugifies a name on the way in.
 *
 *  RE-UPLOADING IS SAFE. Every imported row carries a sha1 `dedupe_key` over
 *  (date, platform, campaign, ad_set, creative) and is written with upsert(),
 *  so re-importing a corrected export overwrites the matching rows instead of
 *  doubling the spend. See the dedupe_key migration for why it is a hash
 *  column and not a composite unique index.
 * ============================================================================
 */
class AdSpendController extends Controller
{
    /** Rows returned by index(). The table is an audit of what was imported,
     *  not a report — the report is /api/analytics/kpis. */
    public const LIST_LIMIT = 500;

    /** Hard ceiling on rows read from one upload, so a runaway file cannot
     *  exhaust memory. A day-broken-down month of a few hundred ads is well
     *  under this. */
    public const MAX_ROWS = 20000;

    /** Bad rows are all counted, but only this many are described back — the
     *  response feeds a toast, not a log file. */
    public const MAX_REPORTED_ERRORS = 20;

    /** Meta is the only platform anyone exports from today; a file with no
     *  platform column gets this rather than a null that would split the
     *  dedupe key. */
    public const DEFAULT_PLATFORM = 'meta';

    /**
     * Normalized header text => our column. Ads Manager lets you rename and
     * reorder columns freely, so matching is by alias, never by position.
     * Add a spelling here rather than asking someone to edit their export.
     */
    private const HEADER_ALIASES = [
        'date' => ['day', 'date', 'reporting starts', 'reporting start', 'date start'],
        'campaign' => ['campaign name', 'campaign'],
        'ad_set' => ['ad set name', 'adset name', 'ad set', 'adset', 'ad_set'],
        'creative' => ['ad name', 'creative name', 'creative', 'ad'],
        'spend' => ['amount spent', 'spend', 'cost', 'amount', 'total spent'],
        'platform' => ['platform', 'publisher platform'],
    ];

    /** Without these two a row cannot say anything at all. */
    private const REQUIRED_COLUMNS = ['date', 'spend'];

    public function index()
    {
        return response()->json([
            'data' => AdSpend::query()
                ->orderByDesc('date')
                ->orderBy('campaign')
                ->orderByDesc('id')
                ->limit(self::LIST_LIMIT)
                ->get(['id', 'date', 'platform', 'campaign', 'ad_set', 'creative', 'spend']),
            // So the panel can say "the latest 500 of 1,240" instead of
            // implying the list is everything there is.
            'total' => AdSpend::count(),
            'limit' => self::LIST_LIMIT,
        ]);
    }

    /**
     * Import a CSV. Best-effort per row, mirroring LeadController::store's
     * brief_file handling: one unparseable line must not throw away the
     * other three hundred. Only a problem with the FILE (unreadable, empty,
     * missing a required column) is fatal, because that is the only kind the
     * uploader can actually act on.
     */
    public function store(Request $request)
    {
        $request->validate([
            // mimes + max are the real guard on this endpoint: it accepts an
            // arbitrary file off the network and reads every line of it.
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $file = $request->file('file');

        if (! $file->isValid()) {
            throw ValidationException::withMessages([
                'file' => 'The upload did not complete. Please try again.',
            ]);
        }

        $handle = fopen($file->getRealPath(), 'r');

        if ($handle === false) {
            throw ValidationException::withMessages([
                'file' => 'The uploaded file could not be read.',
            ]);
        }

        try {
            [$rows, $skipped, $errors] = $this->parse($handle);
        } finally {
            fclose($handle);
        }

        // upsert() writes through the query builder, so it does not fill
        // timestamps the way create() would — they are set per row in
        // parse().
        DB::transaction(function () use ($rows) {
            foreach (array_chunk($rows, 500) as $chunk) {
                // Only `spend` can change on a re-import: every other column
                // is part of the dedupe key, so a row that matched already
                // has them.
                AdSpend::upsert($chunk, ['dedupe_key'], ['spend', 'updated_at']);
            }
        });

        return response()->json([
            'imported' => count($rows),
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, self::MAX_REPORTED_ERRORS),
        ]);
    }

    /** Remove one row — fixing a single bad line without re-uploading. */
    public function destroy(AdSpend $adSpend)
    {
        $adSpend->delete();

        return response()->json(['id' => $adSpend->id]);
    }

    /**
     * Start over. Not merely a convenience: a CSV imported with the wrong
     * campaign names still counts toward adSpendTotal(), so it inflates CAC
     * for that date range while attributing to no campaign at all. Deleting
     * those rows one at a time is the only other way back, and re-importing
     * cannot help because the bad rows have different dedupe keys. Confirmed
     * behind a dialog in the UI.
     */
    public function destroyAll()
    {
        return response()->json(['deleted' => AdSpend::query()->delete()]);
    }

    // ── PARSING ──────────────────────────────────────────────────────────

    /**
     * @param  resource  $handle
     * @return array{0: list<array<string, mixed>>, 1: int, 2: list<string>}
     *                                                                      [rows ready to upsert, rows skipped, human-readable reasons]
     */
    private function parse($handle): array
    {
        $header = $this->readRecord($handle);

        if ($header === null) {
            throw ValidationException::withMessages(['file' => 'That file is empty.']);
        }

        $map = $this->mapHeader($header);

        foreach (self::REQUIRED_COLUMNS as $column) {
            if (isset($map[$column])) {
                continue;
            }

            throw ValidationException::withMessages([
                'file' => sprintf(
                    'No %s column found. Re-export from Ads Manager including one of: %s.',
                    $column,
                    implode(', ', self::HEADER_ALIASES[$column]),
                ),
            ]);
        }

        $rows = [];
        $skipped = 0;
        $errors = [];
        $line = 1;
        $now = now();

        while (($record = $this->readRecord($handle)) !== null) {
            $line++;

            if (count($rows) >= self::MAX_ROWS) {
                $errors[] = sprintf('Stopped at row %d — one import is capped at %d rows.', $line, self::MAX_ROWS);
                break;
            }

            // Exports commonly end with a blank line, and some carry a blank
            // separator before a totals row. Neither is an error.
            if ($this->isBlank($record)) {
                continue;
            }

            $date = $this->parseDate($this->cell($record, $map, 'date'));

            if ($date === null) {
                $skipped++;
                $errors[] = sprintf('Row %d skipped: "%s" is not a date.', $line, $this->cell($record, $map, 'date'));

                continue;
            }

            $spend = $this->parseAmount($this->cell($record, $map, 'spend'));

            if ($spend === null) {
                $skipped++;
                $errors[] = sprintf('Row %d skipped: "%s" is not an amount.', $line, $this->cell($record, $map, 'spend'));

                continue;
            }

            $platform = $this->cell($record, $map, 'platform') ?: self::DEFAULT_PLATFORM;
            $campaign = $this->cell($record, $map, 'campaign') ?: null;
            $adSet = $this->cell($record, $map, 'ad_set') ?: null;
            $creative = $this->cell($record, $map, 'creative') ?: null;

            $key = sha1(implode("\0", [$date, $platform, $campaign ?? '', $adSet ?? '', $creative ?? '']));

            // The same tuple twice in ONE file means the export carries a
            // breakdown this table does not model (placement, age, device),
            // so the day's real spend for that ad is the sum of its parts.
            // Across two files the later upload REPLACES the value instead —
            // there it means "here is a corrected figure", not "here is
            // another slice of the same day".
            if (isset($rows[$key])) {
                $rows[$key]['spend'] += $spend;

                continue;
            }

            $rows[$key] = [
                'dedupe_key' => $key,
                'date' => $date,
                'platform' => $platform,
                'campaign' => $campaign,
                'ad_set' => $adSet,
                'creative' => $creative,
                'spend' => $spend,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        return [array_values($rows), $skipped, $errors];
    }

    /**
     * One CSV record, or null at end of file.
     *
     * `escape` is passed as "" on purpose: PHP's default backslash escaping
     * is not RFC 4180 and is deprecated as of 8.4. Left at the default, a
     * campaign name ending in a backslash would swallow the next column.
     *
     * @param  resource  $handle
     * @return list<string|null>|null
     */
    private function readRecord($handle): ?array
    {
        $record = fgetcsv($handle, 0, ',', '"', '');

        return $record === false ? null : $record;
    }

    /** @param  list<string|null>  $record */
    private function isBlank(array $record): bool
    {
        foreach ($record as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * Header text => column index, for the columns we recognize.
     *
     * @param  list<string|null>  $header
     * @return array<string, int>
     */
    private function mapHeader(array $header): array
    {
        $map = [];

        foreach ($header as $index => $label) {
            $normalized = $this->normalizeHeader((string) $label);

            if ($normalized === '') {
                continue;
            }

            foreach (self::HEADER_ALIASES as $column => $aliases) {
                // First matching column wins: a file carrying both "Amount
                // spent (EUR)" and "Amount spent (USD)" is ambiguous, and
                // quietly taking the last one would be a silent currency swap.
                if (isset($map[$column]) || ! in_array($normalized, $aliases, true)) {
                    continue;
                }

                $map[$column] = $index;
            }
        }

        return $map;
    }

    /**
     * "Amount spent (EUR)" => "amount spent". Strips the UTF-8 BOM Excel
     * writes onto the first cell, drops the currency/unit suffix Ads Manager
     * appends in brackets, and collapses whitespace.
     */
    private function normalizeHeader(string $label): string
    {
        $label = preg_replace('/^\xEF\xBB\xBF/', '', $label);
        $label = preg_replace('/\s*[\(\[][^\)\]]*[\)\]]\s*$/u', '', (string) $label);
        $label = preg_replace('/\s+/u', ' ', (string) $label);

        return mb_strtolower(trim((string) $label));
    }

    /**
     * A trimmed cell, or '' when the column is absent or the row is short.
     *
     * @param  list<string|null>  $record
     * @param  array<string, int>  $map
     */
    private function cell(array $record, array $map, string $column): string
    {
        if (! isset($map[$column])) {
            return '';
        }

        return trim((string) ($record[$map[$column]] ?? ''));
    }

    /**
     * A Y-m-d date string, or null if the value is not a date.
     *
     * Y-m-d is tried strictly first because that is what Ads Manager's "Day"
     * breakdown exports and it is the one unambiguous format. Anything else
     * falls through to Carbon, which reads a bare "01/08/2026" as US
     * month-first — accepted rather than second-guessed, since nothing in the
     * file says which convention wrote it and a guess would silently move
     * spend by months.
     */
    private function parseDate(string $value): ?string
    {
        if ($value === '') {
            return null;
        }

        try {
            // Carbon THROWS on a value that does not match the format — it
            // does not return false the way PHP's DateTime does. Without this
            // catch, one "Campaign name" in the date column would 500 the
            // whole import instead of skipping one row.
            $strict = CarbonImmutable::createFromFormat('!Y-m-d', $value);

            if ($strict !== false && $strict->format('Y-m-d') === $value) {
                return $value;
            }
        } catch (\Throwable) {
            // Not ISO — fall through to the permissive parse.
        }

        try {
            return CarbonImmutable::parse($value)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * A non-negative amount, or null if the value is not one.
     *
     * Separators are resolved by POSITION, not by locale: whichever of "." or
     * "," appears last is the decimal point and the other groups thousands,
     * so "1.234,56" and "1,234.56" both read as 1234.56. A lone "," followed
     * by exactly two digits is a decimal comma ("1,50"); otherwise it groups
     * ("1,500"). A lone "." stays a decimal point, which is what an
     * English-language Ads Manager export writes.
     */
    private function parseAmount(string $value): ?float
    {
        // Currency symbols, codes and non-breaking spaces all turn up in real
        // exports.
        $cleaned = preg_replace('/[^\d.,\-]/u', '', $value);

        if ($cleaned === null || $cleaned === '') {
            return null;
        }

        $lastDot = strrpos($cleaned, '.');
        $lastComma = strrpos($cleaned, ',');

        if ($lastDot !== false && $lastComma !== false) {
            $decimal = $lastDot > $lastComma ? '.' : ',';
            $cleaned = str_replace($decimal === '.' ? ',' : '.', '', $cleaned);
            $cleaned = str_replace($decimal, '.', $cleaned);
        } elseif ($lastComma !== false) {
            $isDecimalComma = substr_count($cleaned, ',') === 1
                && preg_match('/,\d{2}$/', $cleaned) === 1;
            $cleaned = $isDecimalComma
                ? str_replace(',', '.', $cleaned)
                : str_replace(',', '', $cleaned);
        }

        if (! is_numeric($cleaned)) {
            return null;
        }

        $amount = (float) $cleaned;

        // A negative spend is a refund or a broken export; either way it is
        // not something to silently subtract from CAC.
        if ($amount < 0 || ! is_finite($amount)) {
            return null;
        }

        return round($amount, 2);
    }
}
