<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfilesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('user_id', 0);

        if ($userId === 0) {
            return response()->json(['error' => 'Usuário não autenticado']);
        }

        $rows = DB::select(
            'SELECT p.*
             FROM profiles p
             JOIN user_profiles up ON up.profile_id = p.id
             WHERE up.user_id = ?',
            [$userId]
        );

        return response()->json($rows);
    }

    public function store(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('user_id', 0);

        if ($userId === 0) {
            return response()->json(['error' => 'Usuário não autenticado']);
        }

        $name = (string) $request->input('name', '');
        $theme = (string) $request->input('theme', 'blue');

        if ($name === '') {
            return response()->json(['error' => 'Nome inválido'], 400);
        }

        DB::insert(
            'INSERT INTO profiles (name, theme) VALUES (?, ?)',
            [$name, $theme]
        );

        $profileId = (int) DB::getPdo()->lastInsertId();

        DB::insert(
            'INSERT INTO user_profiles (user_id, profile_id) VALUES (?, ?)',
            [$userId, $profileId]
        );

        return response()->json(
            [
                'id' => $profileId,
                'name' => $name,
                'theme' => $theme,
            ],
            201
        );
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $userId = (int) $request->attributes->get('user_id', 0);

        if ($userId === 0) {
            return response()->json(['error' => 'Usuário não autenticado']);
        }

        if ($id <= 0) {
            return response()->json(['error' => 'ID inválido'], 400);
        }

        $name = (string) $request->input('name', '');
        $theme = (string) $request->input('theme', 'blue');

        if ($name === '') {
            return response()->json(['error' => 'Nome inválido'], 400);
        }

        $affected = DB::update(
            'UPDATE profiles SET name = ?, theme = ? WHERE id = ?',
            [$name, $theme, $id]
        );

        if ($affected === 0) {
            return response()->json(['error' => 'Perfil não encontrado']);
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $userId = (int) $request->attributes->get('user_id', 0);

        if ($userId === 0) {
            return response()->json(['error' => 'Usuário não autenticado']);
        }

        if ($id <= 0) {
            return response()->json(['error' => 'ID inválido'], 400);
        }

        $affected = DB::delete(
            'DELETE FROM profiles WHERE id = ?',
            [$id]
        );

        if ($affected === 0) {
            return response()->json(['error' => 'Perfil não encontrado']);
        }

        return response()->json(['ok' => true]);
    }
}

