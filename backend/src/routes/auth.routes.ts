import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  createUser,
  findUserByEmail,
  findUserByEmailOrUsername,
  verifyPassword,
  generateAuthToken,
  verifyAuthToken,
  createPasswordResetToken,
  resetPasswordWithToken,
  isTokenRevoked,
  revokeToken,
  toPublicUser,
} from "../services/auth.service";

type LoginBody = {
  identifier: string;
  password: string;
};

type RegisterBody = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type ForgotPasswordBody = {
  email: string;
};

type ResetPasswordBody = {
  token: string;
  password: string;
  confirmPassword: string;
};

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (req: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return reply.code(400).send({ error: "Credenciais inválidas" });
    }

    const user = findUserByEmailOrUsername(identifier);
    if (!user || !user.is_active) {
      return reply.code(401).send({ error: "Usuário ou senha inválidos" });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return reply.code(401).send({ error: "Usuário ou senha inválidos" });
    }

    const publicUser = toPublicUser(user);
    const { token } = generateAuthToken(publicUser);
    return reply.send({
      token,
      user: publicUser,
    });
  });

  app.post("/register", async (req: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || username.length < 3) {
      return reply.code(400).send({ error: "Username inválido" });
    }
    if (!email || !email.includes("@")) {
      return reply.code(400).send({ error: "Email inválido" });
    }
    if (!password || password.length < 8) {
      return reply.code(400).send({ error: "Senha deve ter pelo menos 8 caracteres" });
    }
    if (password !== confirmPassword) {
      return reply.code(400).send({ error: "As senhas não conferem" });
    }

    try {
      const user = await createUser(username, email, password);
      const { token } = generateAuthToken(user);
      return reply.code(201).send({ token, user });
    } catch (err: any) {
      if (err instanceof Error) {
        if (err.message === "USERNAME_TAKEN") {
          return reply.code(400).send({ error: "Nome de usuário já está em uso" });
        }
        if (err.message === "EMAIL_TAKEN") {
          return reply.code(400).send({ error: "Email já está em uso" });
        }
      }
      return reply.code(500).send({ error: "Erro ao criar usuário" });
    }
  });

  app.post("/logout", async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.code(401).send({ error: "Token não informado" });
    }
    const token = authHeader.substring("Bearer ".length);
    try {
      const decoded = verifyAuthToken(token);
      if (isTokenRevoked(decoded.jti)) {
        return reply.code(200).send({ ok: true });
      }
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      revokeToken(decoded.jti, decoded.sub, expiresAt);
      return reply.code(200).send({ ok: true });
    } catch {
      return reply.code(401).send({ error: "Token inválido" });
    }
  });

  app.post("/forgot-password", async (req: FastifyRequest<{ Body: ForgotPasswordBody }>, reply: FastifyReply) => {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return reply.code(400).send({ error: "Email inválido" });
    }

    const user = findUserByEmail(email);
    if (user) {
      const { token } = createPasswordResetToken(user.id);
      return reply.code(200).send({ ok: true, resetToken: token });
    }

    return reply.code(200).send({ ok: true });
  });

  app.post("/reset-password", async (req: FastifyRequest<{ Body: ResetPasswordBody }>, reply: FastifyReply) => {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
      return reply.code(400).send({ error: "Token é obrigatório" });
    }
    if (!password || password.length < 8) {
      return reply.code(400).send({ error: "Senha deve ter pelo menos 8 caracteres" });
    }
    if (password !== confirmPassword) {
      return reply.code(400).send({ error: "As senhas não conferem" });
    }

    try {
      await resetPasswordWithToken(token, password);
      return reply.code(200).send({ ok: true });
    } catch (err: any) {
      if (err instanceof Error) {
        if (err.message === "INVALID_TOKEN") {
          return reply.code(400).send({ error: "Token inválido" });
        }
        if (err.message === "TOKEN_ALREADY_USED") {
          return reply.code(400).send({ error: "Token já utilizado" });
        }
        if (err.message === "TOKEN_EXPIRED") {
          return reply.code(400).send({ error: "Token expirado" });
        }
      }
      return reply.code(500).send({ error: "Não foi possível redefinir a senha" });
    }
  });
}
