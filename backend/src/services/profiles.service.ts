import { db } from "../database";

export function listProfiles(userId: number) {
  return db
    .prepare(
      `SELECT p.*
       FROM profiles p
       JOIN user_profiles up ON up.profile_id = p.id
       WHERE up.user_id = ?`
    )
    .all(userId);
}

export function createProfile(userId: number, name: string, theme: string = "blue") {
  const insertProfile = db.prepare("INSERT INTO profiles (name, theme) VALUES (?, ?)");
  const result = insertProfile.run(name, theme);
  const profileId = Number(result.lastInsertRowid);

  const link = db.prepare("INSERT INTO user_profiles (user_id, profile_id) VALUES (?, ?)");
  link.run(userId, profileId);

  return { id: profileId, name, theme };
}

export function deleteProfile(userId: number, id: number) {
  const owned = db
    .prepare(
      `SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?`
    )
    .get(userId, id) as { 1: number } | undefined;

  if (!owned) {
    return 0;
  }

  const result = db.prepare("DELETE FROM profiles WHERE id = ?").run(id);
  return result.changes;
}

export function updateProfile(userId: number, id: number, name?: string, theme?: string) {
  const owned = db
    .prepare(
      `SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?`
    )
    .get(userId, id) as { 1: number } | undefined;

  if (!owned) {
    return 0;
  }

  if (name && theme) {
    const result = db
      .prepare("UPDATE profiles SET name = ?, theme = ? WHERE id = ?")
      .run(name, theme, id);
    return result.changes;
  } else if (name) {
    const result = db
      .prepare("UPDATE profiles SET name = ? WHERE id = ?")
      .run(name, id);
    return result.changes;
  } else if (theme) {
    const result = db
      .prepare("UPDATE profiles SET theme = ? WHERE id = ?")
      .run(theme, id);
    return result.changes;
  }
  return 0;
}
