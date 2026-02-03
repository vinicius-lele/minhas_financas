<?php

namespace App\Services;

use Carbon\Carbon;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class AuthService
{
    public static function toPublicUser(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'username' => $row['username'],
            'email' => $row['email'],
            'is_active' => (bool) $row['is_active'],
        ];
    }

    protected static function jwtSecret(): string
    {
        $secret = env('JWT_SECRET', '');
        if ($secret === '') {
            throw new RuntimeException('JWT_SECRET não definido');
        }
        return $secret;
    }

    public static function findUserByEmailOrUsername(string $identifier): ?array
    {
        $row = DB::selectOne(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [$identifier, $identifier]
        );

        return $row ? (array) $row : null;
    }

    public static function findUserByEmail(string $email): ?array
    {
        $row = DB::selectOne(
            'SELECT * FROM users WHERE email = ?',
            [$email]
        );

        return $row ? (array) $row : null;
    }

    public static function findUserById(int $id): ?array
    {
        $row = DB::selectOne(
            'SELECT * FROM users WHERE id = ?',
            [$id]
        );

        return $row ? (array) $row : null;
    }

    public static function createUser(string $username, string $email, string $password): array
    {
        $existingUsername = DB::selectOne(
            'SELECT 1 FROM users WHERE username = ?',
            [$username]
        );
        if ($existingUsername) {
            throw new RuntimeException('USERNAME_TAKEN');
        }

        $existingEmail = DB::selectOne(
            'SELECT 1 FROM users WHERE email = ?',
            [$email]
        );
        if ($existingEmail) {
            throw new RuntimeException('EMAIL_TAKEN');
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $now = Carbon::now();

        DB::insert(
            'INSERT INTO users (username, email, password_hash, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)',
            [
                $username,
                $email,
                $passwordHash,
                $now->format('Y-m-d H:i:s'),
                $now->format('Y-m-d H:i:s'),
            ]
        );

        $id = (int) DB::getPdo()->lastInsertId();
        $user = self::findUserById($id);
        if (!$user) {
            throw new RuntimeException('USER_CREATION_FAILED');
        }

        return self::toPublicUser($user);
    }

    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    public static function generateAuthToken(array $user): array
    {
        $jti = (string) Str::uuid();

        $payload = [
            'sub' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'jti' => $jti,
            'exp' => time() + 24 * 60 * 60,
        ];

        $token = JWT::encode($payload, self::jwtSecret(), 'HS256');

        return [
            'token' => $token,
            'payload' => [
                'sub' => (int) $payload['sub'],
                'username' => (string) $payload['username'],
                'email' => (string) $payload['email'],
                'jti' => (string) $payload['jti'],
            ],
        ];
    }

    public static function verifyAuthToken(string $token): array
    {
        $decoded = (array) JWT::decode($token, new Key(self::jwtSecret(), 'HS256'));

        return [
            'sub' => (int) ($decoded['sub'] ?? 0),
            'username' => (string) ($decoded['username'] ?? ''),
            'email' => (string) ($decoded['email'] ?? ''),
            'jti' => (string) ($decoded['jti'] ?? ''),
        ];
    }

    public static function isTokenRevoked(string $jti): bool
    {
        $row = DB::selectOne(
            'SELECT jti FROM revoked_tokens WHERE jti = ?',
            [$jti]
        );

        return $row !== null;
    }

    public static function revokeToken(string $jti, int $userId, Carbon $expiresAt): void
    {
        $now = Carbon::now();

        DB::statement(
            'INSERT INTO revoked_tokens (jti, user_id, expires_at, created_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), expires_at = VALUES(expires_at), created_at = VALUES(created_at)',
            [
                $jti,
                $userId,
                $expiresAt->format('Y-m-d H:i:s'),
                $now->format('Y-m-d H:i:s'),
            ]
        );
    }

    public static function createPasswordResetToken(int $userId): string
    {
        $token = bin2hex(random_bytes(32));
        $now = Carbon::now();
        $expiresAt = $now->copy()->addHour();

        DB::insert(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)',
            [
                $userId,
                $token,
                $expiresAt->format('Y-m-d H:i:s'),
                $now->format('Y-m-d H:i:s'),
            ]
        );

        return $token;
    }

    public static function resetPasswordWithToken(string $token, string $newPassword): void
    {
        $row = DB::selectOne(
            'SELECT * FROM password_reset_tokens WHERE token = ?',
            [$token]
        );

        if (!$row) {
            throw new RuntimeException('INVALID_TOKEN');
        }

        $data = (array) $row;

        if (!empty($data['used_at'])) {
            throw new RuntimeException('TOKEN_ALREADY_USED');
        }

        $now = Carbon::now();
        $expiresAt = isset($data['expires_at']) ? Carbon::parse($data['expires_at']) : null;

        if ($expiresAt && $expiresAt->lt($now)) {
            throw new RuntimeException('TOKEN_EXPIRED');
        }

        $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);

        DB::update(
            'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
            [
                $passwordHash,
                $now->format('Y-m-d H:i:s'),
                (int) $data['user_id'],
            ]
        );

        DB::update(
            'UPDATE password_reset_tokens SET used_at = ? WHERE id = ?',
            [
                $now->format('Y-m-d H:i:s'),
                (int) $data['id'],
            ]
        );
    }
}

