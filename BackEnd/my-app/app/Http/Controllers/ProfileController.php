<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * "Personal Info" (Settings) — a signed-in user editing their OWN name/
 * email/password. Deliberately not role-gated beyond auth:sanctum: this
 * acts on $request->user() only, never a route-model-bound {user}, so
 * there's no way to edit anyone else's account through it regardless of
 * role. Separate from the admin-only rep management in RepsPanel/
 * CreateAccountPanel, which edits OTHER users' accounts.
 */
class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->update($data);

        return response()->json($user->fresh());
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'Current password is incorrect.',
            ]);
        }

        $user->update(['password' => $data['password']]);

        return response()->json(['ok' => true]);
    }
}
