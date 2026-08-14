<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordChangeController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\StaffController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [RegisteredUserController::class, 'register'])
    ->middleware('guest')
    ->name('register');

Route::post('/login', [AuthController::class, 'store'])
    // ->middleware('guest')
    ->name('login');

Route::post('/logout', [AuthController::class, 'destroy'])
    ->middleware('auth:sanctum')
    ->name('logout');

Route::post('/password/change', [PasswordChangeController::class, 'store'])
    ->middleware('auth:sanctum')
    ->name('password.change');

Route::middleware(['auth:sanctum', 'password.changed', 'can:manage-team'])->group(function () {
    Route::get('/users', [StaffController::class, 'index']);
    Route::post('/users', [StaffController::class, 'store']);
    Route::delete('/users/{user}', [StaffController::class, 'destroy']);
});
