<?php

namespace App\Http\Controllers;

use App\Models\AdSpend;
use App\Models\Lead;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * First-run setup — lets whoever deploys this app create their OWN admin
 * account instead of keeping the seeded demo one (DatabaseSeeder) and its
 * sample leads. One-time only: once `settings.setup_completed_at` is set,
 * both endpoints refuse to run again, so this can never become an open
 * admin-registration endpoint sitting on a live deployment.
 */
class SetupController extends Controller
{
    // The four accounts DatabaseSeeder creates — deleted, with all demo
    // data, the moment a real admin account replaces them.
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
        if (Setting::current()->setup_completed_at !== null) {
            return response()->json(['error' => 'Setup has already been completed.'], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = DB::transaction(function () use ($data) {
            // Every lead in a fresh install is demo data — cascades
            // attribution, segmentation, stage history, developer
            // assignments, milestones and previews with it.
            Lead::query()->delete();
            AdSpend::query()->delete();

            foreach (User::whereIn('email', self::SEED_EMAILS)->get() as $seedUser) {
                $seedUser->tokens()->delete();
                $seedUser->notifications()->delete();
                $seedUser->delete();
            }

            $admin = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => 'admin',
                'active' => true,
            ]);

            Setting::current()->update(['setup_completed_at' => now()]);

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
