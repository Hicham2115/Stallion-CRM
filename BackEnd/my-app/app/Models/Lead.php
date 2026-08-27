<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'full_name',
    'email',
    'phone',
    'role',
    'is_decision_maker',
    'business_type',
    'product_type',
    'track',
    'budget_band',
    'need_description',
    'desired_launch',
    'brief_file_path',
    'status',
])]
class Lead extends Model
{
    protected function casts(): array
    {
        return [
            'is_decision_maker' => 'boolean',
        ];
    }

    public function attribution(): HasOne
    {
        return $this->hasOne(LeadAttribution::class);
    }

    public function segmentation(): HasOne
    {
        return $this->hasOne(LeadSegmentation::class);
    }
}
