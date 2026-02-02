import Database from "better-sqlite3";

export const db = new Database("./database/database.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INTEGER NOT NULL,
    profile_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, profile_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS revoked_tokens (
    jti TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    theme TEXT NOT NULL DEFAULT 'blue'
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

  CREATE TABLE IF NOT EXISTS purchase_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    target_amount REAL NOT NULL CHECK (target_amount > 0),
    current_amount_saved REAL NOT NULL DEFAULT 0,
    priority TEXT,
    deadline TEXT,
    notes TEXT,
    is_completed INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (profile_id) REFERENCES profiles(id)
  );

  CREATE TABLE IF NOT EXISTS savings_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (goal_id) REFERENCES purchase_goals(id)
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    FOREIGN KEY (profile_id) REFERENCES profiles(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    UNIQUE(profile_id, category_id, month, year)
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

// Migration: Add theme to profiles if not exists
try {
  const tableInfo = db.pragma("table_info(profiles)") as { name: string }[];
  const hasTheme = tableInfo.some((col) => col.name === "theme");
  if (!hasTheme) {
    db.exec("ALTER TABLE profiles ADD COLUMN theme TEXT NOT NULL DEFAULT 'blue'");
    console.log("Migração: Coluna theme adicionada à tabela profiles");
  }
} catch (error) {
  console.error("Erro na migração de profiles:", error);
}

// Seed initial profile if not exists
const profileCount = db.prepare("SELECT count(*) as count FROM profiles").get() as { count: number };
if (profileCount.count === 0) {
  db.prepare("INSERT INTO profiles (id, name, theme) VALUES (?, ?, ?)").run(1, "Padrão", "blue");
  console.log("Perfil padrão criado com ID 1");
}
