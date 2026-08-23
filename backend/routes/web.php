<?php

use App\Http\Controllers\Auth\ProfileController;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

Route::prefix('api/v1')->group(function () {
    require __DIR__ . '/auth.php';

    Route::middleware(['auth:sanctum', 'password.changed'])->get('/user', function (Request $request) {
        return [
            'user' => $request->user(),
            'tenant_locale' => $request->user()->tenant->locale,
        ];
    });

    Route::middleware(['auth:sanctum', 'password.changed'])->group(function(){
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
    });

});
