import { pool } from "../database";

export type TransactionType = "INCOME" | "EXPENSE";

export async function listTransactions(profileId: number, start?: string, end?: string) {
  let sql = "SELECT * FROM transactions WHERE profile_id = ?";
  const params: any[] = [profileId];
  if (start && end) {
    sql += " AND date BETWEEN ? AND ?";
    params.push(start, end);
  }
  sql += " ORDER BY date DESC";
  const [rows] = await pool.query(sql, params);
  return rows as any[];
}

export async function createTransaction(
  profileId: number,
  categoryId: number,
  amount: number,
  type: TransactionType,
  date: string,
  description?: string
) {
  const [result] = await pool.query(
    "INSERT INTO transactions (profile_id, category_id, amount, type, date, description) VALUES (?, ?, ?, ?, ?, ?)",
    [profileId, categoryId, amount, type, date, description ?? null]
  );
  const res = result as any;
  return { id: Number(res.insertId) };
}

export async function updateTransaction(
  id: number,
  categoryId: number,
  amount: number,
  type: TransactionType,
  date: string,
  description?: string
) {
  await pool.query(
    "UPDATE transactions SET category_id = ?, amount = ?, type = ?, date = ?, description = ? WHERE id = ?",
    [categoryId, amount, type, date, description ?? null, id]
  );
  return { ok: true };
}

export async function deleteTransaction(id: number) {
  await pool.query("DELETE FROM transactions WHERE id = ?", [id]);
}
