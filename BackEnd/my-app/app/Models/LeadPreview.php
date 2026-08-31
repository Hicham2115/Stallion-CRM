<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable(['label', 'note', 'image_path', 'url'])]
class LeadPreview extends Model
{
    protected $appends = ['image_url'];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /** Public URL for the stored screenshot, or null when this preview is link-only. */
    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? Storage::disk('public')->url($this->image_path) : null;
    }
}
