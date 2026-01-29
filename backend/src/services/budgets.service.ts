import { db } from '../database';

export function listBudgets(profileId: number, month: number, year: number) {
  return db.prepare(
    `SELECT b.id, b.profile_id, b.category_id, b.month, b.year, b.amount, 
            c.name as category_name, c.emoji as category_emoji, c.type as category_type
     FROM budgets b
     JOIN categories c ON b.category_id = c.id
     WHERE b.profile_id = ? AND b.month = ? AND b.year = ?
     ORDER BY c.name`
  ).all(profileId, month, year);
}

export function getBudgetByCategory(profileId: number, categoryId: number, month: number, year: number) {
  return db.prepare(
    `SELECT * FROM budgets 
     WHERE profile_id = ? AND category_id = ? AND month = ? AND year = ?`
  ).get(profileId, categoryId, month, year);
}

export function createBudget(profileId: number, categoryId: number, month: number, year: number, amount: number) {
  const stmt = db.prepare(
    `INSERT INTO budgets (profile_id, category_id, month, year, amount)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(profile_id, category_id, month, year) DO UPDATE SET amount = excluded.amount`
  );
  return stmt.run(profileId, categoryId, month, year, amount);
}

export function updateBudget(id: number, amount: number) {
  const stmt = db.prepare(
    `UPDATE budgets SET amount = ? WHERE id = ?`
  );
  return stmt.run(amount, id);
}

export function deleteBudget(id: number) {
  const stmt = db.prepare(
    `DELETE FROM budgets WHERE id = ?`
  );
  return stmt.run(id);
}

export function getBudgetSummary(profileId: number, month: number, year: number) {
  return db.prepare(
    `SELECT c.id as category_id, c.name as category_name, c.emoji as category_emoji, c.type,
            b.amount as budget_amount,
            COALESCE(SUM(t.amount), 0) as spent_amount
     FROM categories c
     JOIN budgets b ON c.id = b.category_id AND b.profile_id = ? AND b.month = ? AND b.year = ?
     LEFT JOIN transactions t ON c.id = t.category_id AND t.profile_id = ? AND 
            strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ? AND t.type = 'EXPENSE'
     WHERE c.profile_id = ? AND c.type = 'EXPENSE'
     GROUP BY c.id, c.name, c.emoji, c.type, b.amount
     ORDER BY c.name`
  ).all(profileId, month, year, profileId, String(month).padStart(2, '0'), String(year), profileId);
}