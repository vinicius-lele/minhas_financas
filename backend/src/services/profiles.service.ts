import { db } from "../database";

export function listProfiles() {
  return db.prepare("SELECT * FROM profiles").all();
}

export function createProfile(name: string, theme: string = 'blue') {
  const stmt = db.prepare("INSERT INTO profiles (name, theme) VALUES (?, ?)");
  const result = stmt.run(name, theme);
  return { id: result.lastInsertRowid, name, theme };
}

export function deleteProfile(id: number) {
  const result = db
    .prepare("DELETE FROM profiles WHERE id = ?")
    .run(id);

  return result.changes;
}

export function updateProfile(id: number, name?: string, theme?: string) {
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
