<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'tenant_name' => ['required', 'string', 'min:3', 'max:100'],
            'currency' => ['required', 'string', 'max:8'],
            'invoice_prefix' => ['required', 'string', 'max:20'],
            'tenant_locale' => ['required', 'string', 'in:ar,en'],
        ]);

        $user = DB::transaction(function () use ($request) {
            $tenant = Tenant::create([
                'name' => $request->tenant_name,
                'currency' => $request->currency,
                'currency_decimal_places' => $this->decimalPlacesFor($request->currency),
                'locale' => $request->tenant_locale,
                'invoice_prefix' => $request->invoice_prefix,
            ]);

            return User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->string('password')),
                'tenant_id' => $tenant->id,
                'role' => 'owner',
                'must_change_password' => false,
            ]);
        });

        Auth::login($user);

        $token = $user->createToken('api')->plainTextToken;

        return $this->success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'tenant_locale' => $user->tenant->locale,
            'must_change_password' => $user->must_change_password,
            'token' => $token
        ], null, 201);
    }

    private function decimalPlacesFor(string $currency): int
    {
        return match ($currency) {
            'JPY' => 0,
            default => 2,
        };
    }
}
