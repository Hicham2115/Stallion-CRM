<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

// `dedupe_key` is written only by AdSpendController's importer (a sha1 of the
// tuple that makes a re-upload overwrite rather than double). It is fillable
// so a direct create() cannot silently drop it and produce a duplicate row.
#[Fillable(['date', 'platform', 'campaign', 'ad_set', 'creative', 'spend', 'dedupe_key'])]
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
