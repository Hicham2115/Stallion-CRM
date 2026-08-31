<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Links a Lead to the real (role=client) User account that can sign in and
// see it on /portal — see LeadController::createPortalAccount. Nullable:
// most leads never get a portal login at all.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('client_user_id')->nullable()->after('assigned_sales_id')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('client_user_id');
        });
    }
};
