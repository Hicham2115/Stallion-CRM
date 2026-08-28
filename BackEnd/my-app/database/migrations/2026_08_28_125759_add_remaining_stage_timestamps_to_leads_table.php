<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Prompt 4 audit (section 12 of the spec) — the three stage-transition
     * timestamps the old fallback logic was standing in for with unrelated
     * fields (consult_scheduled_for for mvp_in_progress, updated_at for
     * lost — lost_at already fixed that one in Prompt 3). No timestamp was
     * added for `new_lead` or `closing_booked`: the spec's own table gives
     * those application_completed_at/created_at and
     * closing_meeting_scheduled_for respectively — both already exist as
     * plain fields, not new stage-transition stamps.
     */
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->timestamp('consult_completed_at')->nullable()->after('consult_outcome');
            $table->timestamp('mvp_started_at')->nullable()->after('mvp_type');
            $table->timestamp('delivery_started_at')->nullable()->after('closed_at');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['consult_completed_at', 'mvp_started_at', 'delivery_started_at']);
        });
    }
};
