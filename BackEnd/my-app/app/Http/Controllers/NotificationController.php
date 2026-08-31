<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

/**
 * The bell in ConsoleTopbar — a signed-in user's own database
 * notifications only (Laravel's Notifiable trait, already on User).
 * Scoped by always going through $request->user()->notifications(),
 * never a bare model lookup, so one user can never read or mark another
 * user's notification.
 */
class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'notifications' => $user->notifications()->latest()->limit(30)->get(),
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    public function markRead(Request $request, string $notification)
    {
        $record = $request->user()->notifications()->findOrFail($notification);
        $record->markAsRead();

        return response()->json(['ok' => true]);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['ok' => true]);
    }
}
