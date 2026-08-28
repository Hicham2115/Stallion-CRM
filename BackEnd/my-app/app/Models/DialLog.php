<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'date', 'dial_count'])]
class DialLog extends Model
{
    // Deliberately NOT cast to 'date'. This column is only ever compared by
    // exact string equality (today's lookup key for updateOrCreate) — a
    // 'date' cast serializes back to a full "Y-m-d H:i:s" string on save,
    // which a native MySQL DATE column silently truncates but SQLite (used
    // in tests) stores verbatim, so a later `where('date', $dateOnlyString)`
    // lookup misses the row on SQLite while working "by accident" on MySQL.
    // Kept as a plain string end-to-end avoids the whole class of bug.

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
