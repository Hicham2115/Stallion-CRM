<?php

namespace Database\Factories;

use App\Models\Lead;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    protected $model = Lead::class;

    public function definition(): array
    {
        return [
            'full_name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'is_decision_maker' => true,
            'business_type' => 'agency',
            'product_type' => 'crm',
            'track' => 'low_ticket',
            'budget_band' => '5-15k',
            'need_description' => fake()->sentence(),
            'desired_launch' => '1-3mo',
            'status' => 'new',
            'stage' => 'new_lead',
        ];
    }
}
