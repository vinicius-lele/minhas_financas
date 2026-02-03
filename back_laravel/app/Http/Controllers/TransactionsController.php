<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);
        $start = $request->query('start');
        $end = $request->query('end');

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        $sql = 'SELECT * FROM transactions WHERE profile_id = ?';
        $params = [$profileId];

        if ($start !== null && $end !== null) {
            $sql .= ' AND date BETWEEN ? AND ?';
            $params[] = $start;
            $params[] = $end;
        }

        $sql .= ' ORDER BY date DESC';

        $rows = DB::select($sql, $params);

        return response()->json($rows);
    }

    public function store(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);
        $categoryId = (int) $request->input('categoryId', 0);
        $amount = (float) $request->input('amount', 0);
        $type = (string) $request->input('type', '');
        $date = (string) $request->input('date', '');
        $description = $request->input('description');

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        if ($categoryId === 0) {
            return response()->json(['error' => 'categoryId inválido'], 400);
        }

        if ($amount === 0.0) {
            return response()->json(['error' => 'Valor inválido'], 400);
        }

        if ($type !== 'INCOME' && $type !== 'EXPENSE') {
            return response()->json(['error' => 'Tipo inválido'], 400);
        }

        if ($date === '') {
            return response()->json(['error' => 'Data inválida'], 400);
        }

        DB::insert(
            'INSERT INTO transactions (profile_id, category_id, amount, type, date, description) VALUES (?, ?, ?, ?, ?, ?)',
            [$profileId, $categoryId, $amount, $type, $date, $description ?: null]
        );

        $id = (int) DB::getPdo()->lastInsertId();

        return response()->json(['id' => $id], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($id <= 0) {
            return response()->json(['error' => 'ID inválido'], 400);
        }

        $categoryId = (int) $request->input('categoryId', 0);
        $amount = (float) $request->input('amount', 0);
        $type = (string) $request->input('type', '');
        $date = (string) $request->input('date', '');
        $description = $request->input('description');

        if ($categoryId === 0) {
            return response()->json(['error' => 'categoryId inválido'], 400);
        }

        if ($amount === 0.0) {
            return response()->json(['error' => 'Valor inválido'], 400);
        }

        DB::update(
            'UPDATE transactions SET category_id = ?, amount = ?, type = ?, date = ?, description = ? WHERE id = ?',
            [$categoryId, $amount, $type, $date, $description ?: null, $id]
        );

        return response()->json(['ok' => true]);
    }

    public function destroy(int $id): JsonResponse
    {
        if ($id <= 0) {
            return response()->json(['error' => 'ID inválido'], 400);
        }

        DB::delete(
            'DELETE FROM transactions WHERE id = ?',
            [$id]
        );

        return response()->json(null, 204);
    }
}

