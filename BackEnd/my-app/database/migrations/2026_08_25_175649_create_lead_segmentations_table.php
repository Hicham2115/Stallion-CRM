<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_segmentations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->enum('track', ['low_ticket', 'high_ticket']);
            $table->string('product_type');
            $table->string('budget_band');
            $table->string('desired_launch');
            $table->unsignedTinyInteger('priority_score')->default(0);
            $table->timestamps();

            $table->index('priority_score');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_segmentations');
    }
};
