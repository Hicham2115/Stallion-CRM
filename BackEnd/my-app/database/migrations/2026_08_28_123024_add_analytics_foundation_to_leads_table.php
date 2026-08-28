<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Every new column here is nullable and unpopulated for existing rows —
     * no fake/backfilled values. See the Prompt 3 report for exactly which
     * KPIs stay uncalculable (return null/0) until these get real data.
     */
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // Segmentation / filter dimensions (KPI spec section 1)
            $table->string('segment_community')->nullable()->after('lost_reason');
            $table->string('country')->nullable()->after('segment_community');

            // Assignment — the one sales-rep architecture, a real FK to
            // users (role=sales/admin), not a second assignment system.
            // "assigned_developers" is plural in the spec (a project can
            // have more than one dev), so that's the lead_developer pivot
            // table instead, not a column here.
            $table->foreignId('assigned_sales_id')->nullable()->after('country')
                ->constrained('users')->nullOnDelete();

            // Unit economics (spec section 5). project_delivered_date is
            // the business/financial record of delivery (settable directly);
            // delivered_at below is the precise pipeline-stage-transition
            // timestamp the Observer stamps automatically — see the Prompt 3
            // report for why both exist.
            $table->decimal('contract_value', 12, 2)->nullable();
            $table->decimal('project_cost', 12, 2)->nullable();
            $table->decimal('recurring_mrr', 12, 2)->nullable();
            $table->string('payment_schedule')->nullable();
            $table->date('contract_signed_date')->nullable();
            $table->date('project_deadline')->nullable();
            $table->date('project_delivered_date')->nullable();

            // Developer performance (spec section 8)
            $table->decimal('budgeted_hours', 8, 2)->nullable();
            $table->decimal('actual_hours', 8, 2)->nullable();
            $table->unsignedInteger('revision_count')->default(0);

            // Stage-transition timestamps identified as actually needed by
            // a KPI formula in the section 11 audit — see Lead::STAGE_TIMESTAMP_EVENTS.
            // mvp_started_at / delivery_started_at deliberately NOT added:
            // no KPI in the spec needs them.
            $table->timestamp('mvp_delivered_at')->nullable();
            $table->timestamp('lost_at')->nullable();
            $table->timestamp('delivered_at')->nullable();

            $table->index('segment_community');
            $table->index('country');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assigned_sales_id');
            $table->dropIndex(['segment_community']);
            $table->dropIndex(['country']);
            $table->dropColumn([
                'segment_community',
                'country',
                'contract_value',
                'project_cost',
                'recurring_mrr',
                'payment_schedule',
                'contract_signed_date',
                'project_deadline',
                'project_delivered_date',
                'budgeted_hours',
                'actual_hours',
                'revision_count',
                'mvp_delivered_at',
                'lost_at',
                'delivered_at',
            ]);
        });
    }
};
