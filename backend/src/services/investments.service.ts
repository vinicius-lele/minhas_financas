import { pool } from "../database";

export interface Investment {
  id: number;
  profile_id: number;
  name: string;
  category?: string | null;
  broker?: string | null;
  invested_amount: number;
  current_value: number;
  created_at: string;
  updated_at: string;
}

export interface InvestmentFilters {
  q?: string;
  category?: string;
  broker?: string;
  page?: number;
  pageSize?: number;
}

export interface InvestmentOverview {
  totalInvested: number;
  totalCurrent: number;
  totalProfit: number;
  totalProfitPercent: number;
  count: number;
}

export interface InvestmentCategorySummary {
  category: string | null;
  totalInvested: number;
  totalCurrent: number;
  profit: number;
}

export interface InvestmentsSummary {
  overview: InvestmentOverview;
  categories: InvestmentCategorySummary[];
}

export async function listInvestments(
  profileId: number,
  filters: InvestmentFilters = {}
): Promise<{ data: Investment[]; total: number }> {
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

  if (filters.broker) {
    where.push("broker = ?");
    params.push(filters.broker);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const page = Number(filters.page || 1);
  const pageSize = Number(filters.pageSize || 20);
  const offset = (page - 1) * pageSize;

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as count FROM investments ${whereSql}`,
    params
  );
  const total = (countRows as any[])[0]?.count as number | undefined;

  const [dataRows] = await pool.query(
    `SELECT * FROM investments ${whereSql} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );
  const data = dataRows as Investment[];
  return { data, total: total ?? 0 };
}

export async function createInvestment(
  profileId: number,
  payload: Partial<Investment>
) {
  const now = new Date();
  const invested = Number(payload.invested_amount ?? 0);
  const current = payload.current_value != null ? Number(payload.current_value) : invested;

  const [result] = await pool.query(
    `
    INSERT INTO investments (
      profile_id,
      name,
      category,
      broker,
      invested_amount,
      current_value,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      profileId,
      payload.name,
      payload.category ?? null,
      payload.broker ?? null,
      invested,
      current,
      now,
      now,
    ]
  );
  const res = result as any;
  return { id: Number(res.insertId) };
}

export async function updateInvestment(
  id: number,
  payload: Partial<Investment>
) {
  const now = new Date();
  const [rows] = await pool.query("SELECT * FROM investments WHERE id = ?", [
    id,
  ]);
  const current = (rows as Investment[])[0];
  if (!current) return 0;

  const investedAmount =
    payload.invested_amount != null
      ? Number(payload.invested_amount)
      : current.invested_amount;
  const currentValue =
    payload.current_value != null
      ? Number(payload.current_value)
      : current.current_value;

  const [result] = await pool.query(
    `
    UPDATE investments SET
      name = ?,
      category = ?,
      broker = ?,
      invested_amount = ?,
      current_value = ?,
      updated_at = ?
    WHERE id = ?
  `,
    [
      payload.name ?? current.name,
      payload.category ?? current.category ?? null,
      payload.broker ?? current.broker ?? null,
      investedAmount,
      currentValue,
      now,
      id,
    ]
  );
  const res = result as any;
  return res.affectedRows as number;
}

export async function deleteInvestment(id: number) {
  const [result] = await pool.query("DELETE FROM investments WHERE id = ?", [
    id,
  ]);
  const res = result as any;
  return res.affectedRows as number;
}

export async function getInvestmentsSummary(
  profileId: number
): Promise<InvestmentsSummary> {
  const [overviewRows] = await pool.query(
    `
    SELECT
      COALESCE(SUM(invested_amount), 0) AS totalInvested,
      COALESCE(SUM(current_value), 0) AS totalCurrent,
      COUNT(*) AS count
    FROM investments
    WHERE profile_id = ?
  `,
    [profileId]
  );

  const overviewRow = (overviewRows as any[])[0] as {
    totalInvested?: number;
    totalCurrent?: number;
    count?: number;
  };

  const totalInvested = Number(overviewRow?.totalInvested ?? 0);
  const totalCurrent = Number(overviewRow?.totalCurrent ?? 0);
  const count = Number(overviewRow?.count ?? 0);
  const totalProfit = totalCurrent - totalInvested;
  const totalProfitPercent =
    totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const [categoryRows] = await pool.query(
    `
    SELECT
      category,
      COALESCE(SUM(invested_amount), 0) AS totalInvested,
      COALESCE(SUM(current_value), 0) AS totalCurrent
    FROM investments
    WHERE profile_id = ?
    GROUP BY category
    ORDER BY totalCurrent DESC
  `,
    [profileId]
  );

  const categories = (categoryRows as any[]).map((row) => {
    const invested = Number(row.totalInvested ?? 0);
    const current = Number(row.totalCurrent ?? 0);
    const profit = current - invested;
    return {
      category: (row.category as string | null) ?? null,
      totalInvested: invested,
      totalCurrent: current,
      profit,
    } as InvestmentCategorySummary;
  });

  return {
    overview: {
      totalInvested,
      totalCurrent,
      totalProfit,
      totalProfitPercent,
      count,
    },
    categories,
  };
}

