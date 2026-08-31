<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A simple append-only audit trail — one row every time a lead's stage
     * changes (written by LeadObserver::saved(), never edited). Distinct
     * from Lead::STAGE_TIMESTAMP_EVENTS (a handful of "first time entered"
     * columns on `leads`, used by KPI formulas): this table is the full
     * history, including repeat visits to a stage, kept for a human to read
     * on the Lead Details screen — not consumed by any KPI.
     */
    public function up(): void
    {
        Schema::create('lead_stage_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->string('stage');
            $table->timestamp('entered_at');
            $table->timestamps();

            $table->index(['lead_id', 'entered_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_stage_history');
    }
};
