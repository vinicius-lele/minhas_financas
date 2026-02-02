import { FastifyInstance } from "fastify";
import {
  listGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  completeGoal,
  addSaving,
  listSavings,
  getGoalsSummary,
} from "../services/purchaseGoals.service";
import { pool } from "../database";

export async function purchaseGoalsRoutes(app: FastifyInstance) {
  // List with filters and pagination
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
    const { q, category, priority, status, page, pageSize } = req.query || {};
    return listGoals(profileId, { q, category, priority, status, page: Number(page), pageSize: Number(pageSize) });
  });

  // Create
  app.post("/", async (req: any, reply) => {
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

    const body = req.body as any;
    if (!body.name || typeof body.name !== "string") return reply.code(400).send({ error: "Nome inválido" });
    if (!body.target_amount || Number(body.target_amount) <= 0) return reply.code(400).send({ error: "Valor alvo inválido" });

    const res = await createGoal(profileId, {
      name: body.name,
      category: body.category,
      target_amount: Number(body.target_amount),
      current_amount_saved: Number(body.current_amount_saved || 0),
      priority: body.priority,
      deadline: body.deadline,
      notes: body.notes
    });
    return res;
  });

  // Update
  app.put<{ Params: { id: string } }>("/:id", async (req: any, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: "ID inválido" });
    const changes = await updateGoal(id, req.body as any);
    if (changes === 0) return reply.code(404).send({ error: "Meta não encontrada" });
    return { ok: true };
  });

  // Delete
  app.delete<{ Params: { id: string } }>("/:id", async (req: any, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: "ID inválido" });
    const changes = await deleteGoal(id);
    if (changes === 0) return reply.code(404).send({ error: "Meta não encontrada" });
    return reply.status(204).send();
  });

  // Complete goal
  app.post<{ Params: { id: string } }>("/:id/complete", async (req: any, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: "ID inválido" });
    const changes = await completeGoal(id);
    if (changes === 0) return reply.code(404).send({ error: "Meta não encontrada" });
    return { ok: true };
  });

  // Add saving contribution
  app.post<{ Params: { id: string } }>("/:id/savings", async (req: any, reply) => {
    const id = Number(req.params.id);
    const { amount, date, notes } = req.body || {};
    if (!id) return reply.code(400).send({ error: "ID inválido" });
    if (!amount || Number(amount) <= 0) return reply.code(400).send({ error: "Valor inválido" });
    if (!date) return reply.code(400).send({ error: "Data inválida" });
    const res = await addSaving(id, Number(amount), date, notes);
    return res;
  });

  // List savings
  app.get<{ Params: { id: string } }>("/:id/savings", async (req: any, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: "ID inválido" });
    return listSavings(id);
  });

  // Summary for dashboard
  app.get("/summary", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    if (!profileId) return reply.code(400).send({ error: "Header x-profile-id é obrigatório" });
    return getGoalsSummary(profileId);
  });
}
