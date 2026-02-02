import { pool } from "../database";

export async function listProfiles(userId: number) {
  const [rows] = await pool.query(
    `SELECT p.*
     FROM profiles p
     JOIN user_profiles up ON up.profile_id = p.id
     WHERE up.user_id = ?`,
    [userId]
  );
  return rows as any[];
}

export async function createProfile(userId: number, name: string, theme: string = "blue") {
  const [result] = await pool.query(
    "INSERT INTO profiles (name, theme) VALUES (?, ?)",
    [name, theme]
  );
  const insertResult = result as any;
  const profileId = Number(insertResult.insertId);
  await pool.query(
    "INSERT INTO user_profiles (user_id, profile_id) VALUES (?, ?)",
    [userId, profileId]
  );
  return { id: profileId, name, theme };
}

export async function deleteProfile(userId: number, id: number) {
  const [rows] = await pool.query(
    `SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?`,
    [userId, id]
  );
  const owned = Array.isArray(rows) && rows.length > 0;
  if (!owned) {
    return 0;
  }
  const [result] = await pool.query("DELETE FROM profiles WHERE id = ?", [id]);
  const res = result as any;
  return res.affectedRows as number;
}

export async function updateProfile(userId: number, id: number, name?: string, theme?: string) {
  const [rows] = await pool.query(
    `SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?`,
    [userId, id]
  );
  const owned = Array.isArray(rows) && rows.length > 0;
  if (!owned) {
    return 0;
  }

  let result;
  if (name && theme) {
    [result] = await pool.query(
      "UPDATE profiles SET name = ?, theme = ? WHERE id = ?",
      [name, theme, id]
    );
  } else if (name) {
    [result] = await pool.query(
      "UPDATE profiles SET name = ? WHERE id = ?",
      [name, id]
    );
  } else if (theme) {
    [result] = await pool.query(
      "UPDATE profiles SET theme = ? WHERE id = ?",
      [theme, id]
    );
  } else {
    return 0;
  }
  const res = result as any;
  return res.affectedRows as number;
}
