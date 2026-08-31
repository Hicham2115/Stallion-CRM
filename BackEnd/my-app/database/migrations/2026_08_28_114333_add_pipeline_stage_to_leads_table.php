<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * `status` (gate/new, used by the entry gate + intake form today) is left
     * exactly as-is for backward compatibility — nothing reads or writes it
     * differently. `stage` is the new, official pipeline field. Existing rows
     * get `new_lead` via the column default; the explicit backfill below is
     * just belt-and-suspenders in case a row's status is ever something other
     * than gate/new by the time this runs.
     */
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('stage')->default('new_lead')->after('status');
            $table->string('lost_reason')->nullable()->after('stage');

            // Application / contact funnel
            $table->timestamp('application_started_at')->nullable();
            $table->timestamp('application_completed_at')->nullable();
            $table->timestamp('first_contact_at')->nullable();

            // Consult
            $table->timestamp('consult_booked_at')->nullable();
            $table->timestamp('consult_scheduled_for')->nullable();
            $table->boolean('consult_attended')->nullable();
            $table->string('consult_outcome')->nullable();

            // MVP
            $table->string('mvp_type')->nullable();
            $table->date('mvp_deadline')->nullable();
            $table->decimal('mvp_cost', 10, 2)->nullable();

            // Closing
            $table->timestamp('closing_meeting_scheduled_for')->nullable();
            $table->boolean('closing_meeting_attended')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->boolean('deposit_collected')->nullable();

            $table->index('stage');
        });

        DB::table('leads')
            ->whereIn('status', ['gate', 'new'])
            ->update(['stage' => 'new_lead']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex(['stage']);
            $table->dropColumn([
                'stage',
                'lost_reason',
                'application_started_at',
                'application_completed_at',
                'first_contact_at',
                'consult_booked_at',
                'consult_scheduled_for',
                'consult_attended',
                'consult_outcome',
                'mvp_type',
                'mvp_deadline',
                'mvp_cost',
                'closing_meeting_scheduled_for',
                'closing_meeting_attended',
                'closed_at',
                'deposit_collected',
            ]);
        });
    }
};
