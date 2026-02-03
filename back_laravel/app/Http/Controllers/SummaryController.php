<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;

class SummaryController extends Controller
{
    #[OA\Get(
        path: '/summary',
        summary: 'Resumo geral de receitas, despesas e saldo',
        tags: ['Dashboard'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Resumo calculado com sucesso'),
            new OA\Response(response: 400, description: 'Perfil não informado'),
            new OA\Response(response: 401, description: 'Não autenticado'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        $incomeRows = DB::select(
            "SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE profile_id = ? AND type = 'INCOME'",
            [$profileId]
        );
        $expenseRows = DB::select(
            "SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE profile_id = ? AND type = 'EXPENSE'",
            [$profileId]
        );

        $income = isset($incomeRows[0]) ? (float) ($incomeRows[0]->total ?? 0) : 0.0;
        $expense = isset($expenseRows[0]) ? (float) ($expenseRows[0]->total ?? 0) : 0.0;

        return response()->json([
            'income' => $income,
            'expense' => $expense,
            'balance' => $income - $expense,
        ]);
    }

    public function byCategory(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);
        $month = $request->query('month');
        $year = $request->query('year');

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        $conditions = ['t.profile_id = ?'];
        $params = [$profileId];

        if ($year !== null) {
            $conditions[] = 'YEAR(t.date) = ?';
            $params[] = (int) $year;
        }

        if ($month !== null) {
            $conditions[] = 'MONTH(t.date) = ?';
            $params[] = (int) $month;
        }

        $whereSql = implode(' AND ', $conditions);

        $rows = DB::select(
            "
            SELECT c.id, c.name, c.emoji, t.type, SUM(t.amount) AS total
            FROM transactions t
            JOIN categories c ON c.id = t.category_id
            WHERE {$whereSql}
            GROUP BY c.id, t.type
            ORDER BY total DESC
            ",
            $params
        );

        return response()->json($rows);
    }

    public function monthly(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);
        $year = (int) $request->query('year', 0);

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        if ($year === 0) {
            return response()->json(['error' => 'Parâmetro year é obrigatório'], 400);
        }

        $rows = DB::select(
            "
            SELECT
              YEAR(date) AS year,
              MONTH(date) AS month,
              COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END),0) AS income,
              COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END),0) AS expense
            FROM transactions
            WHERE profile_id = ?
              AND YEAR(date) = ?
            GROUP BY YEAR(date), MONTH(date)
            ORDER BY YEAR(date), MONTH(date)
            ",
            [$profileId, $year]
        );

        $data = array_map(static function ($row) {
            $year = (int) ($row->year ?? 0);
            $month = (int) ($row->month ?? 0);
            $income = (float) ($row->income ?? 0);
            $expense = (float) ($row->expense ?? 0);

            return [
                'year' => $year,
                'month' => $month,
                'income' => $income,
                'expense' => $expense,
                'balance' => $income - $expense,
            ];
        }, $rows);

        return response()->json($data);
    }

    public function annual(Request $request): JsonResponse
    {
        $profileId = (int) $request->attributes->get('profile_id', 0);

        if ($profileId === 0) {
            return response()->json(['error' => 'Header x-profile-id é obrigatório'], 400);
        }

        $rows = DB::select(
            "
            SELECT
              YEAR(date) AS year,
              COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END),0) AS income,
              COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END),0) AS expense
            FROM transactions
            WHERE profile_id = ?
            GROUP BY YEAR(date)
            ORDER BY YEAR(date)
            ",
            [$profileId]
        );

        $data = array_map(static function ($row) {
            $year = (int) ($row->year ?? 0);
            $income = (float) ($row->income ?? 0);
            $expense = (float) ($row->expense ?? 0);

            return [
                'year' => $year,
                'income' => $income,
                'expense' => $expense,
                'balance' => $income - $expense,
            ];
        }, $rows);

        return response()->json($data);
    }
}
