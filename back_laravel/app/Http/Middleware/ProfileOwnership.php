<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfileOwnership
{
    public function handle(Request $request, Closure $next): JsonResponse|\Symfony\Component\HttpFoundation\Response
    {
        $userId = (int) $request->attributes->get('user_id', 0);
        if ($userId === 0) {
            return response()->json(['error' => 'Usuário não autenticado'], 401);
        }

        $profileId = (int) $request->header('x-profile-id', 0);
        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        $row = DB::selectOne(
            'SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?',
            [$userId, $profileId]
        );

        if ($row === null) {
            return response()->json(['error' => 'Perfil não pertence ao usuário'], 403);
        }

        $request->attributes->set('profile_id', $profileId);

        return $next($request);
    }
}

