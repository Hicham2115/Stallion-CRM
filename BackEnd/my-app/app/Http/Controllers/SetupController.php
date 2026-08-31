<?php

namespace App\Http\Controllers;

use App\Models\AdSpend;
use App\Models\Lead;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * /setup — creates a new admin account. Always reachable, before login, on
 * purpose (an admin locked out with no other admin account can still get
 * back in). The demo-data wipe (seed users + every lead/ad-spend row) only
 * ever runs ONCE, on the very first submission of this form for a fresh
 * install (guarded by `settings.setup_completed_at` being null) — every
 * later submission just creates another admin account and touches nothing
 * else.
 */
class SetupController extends Controller
{
    // The four accounts DatabaseSeeder creates — deleted, with all demo
    // data, the moment the first real admin account replaces them.
    private const SEED_EMAILS = [
        'admin@stallionadvertising.ma',
        'sales@stallionadvertising.ma',
        'dev@stallionadvertising.ma',
        'client@stallionadvertising.ma',
    ];

    public function status()
    {
        return response()->json([
            'needs_setup' => Setting::current()->setup_completed_at === null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = DB::transaction(function () use ($data) {
            $isFirstSetup = Setting::current()->setup_completed_at === null;

            if ($isFirstSetup) {
                // Every lead in a fresh install is demo data — cascades
                // attribution, segmentation, stage history, developer
                // assignments, milestones and previews with it. Only ever
                // runs this one time — a later admin created here must never
                // wipe real production data.
                Lead::query()->delete();
                AdSpend::query()->delete();

                foreach (User::whereIn('email', self::SEED_EMAILS)->get() as $seedUser) {
                    $seedUser->tokens()->delete();
                    $seedUser->notifications()->delete();
                    $seedUser->delete();
                }
            }

            $admin = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => 'admin',
                'active' => true,
            ]);

            if ($isFirstSetup) {
                Setting::current()->update(['setup_completed_at' => now()]);
            }

            return $admin;
        });

        $token = $user->createToken('session')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ], 201);
    }
}
