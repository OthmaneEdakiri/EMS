<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordIsChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->must_change_password) {
            return response()->json([
                'data' => null,
                'meta' => (object) [],
                'errors' => [
                    ['field' => 'password', 'message' => 'You must change your password before accessing this resource.'],
                ],
            ], 403);
        }

        return $next($request);
    }
}
