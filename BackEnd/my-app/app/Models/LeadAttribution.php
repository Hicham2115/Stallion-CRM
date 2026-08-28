<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'lead_id',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'ad_set',
    'creative_id',
    'utm_content',
    'utm_term',
    'gclid',
    'fbclid',
    'referrer',
    'landing_page',
])]
class LeadAttribution extends Model
{
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
