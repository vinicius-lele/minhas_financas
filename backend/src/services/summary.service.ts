import { db } from "../database";

export function getSummary(profileId: number) {
  const income = db.prepare(`SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE profile_id=? AND type='INCOME'`).get(profileId) as { total: number };
  const expense = db.prepare(`SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE profile_id=? AND type='EXPENSE'`).get(profileId) as { total: number };
  return { income: income.total, expense: expense.total, balance: income.total - expense.total };
}

export function getSummaryByCategory(profileId: number) {
  return db.prepare(`
    SELECT c.id, c.name, c.emoji, t.type, SUM(t.amount) AS total
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE t.profile_id=?
    GROUP BY c.id, t.type
    ORDER BY total DESC
  `).all(profileId);
}
