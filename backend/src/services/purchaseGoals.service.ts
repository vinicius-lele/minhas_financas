import { pool } from "../database";

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

export async function listGoals(
  profileId: number,
  filters: GoalFilters = {}
): Promise<{ data: PurchaseGoal[]; total: number }> {
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

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as count FROM purchase_goals ${whereSql}`,
    params
  );
  const total = (countRows as any[])[0]?.count as number | undefined;

  const [dataRows] = await pool.query(
    `SELECT * FROM purchase_goals ${whereSql} ORDER BY is_completed ASC, updated_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  const data = dataRows as PurchaseGoal[];
  return { data, total: total ?? 0 };
}

export async function createGoal(profileId: number, payload: Partial<PurchaseGoal>) {
  const now = new Date();
  const [result] = await pool.query(
    `INSERT INTO purchase_goals (profile_id, name, category, target_amount, current_amount_saved, priority, deadline, notes, is_completed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      profileId,
      payload.name,
      payload.category ?? null,
      payload.target_amount,
      payload.current_amount_saved ?? 0,
      payload.priority ?? null,
      payload.deadline ?? null,
      payload.notes ?? null,
      now,
      now,
    ]
  );
  const res = result as any;
  return { id: Number(res.insertId) };
}

export async function updateGoal(id: number, payload: Partial<PurchaseGoal>) {
  const now = new Date();
  const [rows] = await pool.query("SELECT * FROM purchase_goals WHERE id = ?", [id]);
  const current = (rows as PurchaseGoal[])[0];
  if (!current) return 0;

  const updated = {
    name: payload.name ?? current.name,
    category: payload.category ?? current.category,
    target_amount: payload.target_amount ?? current.target_amount,
    current_amount_saved: payload.current_amount_saved ?? current.current_amount_saved,
    priority: payload.priority ?? current.priority,
    deadline: payload.deadline ?? current.deadline,
    notes: payload.notes ?? current.notes,
  };

  const [result] = await pool.query(
    `
    UPDATE purchase_goals SET
      name = ?,
      category = ?,
      target_amount = ?,
      current_amount_saved = ?,
      priority = ?,
      deadline = ?,
      notes = ?,
      updated_at = ?
    WHERE id = ?
  `,
    [
      updated.name,
      updated.category,
      updated.target_amount,
      updated.current_amount_saved,
      updated.priority,
      updated.deadline,
      updated.notes,
      now,
      id,
    ]
  );
  const res = result as any;
  return res.affectedRows as number;
}

export async function deleteGoal(id: number) {
  await pool.query("DELETE FROM savings_transactions WHERE goal_id = ?", [id]);
  const [result] = await pool.query("DELETE FROM purchase_goals WHERE id = ?", [id]);
  const res = result as any;
  return res.affectedRows as number;
}

export async function completeGoal(id: number) {
  const now = new Date();
  const [result] = await pool.query(
    "UPDATE purchase_goals SET is_completed = 1, completed_at = ?, updated_at = ? WHERE id = ?",
    [now, now, id]
  );
  const res = result as any;
  return res.affectedRows as number;
}

export async function addSaving(goalId: number, amount: number, date: string, notes?: string) {
  const now = new Date();
  const [insertResult] = await pool.query(
    `
    INSERT INTO savings_transactions (goal_id, amount, date, notes, created_at)
    VALUES (?, ?, ?, ?, ?)
  `,
    [goalId, amount, date, notes ?? null, now]
  );
  await pool.query(
    "UPDATE purchase_goals SET current_amount_saved = current_amount_saved + ?, updated_at = ? WHERE id = ?",
    [amount, now, goalId]
  );
  const res = insertResult as any;
  return { id: Number(res.insertId) };
}

export async function listSavings(goalId: number) {
  const [rows] = await pool.query(
    "SELECT * FROM savings_transactions WHERE goal_id = ? ORDER BY date DESC, id DESC",
    [goalId]
  );
  return rows as any[];
}

export async function getGoalsSummary(profileId: number) {
  const [totalsRows] = await pool.query(
    "SELECT COUNT(*) as total FROM purchase_goals WHERE profile_id = ?",
    [profileId]
  );
  const [completedRows] = await pool.query(
    "SELECT COUNT(*) as total FROM purchase_goals WHERE profile_id = ? AND is_completed = 1",
    [profileId]
  );
  const [activeRows] = await pool.query(
    "SELECT COUNT(*) as total FROM purchase_goals WHERE profile_id = ? AND is_completed = 0",
    [profileId]
  );
  const [savedRows] = await pool.query(
    "SELECT COALESCE(SUM(current_amount_saved),0) as total FROM purchase_goals WHERE profile_id = ? AND is_completed = 0",
    [profileId]
  );
  const [remainingRows] = await pool.query(
    "SELECT COALESCE(SUM(target_amount - current_amount_saved),0) as total FROM purchase_goals WHERE profile_id = ? AND is_completed = 0",
    [profileId]
  );
  const [overdueRows] = await pool.query(
    `
    SELECT COUNT(*) as total FROM purchase_goals 
    WHERE profile_id = ?
      AND is_completed = 0
      AND deadline IS NOT NULL
      AND deadline < CURDATE()
  `,
    [profileId]
  );

  const totals = (totalsRows as any[])[0]?.total as number | undefined;
  const completed = (completedRows as any[])[0]?.total as number | undefined;
  const active = (activeRows as any[])[0]?.total as number | undefined;
  const savedActive = (savedRows as any[])[0]?.total as number | undefined;
  const remainingActive = (remainingRows as any[])[0]?.total as number | undefined;
  const overdue = (overdueRows as any[])[0]?.total as number | undefined;

  const totalGoals = totals ?? 0;
  const completedCount = completed ?? 0;
  const percent = totalGoals > 0 ? Math.round((completedCount / totalGoals) * 100) : 0;

  return {
    totalGoals,
    completed: completedCount,
    active: active ?? 0,
    overdue: overdue ?? 0,
    percentCompleted: percent,
    totalSavedActive: savedActive ?? 0,
    totalRemainingActive: remainingActive ?? 0,
  };
}
