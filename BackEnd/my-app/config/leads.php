<?php

return [

    /*
     * Mirrors FrontEnd/my-app/lib/validations/lead.js — keep both in sync.
     */

    'product_types' => [
        'static_website',
        'online_store',
        'crm',
        'platform',
        'mobile_app',
        'saas',
    ],

    'low_ticket_product_types' => ['static_website', 'online_store', 'crm'],

    'budget_bands' => ['<5k', '5-15k', '15-40k', '40-80k', '80-200k', '200k+'],

    'budget_bands_by_track' => [
        'low_ticket' => ['<5k', '5-15k', '15-40k', '40-80k'],
        'high_ticket' => ['15-40k', '40-80k', '80-200k', '200k+'],
    ],

    'desired_launch_options' => ['asap', '1-3mo', '3-6mo', '6mo+', 'exploring'],

    /*
     * The one official pipeline. Every lead/opportunity moves through these,
     * in order, except `lost` which can happen from most stages.
     */
    'stages' => [
        'new_lead',
        'contacted',
        'consult_booked',
        'consult_completed',
        'mvp_in_progress',
        'closing_booked',
        'won',
        'in_delivery',
        'delivered',
        'lost',
    ],

    'lost_reasons' => [
        'price',
        'timing',
        'trust',
        'scope',
        'went_elsewhere',
        'no_response',
        'not_qualified',
        'other',
    ],

    /*
     * Prompt 4: what a consult can conclude with. Kept here rather than a
     * new enum class, same pattern as `stages`/`lost_reasons`.
     */
    'consult_outcomes' => [
        'agreed_mvp',
        'need_another_meeting',
        'lost',
    ],

    /*
     * LTV = contract_value + (recurring_mrr × expected retention months) − project_cost.
     * "Expected retention months" is a business assumption, not something
     * derivable from the data — it must be set here explicitly (an env var,
     * so it can change without a deploy) before LTV/LTV:CAC can be
     * calculated. KpiService returns both as null, not a guessed number,
     * while this is unset.
     */
    'expected_retention_months' => env('EXPECTED_RETENTION_MONTHS'),

];
