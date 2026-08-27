<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'lead_id',
    'track',
    'product_type',
    'budget_band',
    'desired_launch',
    'priority_score',
])]
class LeadSegmentation extends Model
{
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
