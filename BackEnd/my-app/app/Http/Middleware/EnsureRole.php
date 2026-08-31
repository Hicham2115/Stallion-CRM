<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        // A rep deactivated mid-session shouldn't keep working off their
        // existing token until it expires — UserController::setActive()
        // also revokes their tokens outright, this is the backstop for any
        // that survive that (a request already in flight, a race).
        if (! $user->active) {
            return response()->json(['error' => 'This account has been deactivated.'], 403);
        }

        return $next($request);
    }
}
