<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('email');
            $table->string('phone');
            $table->string('role')->nullable();
            $table->boolean('is_decision_maker')->default(false);
            $table->string('business_type');
            $table->string('product_type');
            $table->enum('track', ['low_ticket', 'high_ticket']);
            $table->string('budget_band');
            $table->text('need_description');
            $table->string('desired_launch');
            $table->string('brief_file_path')->nullable();
            $table->string('status')->default('new');
            $table->timestamps();

            $table->index('email');
            $table->index(['track', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
