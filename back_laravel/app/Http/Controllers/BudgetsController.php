<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BudgetsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);
        $month = (int) $request->query('month', 0);
        $year = (int) $request->query('year', 0);

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        if ($month === 0 || $year === 0) {
            return response()->json(['error' => 'Parâmetros month e year são obrigatórios'], 400);
        }

        $rows = DB::select(
            "
            SELECT b.id, b.profile_id, b.category_id, b.month, b.year, b.amount,
                   c.name as category_name, c.emoji as category_emoji, c.type as category_type
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            WHERE b.profile_id = ? AND b.month = ? AND b.year = ?
            ORDER BY c.name
            ",
            [$profileId, $month, $year]
        );

        return response()->json($rows);
    }

    public function store(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);
        $categoryId = (int) $request->input('categoryId', 0);
        $month = (int) $request->input('month', 0);
        $year = (int) $request->input('year', 0);
        $amount = (float) $request->input('amount', 0);

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        if ($categoryId === 0 || $month === 0 || $year === 0) {
            return response()->json(['error' => 'Dados inválidos'], 400);
        }

        DB::statement(
            "
            INSERT INTO budgets (profile_id, category_id, month, year, amount)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE amount = VALUES(amount)
            ",
            [$profileId, $categoryId, $month, $year, $amount]
        );

        return response()->json(['ok' => true], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($id <= 0) {
            return response()->json(['error' => 'ID inválido'], 400);
        }

        $amount = (float) $request->input('amount', 0);

        DB::update(
            'UPDATE budgets SET amount = ? WHERE id = ?',
            [$amount, $id]
        );

        return response()->json(['ok' => true]);
    }

    public function destroy(int $id): JsonResponse
    {
        if ($id <= 0) {
            return response()->json(['error' => 'ID inválido'], 400);
        }

        DB::delete(
            'DELETE FROM budgets WHERE id = ?',
            [$id]
        );

        return response()->json(['ok' => true]);
    }

    public function summary(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);
        $month = (int) $request->query('month', 0);
        $year = (int) $request->query('year', 0);

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        if ($month === 0 || $year === 0) {
            return response()->json(['error' => 'Parâmetros month e year são obrigatórios'], 400);
        }

        $rows = DB::select(
            "
            SELECT c.id as category_id,
                   c.name as category_name,
                   c.emoji as category_emoji,
                   c.type,
                   b.amount as budget_amount,
                   COALESCE(SUM(t.amount), 0) as spent_amount
            FROM categories c
            JOIN budgets b
              ON c.id = b.category_id
             AND b.profile_id = ?
             AND b.month = ?
             AND b.year = ?
            LEFT JOIN transactions t
              ON c.id = t.category_id
             AND t.profile_id = ?
             AND MONTH(t.date) = ?
             AND YEAR(t.date) = ?
             AND t.type = 'EXPENSE'
            WHERE c.profile_id = ?
              AND c.type = 'EXPENSE'
            GROUP BY c.id, c.name, c.emoji, c.type, b.amount
            ORDER BY c.name
            ",
            [$profileId, $month, $year, $profileId, $month, $year, $profileId]
        );

        return response()->json($rows);
    }
}

