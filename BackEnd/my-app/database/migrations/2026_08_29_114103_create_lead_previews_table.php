<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Screenshots/links a developer shares with the client — real file storage
// (storage/app/public, same disk LeadController already uses for
// brief_file_path) instead of a base64 data URL in the browser.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_previews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('note')->nullable();
            $table->string('image_path')->nullable();
            $table->string('url')->nullable();
            $table->timestamps();

            $table->index('lead_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_previews');
    }
};
