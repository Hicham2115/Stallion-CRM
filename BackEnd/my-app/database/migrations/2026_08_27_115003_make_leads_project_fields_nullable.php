<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('phone')->nullable()->change();
            $table->string('business_type')->nullable()->change();
            $table->string('product_type')->nullable()->change();
            $table->string('budget_band')->nullable()->change();
            $table->text('need_description')->nullable()->change();
            $table->string('desired_launch')->nullable()->change();
        });

        // Enum columns via ->change() are unreliable across Laravel/Doctrine versions.
        DB::statement("ALTER TABLE leads MODIFY track ENUM('low_ticket', 'high_ticket') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('phone')->nullable(false)->change();
            $table->string('business_type')->nullable(false)->change();
            $table->string('product_type')->nullable(false)->change();
            $table->string('budget_band')->nullable(false)->change();
            $table->text('need_description')->nullable(false)->change();
            $table->string('desired_launch')->nullable(false)->change();
        });

        DB::statement("ALTER TABLE leads MODIFY track ENUM('low_ticket', 'high_ticket') NOT NULL");
    }
};
