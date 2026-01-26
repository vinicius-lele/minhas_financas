import { db } from "../database";

export function listProfiles() {
  return db.prepare("SELECT * FROM profiles").all();
}

export function createProfile(name: string) {
  const stmt = db.prepare("INSERT INTO profiles (name) VALUES (?)");
  const result = stmt.run(name);
  return { id: result.lastInsertRowid, name };
}

export function deleteProfile(id: number) {
  const result = db
    .prepare("DELETE FROM profiles WHERE id = ?")
    .run(id);

  return result.changes;
}

export function updateProfile(id: number, name: string) {
  const result = db
    .prepare("UPDATE profiles SET name = ? WHERE id = ?")
    .run(name, id);
  return result.changes;
}
