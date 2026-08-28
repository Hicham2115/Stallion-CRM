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

        // Enum columns via ->change() are unreliable on mysql across
        // Laravel/Doctrine versions, hence the raw statement — but that
        // exact syntax is mysql-only and breaks the sqlite connection tests
        // run on (phpunit.xml). sqlite has no real ENUM type regardless
        // (Schema::enum() there is just a plain column), so ->change() is
        // both correct and safe on that driver.
        if (DB::connection()->getDriverName() === 'sqlite') {
            Schema::table('leads', function (Blueprint $table) {
                $table->enum('track', ['low_ticket', 'high_ticket'])->nullable()->change();
            });
        } else {
            DB::statement("ALTER TABLE leads MODIFY track ENUM('low_ticket', 'high_ticket') NULL");
        }
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

        if (DB::connection()->getDriverName() === 'sqlite') {
            Schema::table('leads', function (Blueprint $table) {
                $table->enum('track', ['low_ticket', 'high_ticket'])->nullable(false)->change();
            });
        } else {
            DB::statement("ALTER TABLE leads MODIFY track ENUM('low_ticket', 'high_ticket') NOT NULL");
        }
    }
};
