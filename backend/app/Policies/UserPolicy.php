<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === 'owner';
    }

    public function create(User $user): bool
    {
        return $user->role === 'owner';
    }

    public function update(User $user, User $target): bool
    {
        return $user->role === 'owner' && $user->tenant_id === $target->tenant_id;
    }

    public function delete(User $user, User $target): bool
    {
        return $user->role === 'owner'
            && $user->tenant_id === $target->tenant_id
            && $user->id !== $target->id;
    }
}
