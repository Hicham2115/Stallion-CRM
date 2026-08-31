<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// One row, id 1, forever — see App\Models\Setting::current(). Tracks
// whether first-run setup (SetupController) has replaced the seeded demo
// admin with a real one yet.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->timestamp('setup_completed_at')->nullable();
            $table->timestamps();
        });

        DB::table('settings')->insert([
            'id' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
