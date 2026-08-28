<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A second, follow-up meeting after the first consult — distinct from
     * `closing_meeting_*` (which sits later, right before `won`). Admin/
     * sales fill these in from Lead Details; nothing here is auto-stamped.
     * Kept deliberately as three plain nullable columns, no new table —
     * this is a small workflow flag, not a system that needs its own
     * lifecycle.
     */
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->boolean('needs_second_meeting')->nullable()->after('consult_completed_at');
            $table->timestamp('second_meeting_scheduled_for')->nullable()->after('needs_second_meeting');
            $table->boolean('second_meeting_outcome_good')->nullable()->after('second_meeting_scheduled_for');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['needs_second_meeting', 'second_meeting_scheduled_for', 'second_meeting_outcome_good']);
        });
    }
};
