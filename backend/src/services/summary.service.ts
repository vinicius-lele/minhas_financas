import { pool } from "../database";

export async function getSummary(profileId: number) {
  const [incomeRows] = await pool.query(
    "SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE profile_id = ? AND type = 'INCOME'",
    [profileId]
  );
  const [expenseRows] = await pool.query(
    "SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE profile_id = ? AND type = 'EXPENSE'",
    [profileId]
  );
  const income = (incomeRows as any[])[0]?.total as number | undefined;
  const expense = (expenseRows as any[])[0]?.total as number | undefined;
  const incomeTotal = income ?? 0;
  const expenseTotal = expense ?? 0;
  return { income: incomeTotal, expense: expenseTotal, balance: incomeTotal - expenseTotal };
}

export async function getSummaryByCategory(profileId: number) {
  const [rows] = await pool.query(
    `
    SELECT c.id, c.name, c.emoji, t.type, SUM(t.amount) AS total
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE t.profile_id = ?
    GROUP BY c.id, t.type
    ORDER BY total DESC
  `,
    [profileId]
  );
  return rows as any[];
}
