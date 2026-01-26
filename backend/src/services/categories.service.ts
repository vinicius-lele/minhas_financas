import { db } from "../database";

export type CategoryType = "INCOME" | "EXPENSE";

export type Category = {
  id: number;
  name: string;
  emoji: string;
  type: CategoryType;
};

export function listCategories(profileId: number, type?: CategoryType): Category[] {
  if (type) {
    return db
      .prepare("SELECT * FROM categories WHERE profile_id = ? AND type = ?")
      .all(profileId, type) as Category[];
  }

  return db.prepare("SELECT * FROM categories WHERE profile_id = ?").all(profileId) as Category[];
}

export function createCategory(profileId: number, name: string, emoji: string, type: CategoryType): Category {
  const stmt = db.prepare("INSERT INTO categories (profile_id, name, emoji, type) VALUES (?, ?, ?, ?)");
  const result = stmt.run(profileId, name, emoji, type);

  return { id: Number(result.lastInsertRowid), name, emoji, type };
}

export function deleteCategory(id: number): number {
  const result = db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  return result.changes;
}

export function updateCategory(id: number, name: string, emoji: string, type: CategoryType): number {
  const result = db.prepare("UPDATE categories SET name = ?, emoji = ?, type = ? WHERE id = ?").run(name, emoji, type, id);
  return result.changes;
}
