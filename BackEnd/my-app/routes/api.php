<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\LeadController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::get('/leads', [LeadController::class, 'index'])->middleware('auth:sanctum');
Route::post('/leads', [LeadController::class, 'store'])->middleware('throttle:10,1');
Route::post('/leads/gate', [LeadController::class, 'storeGate'])->middleware('throttle:10,1');
