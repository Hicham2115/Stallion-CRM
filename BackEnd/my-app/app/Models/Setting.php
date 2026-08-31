<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['setup_completed_at'])]
class Setting extends Model
{
    protected function casts(): array
    {
        return [
            'setup_completed_at' => 'datetime',
        ];
    }

    /** The one settings row, id 1 — created by its migration. firstOrCreate
     *  as a safety net, not the expected path. */
    public static function current(): self
    {
        return self::firstOrCreate(['id' => 1]);
    }
}
