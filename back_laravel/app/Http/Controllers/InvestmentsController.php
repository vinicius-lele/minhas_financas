<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvestmentsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);
        $q = $request->query('q');
        $category = $request->query('category');
        $broker = $request->query('broker');
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

        if ($broker !== null && $broker !== '') {
            $where[] = 'broker = ?';
            $params[] = $broker;
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $offset = ($page - 1) * $pageSize;

        $countRows = DB::select(
            "SELECT COUNT(*) as count FROM investments {$whereSql}",
            $params
        );
        $total = isset($countRows[0]) ? (int) ($countRows[0]->count ?? 0) : 0;

        $dataRows = DB::select(
            "SELECT * FROM investments {$whereSql} ORDER BY updated_at DESC LIMIT ? OFFSET ?",
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
        $broker = $request->input('broker');
        $invested = (float) $request->input('invested_amount', 0);
        $current = (float) $request->input('current_value', 0);

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        if ($name === '') {
            return response()->json(['error' => 'Nome inválido'], 400);
        }

        $now = now();

        DB::insert(
            'INSERT INTO investments (profile_id, name, category, broker, invested_amount, current_value, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $profileId,
                $name,
                $category ?: null,
                $broker ?: null,
                $invested,
                $current,
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
        $broker = $request->input('broker');
        $invested = (float) $request->input('invested_amount', 0);
        $current = (float) $request->input('current_value', 0);

        if ($name === '') {
            return response()->json(['error' => 'Nome inválido'], 400);
        }

        $now = now();

        DB::update(
            'UPDATE investments SET name = ?, category = ?, broker = ?, invested_amount = ?, current_value = ?, updated_at = ? WHERE id = ?',
            [
                $name,
                $category ?: null,
                $broker ?: null,
                $invested,
                $current,
                $now,
                $id,
            ]
        );

        return response()->json(['ok' => true]);
    }

    public function destroy(int $id): JsonResponse
    {
        if ($id <= 0) {
            return response()->json(['error' => 'ID inválido'], 400);
        }

        DB::delete(
            'DELETE FROM investments WHERE id = ?',
            [$id]
        );

        return response()->json(['ok' => true]);
    }

    public function summary(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        $overviewRows = DB::select(
            '
            SELECT
              COALESCE(SUM(invested_amount), 0) AS totalInvested,
              COALESCE(SUM(current_value), 0) AS totalCurrent,
              COUNT(*) AS count
            FROM investments
            WHERE profile_id = ?
            ',
            [$profileId]
        );

        $overviewRow = isset($overviewRows[0]) ? (array) $overviewRows[0] : [];

        $totalInvested = (float) ($overviewRow['totalInvested'] ?? 0);
        $totalCurrent = (float) ($overviewRow['totalCurrent'] ?? 0);
        $count = (int) ($overviewRow['count'] ?? 0);
        $totalProfit = $totalCurrent - $totalInvested;
        $totalProfitPercent = $totalInvested > 0 ? ($totalProfit / $totalInvested) * 100 : 0.0;

        $categoryRows = DB::select(
            '
            SELECT
              category,
              COALESCE(SUM(invested_amount), 0) AS totalInvested,
              COALESCE(SUM(current_value), 0) AS totalCurrent
            FROM investments
            WHERE profile_id = ?
            GROUP BY category
            ORDER BY totalCurrent DESC
            ',
            [$profileId]
        );

        $categories = array_map(function ($row) {
            $rowArr = (array) $row;
            $invested = (float) ($rowArr['totalInvested'] ?? 0);
            $current = (float) ($rowArr['totalCurrent'] ?? 0);
            $profit = $current - $invested;

            return [
                'category' => $rowArr['category'] ?? null,
                'totalInvested' => $invested,
                'totalCurrent' => $current,
                'profit' => $profit,
            ];
        }, $categoryRows);

        return response()->json([
            'overview' => [
                'totalInvested' => $totalInvested,
                'totalCurrent' => $totalCurrent,
                'totalProfit' => $totalProfit,
                'totalProfitPercent' => $totalProfitPercent,
                'count' => $count,
            ],
            'categories' => $categories,
        ]);
    }
}

