<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * "assigned_developers" (spec section 5/8) is plural — a project can
     * have more than one developer — so this is a pivot, not a single FK
     * column on leads the way assigned_sales_id is.
     */
    public function up(): void
    {
        Schema::create('lead_developer', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['lead_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_developer');
    }
};
