<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $accounts = [
            ['name' => 'Admin', 'email' => 'admin@stallionadvertising.ma', 'role' => 'admin'],
            ['name' => 'Sales', 'email' => 'sales@stallionadvertising.ma', 'role' => 'sales'],
            ['name' => 'Dev', 'email' => 'dev@stallionadvertising.ma', 'role' => 'dev'],
            ['name' => 'Client', 'email' => 'client@stallionadvertising.ma', 'role' => 'client'],
        ];

        foreach ($accounts as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'role' => $account['role'],
                    'password' => 'Stallion2026!',
                ],
            );
        }
    }
}
