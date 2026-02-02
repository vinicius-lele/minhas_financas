import { db } from "../database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRES_IN = "24h";
const BCRYPT_ROUNDS = 12;

type UserRow = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  is_active: number;
};

export type PublicUser = {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
};

export type AuthTokenPayload = {
  sub: number;
  username: string;
  email: string;
  jti: string;
};

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    is_active: !!row.is_active,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function findUserByEmailOrUsername(identifier: string): UserRow | undefined {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ? OR username = ?");
  const user = stmt.get(identifier, identifier) as UserRow | undefined;
  return user;
}

export function findUserByEmail(email: string): UserRow | undefined {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  return stmt.get(email) as UserRow | undefined;
}

export function findUserById(id: number): UserRow | undefined {
  const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
  return stmt.get(id) as UserRow | undefined;
}

export async function createUser(username: string, email: string, password: string): Promise<PublicUser> {
  const existingUsername = db.prepare("SELECT 1 FROM users WHERE username = ?").get(username) as { 1: number } | undefined;
  if (existingUsername) {
    throw new Error("USERNAME_TAKEN");
  }
  const existingEmail = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email) as { 1: number } | undefined;
  if (existingEmail) {
    throw new Error("EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const stmt = db.prepare("INSERT INTO users (username, email, password_hash, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)");
  const result = stmt.run(username, email, passwordHash, now, now);
  const user = findUserById(Number(result.lastInsertRowid));
  if (!user) {
    throw new Error("USER_CREATION_FAILED");
  }
  return toPublicUser(user);
}

export function generateAuthToken(user: PublicUser): { token: string; payload: AuthTokenPayload } {
  const jti = crypto.randomUUID();
  const payload: AuthTokenPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    jti,
  };
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  return { token, payload };
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  const payload: AuthTokenPayload = {
    sub: Number(decoded.sub),
    username: String(decoded.username),
    email: String(decoded.email),
    jti: String(decoded.jti),
  };
  return payload;
}

export function isTokenRevoked(jti: string): boolean {
  const row = db
    .prepare("SELECT jti FROM revoked_tokens WHERE jti = ?")
    .get(jti) as { jti: string } | undefined;
  return !!row;
}

export function revokeToken(jti: string, userId: number, expiresAt: Date): void {
  const stmt = db.prepare("INSERT OR REPLACE INTO revoked_tokens (jti, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)");
  stmt.run(jti, userId, expiresAt.toISOString(), new Date().toISOString());
}

export function createPasswordResetToken(userId: number): { token: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
  const stmt = db.prepare("INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)");
  stmt.run(userId, token, expiresAt.toISOString(), now.toISOString());
  return { token };
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
  const row = db
    .prepare("SELECT * FROM password_reset_tokens WHERE token = ?")
    .get(token) as { id: number; user_id: number; token: string; expires_at: string; used_at: string | null } | undefined;

  if (!row) {
    throw new Error("INVALID_TOKEN");
  }

  if (row.used_at) {
    throw new Error("TOKEN_ALREADY_USED");
  }

  const now = new Date();
  if (new Date(row.expires_at) < now) {
    throw new Error("TOKEN_EXPIRED");
  }

  const passwordHash = await hashPassword(newPassword);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(passwordHash, now.toISOString(), row.user_id);
  db.prepare("UPDATE password_reset_tokens SET used_at = ? WHERE id = ?").run(now.toISOString(), row.id);
}
