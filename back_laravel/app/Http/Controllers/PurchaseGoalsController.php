<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseGoalsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);
        $q = $request->query('q');
        $category = $request->query('category');
        $priority = $request->query('priority');
        $status = $request->query('status');
        $page = (int) ($request->query('page', 1));
        $pageSize = (int) ($request->query('pageSize', 20));

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        $where = ['profile_id = ?'];
        $params = [$profileId];

        if ($q !== null && $q !== '') {
            $where[] = 'name LIKE ?';
            $params[] = '%' . $q . '%';
        }

        if ($category !== null && $category !== '') {
            $where[] = 'category = ?';
            $params[] = $category;
        }

        if ($priority !== null && $priority !== '') {
            $where[] = 'priority = ?';
            $params[] = $priority;
        }

        if ($status === 'active') {
            $where[] = 'is_completed = 0';
        } elseif ($status === 'completed') {
            $where[] = 'is_completed = 1';
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $offset = ($page - 1) * $pageSize;

        $countRows = DB::select(
            "SELECT COUNT(*) as count FROM purchase_goals {$whereSql}",
            $params
        );
        $total = isset($countRows[0]) ? (int) ($countRows[0]->count ?? 0) : 0;

        $dataRows = DB::select(
            "SELECT * FROM purchase_goals {$whereSql} ORDER BY is_completed ASC, updated_at DESC LIMIT ? OFFSET ?",
            array_merge($params, [$pageSize, $offset])
        );

        return response()->json([
            'data' => $dataRows,
            'total' => $total,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);
        $name = (string) $request->input('name', '');
        $category = $request->input('category');
        $targetAmount = (float) $request->input('target_amount', 0);
        $currentSaved = (float) $request->input('current_amount_saved', 0);
        $priority = $request->input('priority');
        $deadline = $request->input('deadline');
        $notes = $request->input('notes');

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        if ($name === '') {
            return response()->json(['error' => 'Nome inválido'], 400);
        }

        if ($targetAmount <= 0) {
            return response()->json(['error' => 'Valor alvo inválido'], 400);
        }

        $now = now();

        DB::insert(
            'INSERT INTO purchase_goals (profile_id, name, category, target_amount, current_amount_saved, priority, deadline, notes, is_completed, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
            [
                $profileId,
                $name,
                $category ?: null,
                $targetAmount,
                $currentSaved,
                $priority ?: null,
                $deadline ?: null,
                $notes ?: null,
                $now,
                $now,
            ]
        );

        $id = (int) DB::getPdo()->lastInsertId();

        return response()->json(['id' => $id], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($id <= 0) {
            return response()->json(['error' => 'ID inválido'], 400);
        }

        $name = (string) $request->input('name', '');
        $category = $request->input('category');
        $targetAmount = (float) $request->input('target_amount', 0);
        $currentSaved = (float) $request->input('current_amount_saved', 0);
        $priority = $request->input('priority');
        $deadline = $request->input('deadline');
        $notes = $request->input('notes');
        $isCompleted = (int) $request->input('is_completed', 0);

        if ($name === '') {
            return response()->json(['error' => 'Nome inválido'], 400);
        }

        if ($targetAmount <= 0) {
            return response()->json(['error' => 'Valor alvo inválido'], 400);
        }

        $now = now();
        $completedAt = $isCompleted ? $now : null;

        $affected = DB::update(
            'UPDATE purchase_goals
             SET name = ?, category = ?, target_amount = ?, current_amount_saved = ?, priority = ?, deadline = ?, notes = ?, is_completed = ?, completed_at = ?, updated_at = ?
             WHERE id = ?',
            [
                $name,
                $category ?: null,
                $targetAmount,
                $currentSaved,
                $priority ?: null,
                $deadline ?: null,
                $notes ?: null,
                $isCompleted,
                $completedAt,
                $now,
                $id,
            ]
        );

        if ($affected === 0) {
            return response()->json(['error' => 'Meta não encontrada'], 404);
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(int $id): JsonResponse
    {
        if ($id <= 0) {
            return response()->json(['error' => 'ID inválido'], 400);
        }

        $affected = DB::delete(
            'DELETE FROM purchase_goals WHERE id = ?',
            [$id]
        );

        if ($affected === 0) {
            return response()->json(['error' => 'Meta não encontrada'], 404);
        }

        return response()->json(['ok' => true]);
    }

    public function complete(int $id): JsonResponse
    {
        if ($id <= 0) {
            return response()->json(['error' => 'ID inválido'], 400);
        }

        $now = now();

        $affected = DB::update(
            'UPDATE purchase_goals SET is_completed = 1, completed_at = ?, updated_at = ? WHERE id = ?',
            [$now, $now, $id]
        );

        if ($affected === 0) {
            return response()->json(['error' => 'Meta não encontrada'], 404);
        }

        return response()->json(['ok' => true]);
    }

    public function addSaving(Request $request, int $id): JsonResponse
    {
        $amount = (float) $request->input('amount', 0);
        $date = (string) $request->input('date', '');
        $notes = $request->input('notes');

        if ($id <= 0) {
            return response()->json(['error' => 'ID inválido'], 400);
        }

        if ($amount <= 0) {
            return response()->json(['error' => 'Valor inválido'], 400);
        }

        if ($date === '') {
            return response()->json(['error' => 'Data inválida'], 400);
        }

        $now = now();

        DB::insert(
            'INSERT INTO savings_transactions (goal_id, amount, date, notes, created_at) VALUES (?, ?, ?, ?, ?)',
            [$id, $amount, $date, $notes ?: null, $now]
        );

        DB::update(
            'UPDATE purchase_goals SET current_amount_saved = current_amount_saved + ?, updated_at = ? WHERE id = ?',
            [$amount, $now, $id]
        );

        return response()->json(['ok' => true]);
    }

    public function listSavings(int $id): JsonResponse
    {
        if ($id <= 0) {
            return response()->json(['error' => 'ID inválido'], 400);
        }

        $rows = DB::select(
            'SELECT * FROM savings_transactions WHERE goal_id = ? ORDER BY date DESC, id DESC',
            [$id]
        );

        return response()->json($rows);
    }

    public function summary(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        $totalsRows = DB::select(
            'SELECT COUNT(*) as total FROM purchase_goals WHERE profile_id = ?',
            [$profileId]
        );
        $completedRows = DB::select(
            'SELECT COUNT(*) as total FROM purchase_goals WHERE profile_id = ? AND is_completed = 1',
            [$profileId]
        );
        $activeRows = DB::select(
            'SELECT COUNT(*) as total FROM purchase_goals WHERE profile_id = ? AND is_completed = 0',
            [$profileId]
        );
        $savedRows = DB::select(
            'SELECT COALESCE(SUM(current_amount_saved),0) as total FROM purchase_goals WHERE profile_id = ? AND is_completed = 0',
            [$profileId]
        );
        $remainingRows = DB::select(
            'SELECT COALESCE(SUM(target_amount - current_amount_saved),0) as total FROM purchase_goals WHERE profile_id = ? AND is_completed = 0',
            [$profileId]
        );
        $overdueRows = DB::select(
            "
            SELECT COUNT(*) as total FROM purchase_goals
            WHERE profile_id = ?
              AND is_completed = 0
              AND deadline IS NOT NULL
              AND deadline < CURDATE()
            ",
            [$profileId]
        );

        $totalGoals = isset($totalsRows[0]) ? (int) ($totalsRows[0]->total ?? 0) : 0;
        $completed = isset($completedRows[0]) ? (int) ($completedRows[0]->total ?? 0) : 0;
        $active = isset($activeRows[0]) ? (int) ($activeRows[0]->total ?? 0) : 0;
        $savedActive = isset($savedRows[0]) ? (float) ($savedRows[0]->total ?? 0) : 0.0;
        $remainingActive = isset($remainingRows[0]) ? (float) ($remainingRows[0]->total ?? 0) : 0.0;
        $overdue = isset($overdueRows[0]) ? (int) ($overdueRows[0]->total ?? 0) : 0;

        $percent = $totalGoals > 0 ? (int) round(($completed / $totalGoals) * 100) : 0;

        return response()->json([
            'totalGoals' => $totalGoals,
            'completed' => $completed,
            'active' => $active,
            'overdue' => $overdue,
            'percentCompleted' => $percent,
            'totalSavedActive' => $savedActive,
            'totalRemainingActive' => $remainingActive,
        ]);
    }
}

