import { FastifyInstance } from "fastify";
import { getSummary, getSummaryByCategory } from "../services/summary.service";

export async function summaryRoutes(app: FastifyInstance) {
  app.get("/", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    if (!profileId) return reply.code(400).send({ error: "Header x-profile-id é obrigatório" });
    return getSummary(profileId);
  });

  app.get("/categories", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    if (!profileId) return reply.code(400).send({ error: "Header x-profile-id é obrigatório" });
    return getSummaryByCategory(profileId);
  });
}
