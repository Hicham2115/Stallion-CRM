<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Real dial tracking — a rep types in their own count for the day
     * (there's no phone-system integration to read this from). One row per
     * user per calendar day, upserted, not appended to — "how many did I
     * do today" is a single number a rep corrects through the day, not a
     * log of individual calls.
     */
    public function up(): void
    {
        Schema::create('dial_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('dial_count')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dial_logs');
    }
};
