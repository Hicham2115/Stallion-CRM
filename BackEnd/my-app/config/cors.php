<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(explode(',', env('FRONTEND_URL') ?: 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001')),

    // Any-port localhost/127.0.0.1 is a dev convenience only — never allowed
    // outside local/testing, where a stray localhost script could otherwise
    // make non-credentialed cross-origin reads against a real deployment.
    'allowed_origins_patterns' => in_array(env('APP_ENV', 'production'), ['local', 'testing'], true)
        ? ['#^http://(localhost|127\.0\.0\.1)(:\d+)?$#']
        : [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
