import { pool } from "../database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET: string = process.env.JWT_SECRET || "";
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não definido nas variáveis de ambiente");
}
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

export async function findUserByEmailOrUsername(identifier: string): Promise<UserRow | undefined> {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE email = ? OR username = ?",
    [identifier, identifier]
  );
  const arr = rows as UserRow[];
  return arr[0];
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  const arr = rows as UserRow[];
  return arr[0];
}

export async function findUserById(id: number): Promise<UserRow | undefined> {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  const arr = rows as UserRow[];
  return arr[0];
}

export async function createUser(username: string, email: string, password: string): Promise<PublicUser> {
  const [rowsUsername] = await pool.query("SELECT 1 FROM users WHERE username = ?", [username]);
  const existingUsername = Array.isArray(rowsUsername) && rowsUsername.length > 0;
  if (existingUsername) {
    throw new Error("USERNAME_TAKEN");
  }
  const [rowsEmail] = await pool.query("SELECT 1 FROM users WHERE email = ?", [email]);
  const existingEmail = Array.isArray(rowsEmail) && rowsEmail.length > 0;
  if (existingEmail) {
    throw new Error("EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();
  const [result] = await pool.query(
    "INSERT INTO users (username, email, password_hash, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)",
    [username, email, passwordHash, now, now]
  );
  const res = result as any;
  const user = await findUserById(Number(res.insertId));
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

export async function isTokenRevoked(jti: string): Promise<boolean> {
  const [rows] = await pool.query(
    "SELECT jti FROM revoked_tokens WHERE jti = ?",
    [jti]
  );
  const arr = rows as { jti: string }[];
  return Array.isArray(arr) && arr.length > 0;
}

export async function revokeToken(jti: string, userId: number, expiresAt: Date): Promise<void> {
  const now = new Date();
  await pool.query(
    "INSERT INTO revoked_tokens (jti, user_id, expires_at, created_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), expires_at = VALUES(expires_at), created_at = VALUES(created_at)",
    [jti, userId, expiresAt, now]
  );
}

export async function createPasswordResetToken(userId: number): Promise<{ token: string }> {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
  await pool.query(
    "INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)",
    [userId, token, expiresAt, now]
  );
  return { token };
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
  const [rows] = await pool.query(
    "SELECT * FROM password_reset_tokens WHERE token = ?",
    [token]
  );
  const row = (rows as any[])[0] as { id: number; user_id: number; token: string; expires_at: Date; used_at: Date | null } | undefined;

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
  await pool.query(
    "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
    [passwordHash, now, row.user_id]
  );
  await pool.query(
    "UPDATE password_reset_tokens SET used_at = ? WHERE id = ?",
    [now, row.id]
  );
}
