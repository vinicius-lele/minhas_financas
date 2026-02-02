import { pool } from "../database";

export type CategoryType = "INCOME" | "EXPENSE";

export type Category = {
  id: number;
  name: string;
  emoji: string;
  type: CategoryType;
};

export async function listCategories(profileId: number, type?: CategoryType): Promise<Category[]> {
  if (type) {
    const [rows] = await pool.query(
      "SELECT * FROM categories WHERE profile_id = ? AND type = ?",
      [profileId, type]
    );
    return rows as Category[];
  }
  const [rows] = await pool.query(
    "SELECT * FROM categories WHERE profile_id = ?",
    [profileId]
  );
  return rows as Category[];
}

export async function createCategory(profileId: number, name: string, emoji: string, type: CategoryType): Promise<Category> {
  const [result] = await pool.query(
    "INSERT INTO categories (profile_id, name, emoji, type) VALUES (?, ?, ?, ?)",
    [profileId, name, emoji, type]
  );
  const res = result as any;
  return { id: Number(res.insertId), name, emoji, type };
}

export async function deleteCategory(id: number): Promise<number> {
  const [result] = await pool.query(
    "DELETE FROM categories WHERE id = ?",
    [id]
  );
  const res = result as any;
  return res.affectedRows as number;
}

export async function updateCategory(id: number, name: string, emoji: string, type: CategoryType): Promise<number> {
  const [result] = await pool.query(
    "UPDATE categories SET name = ?, emoji = ?, type = ? WHERE id = ?",
    [name, emoji, type, id]
  );
  const res = result as any;
  return res.affectedRows as number;
}
