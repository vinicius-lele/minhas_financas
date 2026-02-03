<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoriesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);
        $type = $request->query('type');

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        if ($type !== null && $type !== 'INCOME' && $type !== 'EXPENSE') {
            return response()->json(['error' => 'Tipo inválido'], 400);
        }

        if ($type !== null) {
            $rows = DB::select(
                'SELECT * FROM categories WHERE profile_id = ? AND type = ?',
                [$profileId, $type]
            );
            return response()->json($rows);
        }

        $rows = DB::select(
            'SELECT * FROM categories WHERE profile_id = ?',
            [$profileId]
        );

        return response()->json($rows);
    }

    public function store(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);
        $name = (string) $request->input('name', '');
        $emoji = (string) $request->input('emoji', '');
        $type = (string) $request->input('type', '');

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        if ($name === '' || mb_strlen($name) < 2) {
            return response()->json(['error' => 'Nome inválido'], 400);
        }

        if ($emoji === '' || mb_strlen($emoji) > 4) {
            return response()->json(['error' => 'Emoji inválido'], 400);
        }

        if ($type !== 'INCOME' && $type !== 'EXPENSE') {
            return response()->json(['error' => 'Tipo inválido'], 400);
        }

        DB::insert(
            'INSERT INTO categories (profile_id, name, emoji, type) VALUES (?, ?, ?, ?)',
            [$profileId, $name, $emoji, $type]
        );

        $id = (int) DB::getPdo()->lastInsertId();

        return response()->json(
            [
                'id' => $id,
                'name' => $name,
                'emoji' => $emoji,
                'type' => $type,
            ],
            201
        );
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($id <= 0) {
            return response()->json(['error' => 'ID inválido'], 400);
        }

        $name = (string) $request->input('name', '');
        $emoji = (string) $request->input('emoji', '');
        $type = (string) $request->input('type', '');

        if ($name === '' || mb_strlen($name) < 2) {
            return response()->json(['error' => 'Nome inválido'], 400);
        }

        if ($emoji === '' || mb_strlen($emoji) > 4) {
            return response()->json(['error' => 'Emoji inválido'], 400);
        }

        if ($type !== 'INCOME' && $type !== 'EXPENSE') {
            return response()->json(['error' => 'Tipo inválido'], 400);
        }

        $affected = DB::update(
            'UPDATE categories SET name = ?, emoji = ?, type = ? WHERE id = ?',
            [$name, $emoji, $type, $id]
        );

        if ($affected === 0) {
            return response()->json(['error' => 'Categoria não encontrada'], 404);
        }

        return response()->json([
            'id' => $id,
            'name' => $name,
            'emoji' => $emoji,
            'type' => $type,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        if ($id <= 0) {
            return response()->json(['error' => 'ID inválido'], 400);
        }

        $deleted = DB::delete(
            'DELETE FROM categories WHERE id = ?',
            [$id]
        );

        if ($deleted === 0) {
            return response()->json(['error' => 'Categoria não encontrada'], 404);
        }

        return response()->json(['ok' => true]);
    }
}

