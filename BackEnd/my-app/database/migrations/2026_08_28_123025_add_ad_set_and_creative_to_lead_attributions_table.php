<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Spec section 14 names campaign/ad_set/creative_id as attribution
     * fields. utm_campaign already covers "campaign" — only ad_set and
     * creative_id were actually missing. Every existing attribution column
     * is left untouched.
     */
    public function up(): void
    {
        Schema::table('lead_attributions', function (Blueprint $table) {
            $table->string('ad_set')->nullable()->after('utm_campaign');
            $table->string('creative_id')->nullable()->after('ad_set');
        });
    }

    public function down(): void
    {
        Schema::table('lead_attributions', function (Blueprint $table) {
            $table->dropColumn(['ad_set', 'creative_id']);
        });
    }
};
