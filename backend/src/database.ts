import mysql from "mysql2/promise";

type MysqlConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export function getMysqlConfig(): MysqlConfig {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT || "3306");
  const user = process.env.DB_USER || "minhas_financas_user";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "minhas_financas";
  return { host, port, user, password, database };
}

export const pool = mysql.createPool({
  host: getMysqlConfig().host,
  port: getMysqlConfig().port,
  user: getMysqlConfig().user,
  password: getMysqlConfig().password,
  database: getMysqlConfig().database,
  connectionLimit: 10,
});

export async function initDatabase() {
  const conn = await pool.getConnection();
  try {
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        theme VARCHAR(50) NOT NULL DEFAULT 'blue'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id INT NOT NULL,
        profile_id INT NOT NULL,
        PRIMARY KEY (user_id, profile_id),
        CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_profiles_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(128) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at DATETIME NOT NULL,
        CONSTRAINT fk_password_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS revoked_tokens (
        jti VARCHAR(128) PRIMARY KEY,
        user_id INT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL,
        CONSTRAINT fk_revoked_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profile_id INT NOT NULL,
        name VARCHAR(120) NOT NULL,
        emoji VARCHAR(16) NOT NULL,
        type ENUM('INCOME', 'EXPENSE') NOT NULL,
        CONSTRAINT fk_categories_profile FOREIGN KEY (profile_id) REFERENCES profiles(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profile_id INT NOT NULL,
        category_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        type ENUM('INCOME', 'EXPENSE') NOT NULL,
        description TEXT NULL,
        date DATE NOT NULL,
        CONSTRAINT fk_transactions_profile FOREIGN KEY (profile_id) REFERENCES profiles(id),
        CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) REFERENCES categories(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS purchase_goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profile_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(120) NULL,
        target_amount DECIMAL(12,2) NOT NULL,
        current_amount_saved DECIMAL(12,2) NOT NULL DEFAULT 0,
        priority VARCHAR(32) NULL,
        deadline DATE NULL,
        notes TEXT NULL,
        is_completed TINYINT(1) NOT NULL DEFAULT 0,
        completed_at DATETIME NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        CONSTRAINT fk_purchase_goals_profile FOREIGN KEY (profile_id) REFERENCES profiles(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS savings_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        goal_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        date DATE NOT NULL,
        notes TEXT NULL,
        created_at DATETIME NOT NULL,
        CONSTRAINT fk_savings_goal FOREIGN KEY (goal_id) REFERENCES purchase_goals(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profile_id INT NOT NULL,
        category_id INT NOT NULL,
        month TINYINT NOT NULL,
        year INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        CONSTRAINT fk_budgets_profile FOREIGN KEY (profile_id) REFERENCES profiles(id),
        CONSTRAINT fk_budgets_category FOREIGN KEY (category_id) REFERENCES categories(id),
        UNIQUE KEY uq_budget (profile_id, category_id, month, year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    const [rows] = await conn.query("SELECT COUNT(*) as count FROM profiles");
    const count = Array.isArray(rows) ? (rows[0] as any).count as number : 0;
    if (count === 0) {
      await conn.query("INSERT INTO profiles (id, name, theme) VALUES (?, ?, ?)", [1, "Padrão", "blue"]);
    }
  } finally {
    conn.release();
  }
}
