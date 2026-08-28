<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DialLogController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Settings > Personal Info — a user editing their own account. See
// ProfileController's note on why this needs no role gate.
Route::patch('/profile', [ProfileController::class, 'update'])->middleware('auth:sanctum');
Route::patch('/profile/password', [ProfileController::class, 'updatePassword'])->middleware('auth:sanctum');

// Rep Dashboard "My Dials Today" — self-service, sales-role only (see
// DialLogController).
Route::get('/dials/today', [DialLogController::class, 'today'])->middleware(['auth:sanctum', 'role:sales']);
Route::patch('/dials/today', [DialLogController::class, 'updateToday'])->middleware(['auth:sanctum', 'role:sales']);

Route::get('/leads', [LeadController::class, 'index'])->middleware(['auth:sanctum', 'role:admin,sales,dev']);
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

// Same role gate as /leads — see AnalyticsController's report note on
// whether `economics` (revenue/CAC/LTV) should be admin-only.
Route::get('/analytics/kpis', [AnalyticsController::class, 'kpis'])->middleware(['auth:sanctum', 'role:admin,sales']);

// Settings > Sales Reps — real accounts, admin-only (see UserController).
Route::get('/users', [UserController::class, 'index'])->middleware(['auth:sanctum', 'role:admin']);
Route::post('/users', [UserController::class, 'store'])->middleware(['auth:sanctum', 'role:admin']);
Route::patch('/users/{user}', [UserController::class, 'update'])->middleware(['auth:sanctum', 'role:admin']);
Route::patch('/users/{user}/active', [UserController::class, 'setActive'])->middleware(['auth:sanctum', 'role:admin']);
Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware(['auth:sanctum', 'role:admin']);
