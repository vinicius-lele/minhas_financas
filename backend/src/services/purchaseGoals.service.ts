import { db } from "../database";

export type Priority = "Baixa" | "Média" | "Alta" | "Urgente";

export interface PurchaseGoal {
  id: number;
  profile_id: number;
  name: string;
  category?: string | null;
  target_amount: number;
  current_amount_saved: number;
  priority?: Priority | string | null;
  deadline?: string | null;
  notes?: string | null;
  is_completed: number;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalFilters {
  q?: string;
  category?: string;
  priority?: string;
  status?: "active" | "completed";
  page?: number;
  pageSize?: number;
}

export function listGoals(profileId: number, filters: GoalFilters = {}): { data: PurchaseGoal[]; total: number } {
  const where: string[] = ["profile_id = ?"];
  const params: any[] = [profileId];
  if (filters.q) {
    where.push("name LIKE ?");
    params.push(`%${filters.q}%`);
  }
  if (filters.category) {
    where.push("category = ?");
    params.push(filters.category);
  }
  if (filters.priority) {
    where.push("priority = ?");
    params.push(filters.priority);
  }
  if (filters.status === "active") {
    where.push("is_completed = 0");
  } else if (filters.status === "completed") {
    where.push("is_completed = 1");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const page = Number(filters.page || 1);
  const pageSize = Number(filters.pageSize || 20);
  const offset = (page - 1) * pageSize;

  const total = (db.prepare(`SELECT COUNT(*) as count FROM purchase_goals ${whereSql}`).get(...params) as { count: number }).count;
  const data = db
    .prepare(`SELECT * FROM purchase_goals ${whereSql} ORDER BY is_completed ASC, updated_at DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset) as PurchaseGoal[];
  return { data, total };
}

export function createGoal(profileId: number, payload: Partial<PurchaseGoal>) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO purchase_goals (profile_id, name, category, target_amount, current_amount_saved, priority, deadline, notes, is_completed, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);
  const result = stmt.run(
    profileId,
    payload.name,
    payload.category ?? null,
    payload.target_amount,
    payload.current_amount_saved ?? 0,
    payload.priority ?? null,
    payload.deadline ?? null,
    payload.notes ?? null,
    now,
    now
  );
  return { id: Number(result.lastInsertRowid) };
}

export function updateGoal(id: number, payload: Partial<PurchaseGoal>) {
  const now = new Date().toISOString();
  const current = db.prepare("SELECT * FROM purchase_goals WHERE id = ?").get(id) as PurchaseGoal | undefined;
  if (!current) return 0;
  const stmt = db.prepare(`
    UPDATE purchase_goals SET
      name = COALESCE(?, name),
      category = COALESCE(?, category),
      target_amount = COALESCE(?, target_amount),
      current_amount_saved = COALESCE(?, current_amount_saved),
      priority = COALESCE(?, priority),
      deadline = COALESCE(?, deadline),
      notes = COALESCE(?, notes),
      updated_at = ?
    WHERE id = ?
  `);
  const res = stmt.run(
    payload.name ?? null,
    payload.category ?? null,
    payload.target_amount ?? null,
    payload.current_amount_saved ?? null,
    payload.priority ?? null,
    payload.deadline ?? null,
    payload.notes ?? null,
    now,
    id
  );
  return res.changes;
}

export function deleteGoal(id: number) {
  db.prepare("DELETE FROM savings_transactions WHERE goal_id = ?").run(id);
  const res = db.prepare("DELETE FROM purchase_goals WHERE id = ?").run(id);
  return res.changes;
}

export function completeGoal(id: number) {
  const now = new Date().toISOString();
  const res = db.prepare("UPDATE purchase_goals SET is_completed = 1, completed_at = ?, updated_at = ? WHERE id = ?").run(now, now, id);
  return res.changes;
}

export function addSaving(goalId: number, amount: number, date: string, notes?: string) {
  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO savings_transactions (goal_id, amount, date, notes, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(goalId, amount, date, notes ?? null, now);
  db.prepare("UPDATE purchase_goals SET current_amount_saved = current_amount_saved + ?, updated_at = ? WHERE id = ?").run(amount, now, goalId);
  return { id: Number(insert.lastInsertRowid) };
}

export function listSavings(goalId: number) {
  return db.prepare("SELECT * FROM savings_transactions WHERE goal_id = ? ORDER BY date DESC, id DESC").all(goalId);
}

export function getGoalsSummary(profileId: number) {
  const totals = db.prepare("SELECT COUNT(*) as total FROM purchase_goals WHERE profile_id = ?").get(profileId) as { total: number };
  const completed = db.prepare("SELECT COUNT(*) as total FROM purchase_goals WHERE profile_id = ? AND is_completed = 1").get(profileId) as { total: number };
  const active = db.prepare("SELECT COUNT(*) as total FROM purchase_goals WHERE profile_id = ? AND is_completed = 0").get(profileId) as { total: number };
  const savedActive = db.prepare("SELECT COALESCE(SUM(current_amount_saved),0) as total FROM purchase_goals WHERE profile_id = ? AND is_completed = 0").get(profileId) as { total: number };
  const remainingActive = db.prepare("SELECT COALESCE(SUM(target_amount - current_amount_saved),0) as total FROM purchase_goals WHERE profile_id = ? AND is_completed = 0").get(profileId) as { total: number };
  const overdue = db.prepare(`
    SELECT COUNT(*) as total FROM purchase_goals 
    WHERE profile_id = ? AND is_completed = 0 AND deadline IS NOT NULL AND deadline < date('now')
  `).get(profileId) as { total: number };
  const percent = totals.total > 0 ? Math.round((completed.total / totals.total) * 100) : 0;
  return {
    totalGoals: totals.total,
    completed: completed.total,
    active: active.total,
    overdue: overdue.total,
    percentCompleted: percent,
    totalSavedActive: savedActive.total,
    totalRemainingActive: remainingActive.total
  };
}
