<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Makes the CSV import idempotent (AdSpendController::store).
 *
 * WHY A HASH COLUMN RATHER THAN A COMPOSITE UNIQUE INDEX on
 * (date, platform, campaign, ad_set, creative), which is the obvious shape:
 *
 *  1. NULLs never compare equal in a unique index — on MySQL, SQLite and
 *     Postgres alike. A composite index would therefore let a row with no
 *     ad_set (or no creative) be inserted over and over, and those are
 *     exactly the rows a hand-trimmed export produces. The dedupe would work
 *     for tidy files and silently fail for messy ones, which is worse than
 *     not having it.
 *  2. MySQL caps an index at 3072 bytes. Four utf8mb4 varchar(255) columns
 *     are ~4080 bytes on their own, so that index would not build on the
 *     production connection (.env.example is mysql) even though it builds
 *     fine on the sqlite connection the tests use.
 *
 * A sha1 of the normalized tuple is 40 ASCII chars, never null, and behaves
 * identically on every driver. AdSpendController computes it — nothing else
 * writes this column.
 *
 * Nullable on purpose: rows created directly (tests, seeders, a manual
 * insert) leave it null, and multiple nulls are allowed by every driver, so
 * this migration cannot break an existing row. Only imported rows carry one,
 * and only imported rows are deduped.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ad_spend', function (Blueprint $table) {
            $table->char('dedupe_key', 40)->nullable()->after('id');
            $table->unique('dedupe_key');
        });
    }

    public function down(): void
    {
        Schema::table('ad_spend', function (Blueprint $table) {
            $table->dropUnique(['dedupe_key']);
            $table->dropColumn('dedupe_key');
        });
    }
};
