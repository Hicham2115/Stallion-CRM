<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The dev workspace's "Project Steps" — real now, previously local-only
// (see lib/crm-api.js's addMilestone/updateMilestone on the frontend).
// `status` is a plain string ("done"/"pending"/"in_progress") re-derived
// app-side after every write, same rule as the frontend's
// normalizeMilestones() — never set by a client request directly.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('status')->default('pending');
            $table->date('target_date')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['lead_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_milestones');
    }
};
