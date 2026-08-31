<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['date', 'platform', 'campaign', 'ad_set', 'creative', 'spend'])]
class AdSpend extends Model
{
    // "ad_spend" doesn't pluralize to "ad_spends" in normal usage — Eloquent's
    // auto-pluralization would guess that table name wrong otherwise.
    protected $table = 'ad_spend';

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'spend' => 'decimal:2',
        ];
    }
}
