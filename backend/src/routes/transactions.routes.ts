import { FastifyInstance } from "fastify";
import { listTransactions, createTransaction, updateTransaction, deleteTransaction, TransactionType } from "../services/transactions.service";
import { pool } from "../database";

export async function transactionsRoutes(app: FastifyInstance) {
  app.get("/", async (req: any, reply) => {
    const { start, end } = req.query;
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
    
    return listTransactions(profileId, start, end);
  });

  app.post("/", async (req, reply) => {
    const body = req.body as any;
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
    if (!body.categoryId) return reply.code(400).send({ error: "categoryId inválido" });
    if (!body.amount) return reply.code(400).send({ error: "Valor inválido" });
    if (body.type !== "INCOME" && body.type !== "EXPENSE") return reply.code(400).send({ error: "Tipo inválido" });
    if (!body.date) return reply.code(400).send({ error: "Data inválida" });

    return createTransaction(profileId, Number(body.categoryId), body.amount, body.type, body.date, body.description);
  });

  app.put<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const body = req.body as any;
    if (!id) return reply.code(400).send({ error: "ID inválido" });
    if (!body.categoryId) return reply.code(400).send({ error: "categoryId inválido" });
    if (!body.amount) return reply.code(400).send({ error: "Valor inválido" });

    return updateTransaction(id, Number(body.categoryId), body.amount, body.type, body.date, body.description);
  });

  app.delete<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: "ID inválido" });
    await deleteTransaction(id);
    return reply.status(204).send();
  });
}
