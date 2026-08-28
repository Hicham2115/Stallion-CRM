<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['lead_id', 'stage', 'entered_at'])]
class LeadStageHistory extends Model
{
    // Eloquent's auto-pluralization would guess "lead_stage_histories"
    // ("history" -> "histories"); the migration created the plain plural.
    protected $table = 'lead_stage_history';

    protected function casts(): array
    {
        return [
            'entered_at' => 'datetime',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
