<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Settings > Sales Reps — admin-only management of real sign-in accounts.
 * Scoped to role=sales throughout: this panel manages the sales team, not
 * every account in the system (admin/dev/client aren't edited here).
 */
class UserController extends Controller
{
    public function index(Request $request)
    {
        $role = $request->query('role', 'sales');

        return response()->json(
            User::where('role', $role)->orderBy('name')->get(['id', 'name', 'email', 'role', 'active'])
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'sales',
            'active' => true,
        ]);

        return response()->json($user->only(['id', 'name', 'email', 'role', 'active']), 201);
    }

    /** Rename only — email/role/password changes have no UI yet and aren't
     *  added speculatively here. */
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
        ]);

        $user->name = $data['name'];
        $user->save();

        return response()->json($user->only(['id', 'name', 'email', 'role', 'active']));
    }

    /** Deactivating blocks sign-in (AuthController::login, EnsureRole) but
     *  keeps every record intact — the reversible half of the delete
     *  confirmation's "deactivating keeps the history instead" promise. */
    public function setActive(Request $request, User $user)
    {
        $data = $request->validate([
            'active' => ['required', 'boolean'],
        ]);

        $user->active = $data['active'];
        $user->save();

        if (! $user->active) {
            $user->tokens()->delete();
        }

        return response()->json($user->only(['id', 'name', 'email', 'role', 'active']));
    }

    /** The destructive half: leads they owned become unassigned rather than
     *  being deleted with them — a client's history shouldn't disappear
     *  because the rep who worked it did. */
    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'user' => 'You cannot delete your own account.',
            ]);
        }

        Lead::where('assigned_sales_id', $user->id)->update(['assigned_sales_id' => null]);
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['id' => $user->id]);
    }
}
