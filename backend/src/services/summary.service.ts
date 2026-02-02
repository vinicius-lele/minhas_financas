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

export async function getSummaryByCategory(
  profileId: number,
  year?: number,
  month?: number
) {
  const conditions = ["t.profile_id = ?"];
  const params: any[] = [profileId];

  if (year !== undefined) {
    conditions.push("YEAR(t.date) = ?");
    params.push(year);
  }

  if (month !== undefined) {
    conditions.push("MONTH(t.date) = ?");
    params.push(month);
  }

  const whereSql = conditions.join(" AND ");

  const [rows] = await pool.query(
    `
    SELECT c.id, c.name, c.emoji, t.type, SUM(t.amount) AS total
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE ${whereSql}
    GROUP BY c.id, t.type
    ORDER BY total DESC
  `,
    params
  );
  return rows as any[];
}

export async function getMonthlySummary(profileId: number, year: number) {
  const [rows] = await pool.query(
    `
    SELECT 
      MONTH(date) AS month,
      SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) AS expense
    FROM transactions
    WHERE profile_id = ? AND YEAR(date) = ?
    GROUP BY MONTH(date)
    ORDER BY MONTH(date)
  `,
    [profileId, year]
  );

  const raw = rows as any[];
  const byMonth = new Map<number, { income: number; expense: number }>();
  for (const row of raw) {
    const month = Number(row.month ?? 0);
    const income = Number(row.income ?? 0);
    const expense = Number(row.expense ?? 0);
    if (!Number.isFinite(month)) continue;
    byMonth.set(month, {
      income: Number.isFinite(income) ? income : 0,
      expense: Number.isFinite(expense) ? expense : 0,
    });
  }

  const result = [];
  for (let m = 1; m <= 12; m += 1) {
    const entry = byMonth.get(m) ?? { income: 0, expense: 0 };
    const income = entry.income;
    const expense = entry.expense;
    result.push({
      year,
      month: m,
      income,
      expense,
      balance: income - expense,
    });
  }

  return result;
}

export async function getAnnualProgression(profileId: number) {
  const [rows] = await pool.query(
    `
    SELECT 
      YEAR(date) AS year,
      SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) AS expense
    FROM transactions
    WHERE profile_id = ?
    GROUP BY YEAR(date)
    ORDER BY YEAR(date)
  `,
    [profileId]
  );

  const raw = rows as any[];
  return raw.map((row) => {
    const year = Number(row.year ?? 0);
    const incomeRaw = Number(row.income ?? 0);
    const expenseRaw = Number(row.expense ?? 0);
    const income = Number.isFinite(incomeRaw) ? incomeRaw : 0;
    const expense = Number.isFinite(expenseRaw) ? expenseRaw : 0;
    return {
      year,
      income,
      expense,
      balance: income - expense,
    };
  });
}
