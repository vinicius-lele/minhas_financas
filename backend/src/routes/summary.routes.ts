import { FastifyInstance } from "fastify";
import { getSummary, getSummaryByCategory } from "../services/summary.service";
import { db } from "../database";

export async function summaryRoutes(app: FastifyInstance) {
  app.get("/", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    const userId = (req as any).user?.id as number | undefined;
    if (!userId) return reply.code(401).send({ error: "Usuário não autenticado" });
    if (!profileId) return reply.code(400).send({ error: "Header x-profile-id é obrigatório" });
    const owned = db
      .prepare(
        `SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?`
      )
      .get(userId, profileId) as { 1: number } | undefined;
    if (!owned) return reply.code(403).send({ error: "Perfil não pertence ao usuário" });
    return getSummary(profileId);
  });

  app.get("/categories", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    const userId = (req as any).user?.id as number | undefined;
    if (!userId) return reply.code(401).send({ error: "Usuário não autenticado" });
    if (!profileId) return reply.code(400).send({ error: "Header x-profile-id é obrigatório" });
    const owned = db
      .prepare(
        `SELECT 1 FROM user_profiles WHERE user_id = ? AND profile_id = ?`
      )
      .get(userId, profileId) as { 1: number } | undefined;
    if (!owned) return reply.code(403).send({ error: "Perfil não pertence ao usuário" });
    return getSummaryByCategory(profileId);
  });
}
