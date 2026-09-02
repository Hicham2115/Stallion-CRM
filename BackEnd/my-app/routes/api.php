<?php

use App\Http\Controllers\AdSpendController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DialLogController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\SetupController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// /setup — always-reachable, no-auth admin account creation (see
// SetupController for why: only the very first submission wipes demo data,
// every later one just adds an admin). Throttled since it's unauthenticated.
Route::get('/setup/status', [SetupController::class, 'status']);
Route::post('/setup', [SetupController::class, 'store'])->middleware('throttle:5,1');

// Settings > Personal Info — a user editing their own account. See
// ProfileController's note on why this needs no role gate.
Route::patch('/profile', [ProfileController::class, 'update'])->middleware('auth:sanctum');
Route::patch('/profile/password', [ProfileController::class, 'updatePassword'])->middleware('auth:sanctum');

// Topbar bell — a signed-in user's own database notifications.
Route::get('/notifications', [NotificationController::class, 'index'])->middleware('auth:sanctum');
Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead'])->middleware('auth:sanctum');
Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->middleware('auth:sanctum');

// Rep Dashboard "My Dials Today" — self-service, sales-role only (see
// DialLogController).
Route::get('/dials/today', [DialLogController::class, 'today'])->middleware(['auth:sanctum', 'role:sales']);
Route::patch('/dials/today', [DialLogController::class, 'updateToday'])->middleware(['auth:sanctum', 'role:sales']);

Route::get('/leads', [LeadController::class, 'index'])->middleware(['auth:sanctum', 'role:admin,sales,dev']);
Route::get('/leads/{lead}', [LeadController::class, 'show'])->middleware(['auth:sanctum', 'role:admin,sales,dev']);
Route::patch('/leads/{lead}/stage', [LeadController::class, 'updateStage'])->middleware(['auth:sanctum', 'role:admin,sales']);
// Prompt 4: same gate as everything else on this resource — no separate
// dev permission tier exists to reuse for the MVP fields specifically. See
// the Prompt 4 report.
Route::patch('/leads/{lead}', [LeadController::class, 'updateWorkflow'])->middleware(['auth:sanctum', 'role:admin,sales']);
Route::post('/leads', [LeadController::class, 'store'])->middleware('throttle:10,1');
// CRM's own "Add Client" — distinct from the public intake route above.
Route::post('/leads/manual', [LeadController::class, 'storeManual'])->middleware(['auth:sanctum', 'role:admin,sales']);
Route::patch('/leads/{lead}/developer', [LeadController::class, 'assignDeveloper'])->middleware(['auth:sanctum', 'role:admin']);
Route::post('/leads/gate', [LeadController::class, 'storeGate'])->middleware('throttle:10,1');

// Dev workspace — real "Project Steps", previews and the public live URL
// (see ProjectController). Admin can also edit; a dev only their own.
Route::post('/leads/{lead}/milestones', [ProjectController::class, 'storeMilestone'])->middleware(['auth:sanctum', 'role:admin,dev']);
Route::patch('/leads/{lead}/milestones/reorder', [ProjectController::class, 'reorderMilestones'])->middleware(['auth:sanctum', 'role:admin,dev']);
Route::patch('/leads/{lead}/milestones/{milestone}', [ProjectController::class, 'updateMilestone'])->middleware(['auth:sanctum', 'role:admin,dev']);
Route::delete('/leads/{lead}/milestones/{milestone}', [ProjectController::class, 'destroyMilestone'])->middleware(['auth:sanctum', 'role:admin,dev']);
Route::post('/leads/{lead}/previews', [ProjectController::class, 'storePreview'])->middleware(['auth:sanctum', 'role:admin,dev']);
Route::delete('/leads/{lead}/previews/{preview}', [ProjectController::class, 'destroyPreview'])->middleware(['auth:sanctum', 'role:admin,dev']);
Route::patch('/leads/{lead}/live-url', [ProjectController::class, 'updateLiveUrl'])->middleware(['auth:sanctum', 'role:admin,dev']);

// Admin — create/reset the client's own sign-in for a lead's portal.
Route::post('/leads/{lead}/portal-account', [LeadController::class, 'createPortalAccount'])->middleware(['auth:sanctum', 'role:admin']);

// Client portal — the signed-in client's own project, client-safe fields only.
Route::get('/portal/lead', [PortalController::class, 'show'])->middleware(['auth:sanctum', 'role:client']);

// Same role gate as /leads — see AnalyticsController's report note on
// whether `economics` (revenue/CAC/LTV) should be admin-only.
Route::get('/analytics/kpis', [AnalyticsController::class, 'kpis'])->middleware(['auth:sanctum', 'role:admin,sales']);
Route::get('/analytics/leaderboard', [AnalyticsController::class, 'leaderboard'])->middleware(['auth:sanctum', 'role:admin,sales']);

// Analysis > Ad Spend — the CSV import that feeds every cost figure in
// KpiService (CAC, CPL, campaign/creative spend). Same admin,sales gate as
// /analytics/kpis above, because the Analysis screen that renders those
// figures and the panel that uploads the data behind them are one surface,
// reachable by both roles.
Route::get('/ad-spend', [AdSpendController::class, 'index'])->middleware(['auth:sanctum', 'role:admin,sales']);
Route::post('/ad-spend/import', [AdSpendController::class, 'store'])->middleware(['auth:sanctum', 'role:admin,sales']);
// Declared before /{adSpend} so "all" is never read as a row id.
Route::delete('/ad-spend/all', [AdSpendController::class, 'destroyAll'])->middleware(['auth:sanctum', 'role:admin,sales']);
Route::delete('/ad-spend/{adSpend}', [AdSpendController::class, 'destroy'])->middleware(['auth:sanctum', 'role:admin,sales']);

// Settings > Sales Reps — real accounts, admin-only (see UserController).
Route::get('/users', [UserController::class, 'index'])->middleware(['auth:sanctum', 'role:admin']);
Route::post('/users', [UserController::class, 'store'])->middleware(['auth:sanctum', 'role:admin']);
Route::patch('/users/{user}', [UserController::class, 'update'])->middleware(['auth:sanctum', 'role:admin']);
Route::patch('/users/{user}/active', [UserController::class, 'setActive'])->middleware(['auth:sanctum', 'role:admin']);
Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware(['auth:sanctum', 'role:admin']);
