import { FastifyInstance } from "fastify";
import {
  listInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  getInvestmentsSummary,
} from "../services/investments.service";
import { pool } from "../database";

export async function investmentsRoutes(app: FastifyInstance) {
  app.get("/", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    const userId = (req as any).user?.id as number | undefined;

    if (!userId) {
      return reply.code(401).send({ error: "Usuário não autenticado" });
    }
    if (!profileId) {
      return reply
        .code(400)
        .send({ error: "Header x-profile-id é obrigatório" });
    }

    const [rows] = await pool.query(
      "SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?",
      [userId, profileId]
    );
    const owned = Array.isArray(rows) && rows.length > 0;
    if (!owned) {
      return reply
        .code(403)
        .send({ error: "Perfil não pertence ao usuário" });
    }

    const { q, category, broker, page, pageSize } = req.query || {};
    const result = await listInvestments(profileId, {
      q,
      category,
      broker,
      page: Number(page),
      pageSize: Number(pageSize),
    });
    return reply.send(result);
  });

  app.post("/", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    const userId = (req as any).user?.id as number | undefined;

    if (!userId) {
      return reply.code(401).send({ error: "Usuário não autenticado" });
    }
    if (!profileId) {
      return reply
        .code(400)
        .send({ error: "Header x-profile-id é obrigatório" });
    }

    const [rows] = await pool.query(
      "SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?",
      [userId, profileId]
    );
    const owned = Array.isArray(rows) && rows.length > 0;
    if (!owned) {
      return reply
        .code(403)
        .send({ error: "Perfil não pertence ao usuário" });
    }

    const body = req.body as any;
    if (!body?.name) {
      return reply.code(400).send({ error: "Nome é obrigatório" });
    }

    const investedAmount = Number(body.invested_amount ?? 0);
    if (!Number.isFinite(investedAmount) || investedAmount <= 0) {
      return reply
        .code(400)
        .send({ error: "Valor investido deve ser maior que zero" });
    }

    const currentValue =
      body.current_value != null ? Number(body.current_value) : investedAmount;

    const res = await createInvestment(profileId, {
      name: body.name,
      category: body.category ?? null,
      broker: body.broker ?? null,
      invested_amount: investedAmount,
      current_value: currentValue,
    });

    return reply.code(201).send(res);
  });

  app.put<{ Params: { id: string } }>("/:id", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    const userId = (req as any).user?.id as number | undefined;

    if (!userId) {
      return reply.code(401).send({ error: "Usuário não autenticado" });
    }
    if (!profileId) {
      return reply
        .code(400)
        .send({ error: "Header x-profile-id é obrigatório" });
    }

    const [rows] = await pool.query(
      "SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?",
      [userId, profileId]
    );
    const owned = Array.isArray(rows) && rows.length > 0;
    if (!owned) {
      return reply
        .code(403)
        .send({ error: "Perfil não pertence ao usuário" });
    }

    const id = Number(req.params.id);
    if (!id) {
      return reply.code(400).send({ error: "ID inválido" });
    }

    const body = req.body as any;
    const changes = await updateInvestment(id, {
      name: body?.name,
      category: body?.category ?? null,
      broker: body?.broker ?? null,
      invested_amount:
        body?.invested_amount != null ? Number(body.invested_amount) : undefined,
      current_value:
        body?.current_value != null ? Number(body.current_value) : undefined,
    });

    if (changes === 0) {
      return reply.code(404).send({ error: "Investimento não encontrado" });
    }

    return reply.send({ ok: true });
  });

  app.delete<{ Params: { id: string } }>("/:id", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    const userId = (req as any).user?.id as number | undefined;

    if (!userId) {
      return reply.code(401).send({ error: "Usuário não autenticado" });
    }
    if (!profileId) {
      return reply
        .code(400)
        .send({ error: "Header x-profile-id é obrigatório" });
    }

    const [rows] = await pool.query(
      "SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?",
      [userId, profileId]
    );
    const owned = Array.isArray(rows) && rows.length > 0;
    if (!owned) {
      return reply
        .code(403)
        .send({ error: "Perfil não pertence ao usuário" });
    }

    const id = Number(req.params.id);
    if (!id) {
      return reply.code(400).send({ error: "ID inválido" });
    }

    const changes = await deleteInvestment(id);
    if (changes === 0) {
      return reply.code(404).send({ error: "Investimento não encontrado" });
    }

    return reply.code(204).send();
  });

  app.get("/summary", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    const userId = (req as any).user?.id as number | undefined;

    if (!userId) {
      return reply.code(401).send({ error: "Usuário não autenticado" });
    }
    if (!profileId) {
      return reply
        .code(400)
        .send({ error: "Header x-profile-id é obrigatório" });
    }

    const [rows] = await pool.query(
      "SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?",
      [userId, profileId]
    );
    const owned = Array.isArray(rows) && rows.length > 0;
    if (!owned) {
      return reply
        .code(403)
        .send({ error: "Perfil não pertence ao usuário" });
    }

    const data = await getInvestmentsSummary(profileId);
    return reply.send(data);
  });
}

