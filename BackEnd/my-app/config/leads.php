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

];
