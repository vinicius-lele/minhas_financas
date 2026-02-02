import { FastifyInstance } from "fastify";
import { getSummary, getSummaryByCategory, getMonthlySummary, getAnnualProgression } from "../services/summary.service";
import { pool } from "../database";

export async function summaryRoutes(app: FastifyInstance) {
  app.get("/", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    const userId = (req as any).user?.id as number | undefined;
    if (!userId) return reply.code(401).send({ error: "Usuário não autenticado" });
    if (!profileId) return reply.code(400).send({ error: "Header x-profile-id é obrigatório" });
    const [rows] = await pool.query(
      "SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?",
      [userId, profileId]
    );
    const owned = Array.isArray(rows) && rows.length > 0;
    if (!owned) return reply.code(403).send({ error: "Perfil não pertence ao usuário" });
    return getSummary(profileId);
  });

  app.get("/categories", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    const userId = (req as any).user?.id as number | undefined;
    const { month, year } = req.query ?? {};

    if (!userId) return reply.code(401).send({ error: "Usuário não autenticado" });
    if (!profileId) return reply.code(400).send({ error: "Header x-profile-id é obrigatório" });

    const [rows] = await pool.query(
      "SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?",
      [userId, profileId]
    );
    const owned = Array.isArray(rows) && rows.length > 0;
    if (!owned) return reply.code(403).send({ error: "Perfil não pertence ao usuário" });

    let parsedYear: number | undefined;
    let parsedMonth: number | undefined;

    if (year !== undefined) {
      const n = Number(year);
      if (!Number.isFinite(n) || n < 1900) {
        return reply.code(400).send({ error: "Ano inválido" });
      }
      parsedYear = n;
    }

    if (month !== undefined) {
      const m = Number(month);
      if (!Number.isFinite(m) || m < 1 || m > 12) {
        return reply.code(400).send({ error: "Mês inválido" });
      }
      parsedMonth = m;
    }

    const data = await getSummaryByCategory(profileId, parsedYear, parsedMonth);
    return reply.send(data);
  });

  app.get("/monthly", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    const userId = (req as any).user?.id as number | undefined;
    const yearParam = req.query?.year;
    const now = new Date();
    const year = yearParam ? Number(yearParam) : now.getFullYear();

    if (!userId) return reply.code(401).send({ error: "Usuário não autenticado" });
    if (!profileId) return reply.code(400).send({ error: "Header x-profile-id é obrigatório" });
    if (!Number.isFinite(year) || year < 1900) {
      return reply.code(400).send({ error: "Ano inválido" });
    }

    const [rows] = await pool.query(
      "SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?",
      [userId, profileId]
    );
    const owned = Array.isArray(rows) && rows.length > 0;
    if (!owned) return reply.code(403).send({ error: "Perfil não pertence ao usuário" });

    const data = await getMonthlySummary(profileId, year);
    return reply.send(data);
  });

  app.get("/annual", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    const userId = (req as any).user?.id as number | undefined;

    if (!userId) return reply.code(401).send({ error: "Usuário não autenticado" });
    if (!profileId) return reply.code(400).send({ error: "Header x-profile-id é obrigatório" });

    const [rows] = await pool.query(
      "SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?",
      [userId, profileId]
    );
    const owned = Array.isArray(rows) && rows.length > 0;
    if (!owned) return reply.code(403).send({ error: "Perfil não pertence ao usuário" });

    const data = await getAnnualProgression(profileId);
    return reply.send(data);
  });
}
