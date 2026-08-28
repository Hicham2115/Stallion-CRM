<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Minimum structure for manual/imported ad spend (spec section 6 — no
     * Meta API integration here). campaign/ad_set/creative are plain strings
     * matched by value against lead_attributions' utm_campaign/ad_set/
     * creative_id — there's no ads-platform lead id to join on yet, so
     * string matching is the realistic join key until a real integration
     * exists.
     */
    public function up(): void
    {
        Schema::create('ad_spend', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('platform')->nullable();
            $table->string('campaign')->nullable();
            $table->string('ad_set')->nullable();
            $table->string('creative')->nullable();
            $table->decimal('spend', 10, 2);
            $table->timestamps();

            $table->index('date');
            $table->index('campaign');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_spend');
    }
};
