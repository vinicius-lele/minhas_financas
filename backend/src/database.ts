import Database from "better-sqlite3";

export const db = new Database("./database/database.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    description TEXT,
    date TEXT NOT NULL,
    FOREIGN KEY (profile_id) REFERENCES profiles(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
`);

// Migration: Add profile_id to categories if not exists
try {
  const tableInfo = db.pragma("table_info(categories)") as { name: string }[];
  const hasProfileId = tableInfo.some((col) => col.name === "profile_id");
  if (!hasProfileId) {
    db.exec("ALTER TABLE categories ADD COLUMN profile_id INTEGER NOT NULL DEFAULT 1 REFERENCES profiles(id)");
    console.log("Migração: Coluna profile_id adicionada à tabela categories");
  }
} catch (error) {
  console.error("Erro na migração de categories:", error);
}

// Seed initial profile if not exists
const profileCount = db.prepare("SELECT count(*) as count FROM profiles").get() as { count: number };
if (profileCount.count === 0) {
  db.prepare("INSERT INTO profiles (id, name) VALUES (?, ?)").run(1, "Padrão");
  console.log("Perfil padrão criado com ID 1");
}
