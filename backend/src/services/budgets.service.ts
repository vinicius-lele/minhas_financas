import { pool } from "../database";

export async function listBudgets(profileId: number, month: number, year: number) {
  const [rows] = await pool.query(
    `SELECT b.id, b.profile_id, b.category_id, b.month, b.year, b.amount, 
            c.name as category_name, c.emoji as category_emoji, c.type as category_type
     FROM budgets b
     JOIN categories c ON b.category_id = c.id
     WHERE b.profile_id = ? AND b.month = ? AND b.year = ?
     ORDER BY c.name`,
    [profileId, month, year]
  );
  return rows as any[];
}

export async function getBudgetByCategory(
  profileId: number,
  categoryId: number,
  month: number,
  year: number
) {
  const [rows] = await pool.query(
    `SELECT * FROM budgets 
     WHERE profile_id = ? AND category_id = ? AND month = ? AND year = ?`,
    [profileId, categoryId, month, year]
  );
  const arr = rows as any[];
  return arr[0];
}

export async function createBudget(
  profileId: number,
  categoryId: number,
  month: number,
  year: number,
  amount: number
) {
  await pool.query(
    `INSERT INTO budgets (profile_id, category_id, month, year, amount)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
    [profileId, categoryId, month, year, amount]
  );
}

export async function updateBudget(id: number, amount: number) {
  await pool.query("UPDATE budgets SET amount = ? WHERE id = ?", [amount, id]);
}

export async function deleteBudget(id: number) {
  await pool.query("DELETE FROM budgets WHERE id = ?", [id]);
}

export async function getBudgetSummary(profileId: number, month: number, year: number) {
  const [rows] = await pool.query(
    `SELECT c.id as category_id,
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
     ORDER BY c.name`,
    [profileId, month, year, profileId, month, year, profileId]
  );
  return rows as any[];
}
