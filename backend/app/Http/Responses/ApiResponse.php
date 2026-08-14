<?php

namespace App\Http\Responses;

trait ApiResponse
{
    protected function success(mixed $data = null, mixed $meta = null, int $status = 200)
    {
        return response()->json([
            'data' => $data,
            'meta' => $meta ?? (object) [],
            'errors' => [],
        ], $status);
    }

    protected function error(array $errors, mixed $data = null, int $status = 422)
    {
        return response()->json([
            'data' => $data,
            'meta' => (object) [],
            'errors' => $errors,
        ], $status);
    }

    protected function created(mixed $data = null)
    {
        return $this->success($data, null, 201);
    }
}
