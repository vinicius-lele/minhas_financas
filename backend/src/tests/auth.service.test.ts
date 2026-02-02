import "dotenv/config";
import assert from "assert";
import {
  hashPassword,
  verifyPassword,
  generateAuthToken,
  verifyAuthToken,
  createUser,
  findUserByEmail,
  createPasswordResetToken,
  resetPasswordWithToken,
  revokeToken,
  isTokenRevoked,
} from "../services/auth.service";

function isConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const e = error as any;
  const message = String(e.message || "");
  const code = String(e.code || "");
  if (message.includes("Access denied for user")) {
    return true;
  }
  if (code === "ER_ACCESS_DENIED_ERROR" || code === "ECONNREFUSED") {
    return true;
  }
  return false;
}

function logSkip(name: string, error: unknown) {
  const e = error as any;
  const message = e && typeof e === "object" && e.message ? String(e.message) : "";
  console.warn(`SKIP - ${name} (problema de conexão com MySQL)`);
  if (message) {
    console.warn(message);
  }
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      passed += 1;
      console.log(`OK - ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL - ${name}`);
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(String(error));
      }
    }
  }

  await test("hashPassword e verifyPassword funcionam corretamente", async () => {
    const password = "SenhaForte123!";
    const hash = await hashPassword(password);
    assert.ok(hash && hash !== password);
    const ok = await verifyPassword(password, hash);
    assert.strictEqual(ok, true);
    const wrong = await verifyPassword("outra-senha", hash);
    assert.strictEqual(wrong, false);
  });

  await test("createUser cria usuário único e impede duplicados", async () => {
    const name = "createUser cria usuário único e impede duplicados";
    try {
      const suffix = Date.now();
      const username = `user_test_${suffix}`;
      const email = `user_test_${suffix}@example.com`;
      const user = await createUser(username, email, "SenhaForte123!");
      assert.ok(user.id > 0);
      assert.strictEqual(user.username, username);
      assert.strictEqual(user.email, email);
      const again = await findUserByEmail(email);
      assert.ok(again);
      let duplicateError: Error | null = null;
      try {
        await createUser(username, `other_${suffix}@example.com`, "SenhaForte123!");
      } catch (err) {
        duplicateError = err as Error;
      }
      assert.ok(duplicateError);
      assert.strictEqual(duplicateError.message, "USERNAME_TAKEN");
    } catch (error) {
      if (isConnectionError(error)) {
        logSkip(name, error);
        return;
      }
      throw error;
    }
  });

  await test("generateAuthToken e verifyAuthToken retornam o mesmo payload", async () => {
    const name = "generateAuthToken e verifyAuthToken retornam o mesmo payload";
    try {
      const suffix = Date.now();
      const username = `user_jwt_${suffix}`;
      const email = `user_jwt_${suffix}@example.com`;
      const user = await createUser(username, email, "SenhaForte123!");
      const { token, payload } = generateAuthToken(user);
      assert.ok(token.length > 0);
      const decoded = verifyAuthToken(token);
      assert.strictEqual(decoded.sub, payload.sub);
      assert.strictEqual(decoded.username, payload.username);
      assert.strictEqual(decoded.email, payload.email);
      assert.strictEqual(typeof decoded.jti, "string");
    } catch (error) {
      if (isConnectionError(error)) {
        logSkip(name, error);
        return;
      }
      throw error;
    }
  });

  await test("revokeToken e isTokenRevoked controlam tokens revogados", async () => {
    const name = "revokeToken e isTokenRevoked controlam tokens revogados";
    try {
      const suffix = Date.now();
      const username = `user_revoke_${suffix}`;
      const email = `user_revoke_${suffix}@example.com`;
      const user = await createUser(username, email, "SenhaForte123!");
      const { payload } = generateAuthToken(user);
      assert.strictEqual(await isTokenRevoked(payload.jti), false);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await revokeToken(payload.jti, user.id, expiresAt);
      assert.strictEqual(await isTokenRevoked(payload.jti), true);
    } catch (error) {
      if (isConnectionError(error)) {
        logSkip(name, error);
        return;
      }
      throw error;
    }
  });

  await test("resetPasswordWithToken redefine a senha usando token válido", async () => {
    const name = "resetPasswordWithToken redefine a senha usando token válido";
    try {
      const suffix = Date.now();
      const username = `user_reset_${suffix}`;
      const email = `user_reset_${suffix}@example.com`;
      const originalPassword = "SenhaOriginal123!";
      const newPassword = "NovaSenha123!";
      const user = await createUser(username, email, originalPassword);
      const { token } = await createPasswordResetToken(user.id);
      await resetPasswordWithToken(token, newPassword);
      const row = await findUserByEmail(email);
      assert.ok(row);
      const ok = await verifyPassword(newPassword, row!.password_hash);
      assert.strictEqual(ok, true);
    } catch (error) {
      if (isConnectionError(error)) {
        logSkip(name, error);
        return;
      }
      throw error;
    }
  });

  console.log(`\nTotal: ${passed + failed} tests, ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTests().catch((error) => {
  console.error("Erro ao executar testes de autenticação");
  console.error(error);
  process.exit(1);
});
