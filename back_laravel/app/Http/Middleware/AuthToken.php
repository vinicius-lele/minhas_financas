<?php

namespace App\Http\Middleware;

use App\Services\AuthService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthToken
{
    public function handle(Request $request, Closure $next): JsonResponse|\Symfony\Component\HttpFoundation\Response
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['error' => 'Não autenticado'], 401);
        }

        $token = substr($authHeader, 7);

        try {
            $payload = AuthService::verifyAuthToken($token);
            if (AuthService::isTokenRevoked($payload['jti'])) {
                return response()->json(['error' => 'Token revogado'], 401);
            }

            $request->attributes->set('user_id', $payload['sub']);
            $request->attributes->set('user', [
                'id' => $payload['sub'],
                'username' => $payload['username'],
                'email' => $payload['email'],
            ]);
        } catch (\Throwable) {
            return response()->json(['error' => 'Token inválido'], 401);
        }

        return $next($request);
    }
}

