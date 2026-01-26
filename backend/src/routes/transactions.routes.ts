import { FastifyInstance } from "fastify";
import { listTransactions, createTransaction, updateTransaction, deleteTransaction, TransactionType } from "../services/transactions.service";

export async function transactionsRoutes(app: FastifyInstance) {
  app.get("/", async (req: any, reply) => {
    const { start, end } = req.query;
    const profileId = Number(req.headers["x-profile-id"]);

    if (!profileId) return reply.code(400).send({ error: "Header x-profile-id é obrigatório" });
    
    return listTransactions(profileId, start, end);
  });

  app.post("/", async (req, reply) => {
    const body = req.body as any;
    const profileId = Number(req.headers["x-profile-id"]);

    if (!profileId) return reply.code(400).send({ error: "Header x-profile-id é obrigatório" });
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
    deleteTransaction(id);
    return reply.status(204).send();
  });
}
