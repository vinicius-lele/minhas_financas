<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $identifier = (string) $request->input('identifier', '');
        $password = (string) $request->input('password', '');

        if ($identifier === '' || $password === '') {
            return response()->json(['error' => 'Credenciais inválidas'], 400);
        }

        $user = AuthService::findUserByEmailOrUsername($identifier);

        if (!$user || !(bool) $user['is_active']) {
            return response()->json(['error' => 'Usuário ou senha inválidos'], 401);
        }

        if (!AuthService::verifyPassword($password, $user['password_hash'])) {
            return response()->json(['error' => 'Usuário ou senha inválidos'], 401);
        }

        $publicUser = AuthService::toPublicUser($user);
        $result = AuthService::generateAuthToken($publicUser);

        return response()->json([
            'token' => $result['token'],
            'user' => $publicUser,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $username = (string) $request->input('username', '');
        $email = (string) $request->input('email', '');
        $password = (string) $request->input('password', '');
        $confirmPassword = (string) $request->input('confirmPassword', '');

        if ($username === '' || mb_strlen($username) < 3) {
            return response()->json(['error' => 'Username inválido'], 400);
        }

        if ($email === '' || strpos($email, '@') === false) {
            return response()->json(['error' => 'Email inválido'], 400);
        }

        if ($password === '' || mb_strlen($password) < 8) {
            return response()->json(['error' => 'Senha deve ter pelo menos 8 caracteres'], 400);
        }

        if ($password !== $confirmPassword) {
            return response()->json(['error' => 'As senhas não conferem'], 400);
        }

        try {
            $user = AuthService::createUser($username, $email, $password);
            $result = AuthService::generateAuthToken($user);

            return response()->json(
                [
                    'token' => $result['token'],
                    'user' => $user,
                ],
                201
            );
        } catch (RuntimeException $e) {
            if ($e->getMessage() === 'USERNAME_TAKEN') {
                return response()->json(['error' => 'Nome de usuário já está em uso'], 400);
            }

            if ($e->getMessage() === 'EMAIL_TAKEN') {
                return response()->json(['error' => 'Email já está em uso'], 400);
            }

            return response()->json(['error' => 'Erro ao criar usuário'], 500);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['error' => 'Token não informado'], 401);
        }

        $token = substr($authHeader, 7);

        try {
            $payload = AuthService::verifyAuthToken($token);

            if (AuthService::isTokenRevoked($payload['jti'])) {
                return response()->json(['ok' => true]);
            }

            $expiresAt = Carbon::now()->addDay();
            AuthService::revokeToken($payload['jti'], $payload['sub'], $expiresAt);

            return response()->json(['ok' => true]);
        } catch (\Throwable) {
            return response()->json(['error' => 'Token inválido'], 401);
        }
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $email = (string) $request->input('email', '');

        if ($email === '' || strpos($email, '@') === false) {
            return response()->json(['error' => 'Email inválido'], 400);
        }

        $user = AuthService::findUserByEmail($email);

        if ($user) {
            $token = AuthService::createPasswordResetToken((int) $user['id']);

            return response()->json([
                'ok' => true,
                'resetToken' => $token,
            ]);
        }

        return response()->json(['ok' => true]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $token = (string) $request->input('token', '');
        $password = (string) $request->input('password', '');
        $confirmPassword = (string) $request->input('confirmPassword', '');

        if ($token === '') {
            return response()->json(['error' => 'Token é obrigatório'], 400);
        }

        if ($password === '' || mb_strlen($password) < 8) {
            return response()->json(['error' => 'Senha deve ter pelo menos 8 caracteres'], 400);
        }

        if ($password !== $confirmPassword) {
            return response()->json(['error' => 'As senhas não conferem'], 400);
        }

        try {
            AuthService::resetPasswordWithToken($token, $password);

            return response()->json(['ok' => true]);
        } catch (RuntimeException $e) {
            if ($e->getMessage() === 'INVALID_TOKEN') {
                return response()->json(['error' => 'Token inválido'], 400);
            }

            if ($e->getMessage() === 'TOKEN_ALREADY_USED') {
                return response()->json(['error' => 'Token já utilizado'], 400);
            }

            if ($e->getMessage() === 'TOKEN_EXPIRED') {
                return response()->json(['error' => 'Token expirado'], 400);
            }

            return response()->json(['error' => 'Não foi possível redefinir a senha'], 500);
        }
    }
}

