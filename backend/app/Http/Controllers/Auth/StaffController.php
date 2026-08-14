<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        $users = User::where('tenant_id', $request->user()->tenant_id)
            ->where('role', 'staff')
            ->get(['id', 'name', 'email', 'role', 'created_at']);

        return $this->success($users);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'tenant_id' => $request->user()->tenant_id,
            'role' => 'staff',
            'must_change_password' => true,
        ]);

        return $this->created([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        if ($user->id === $request->user()->id) {
            return $this->error(
                [['field' => 'user', 'message' => 'You cannot delete yourself.']],
                null,
                422
            );
        }

        $user->delete();

        return response()->noContent();
    }
}
