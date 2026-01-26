import { db } from "../database";

export type TransactionType = "INCOME" | "EXPENSE";

export function listTransactions(profileId: number, start?: string, end?: string) {
  let sql = "SELECT * FROM transactions WHERE profile_id = ?";
  const params: any[] = [profileId];
  if (start && end) {
    sql += " AND date BETWEEN ? AND ?";
    params.push(start, end);
  }
  sql += " ORDER BY date DESC";
  return db.prepare(sql).all(...params);
}

export function createTransaction(profileId: number, categoryId: number, amount: number, type: TransactionType, date: string, description?: string) {
  const stmt = db.prepare("INSERT INTO transactions (profile_id, category_id, amount, type, date, description) VALUES (?, ?, ?, ?, ?, ?)");
  const result = stmt.run(profileId, categoryId, amount, type, date, description ?? null);
  return { id: result.lastInsertRowid };
}

export function updateTransaction(id: number, categoryId: number, amount: number, type: TransactionType, date: string, description?: string) {
  db.prepare("UPDATE transactions SET category_id = ?, amount = ?, type = ?, date = ?, description = ? WHERE id = ?")
    .run(categoryId, amount, type, date, description ?? null, id);
  return { ok: true };
}

export function deleteTransaction(id: number) {
  db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
}
