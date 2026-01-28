import { FastifyInstance } from "fastify";
import { 
  listGoals, 
  createGoal, 
  updateGoal, 
  deleteGoal, 
  completeGoal, 
  addSaving, 
  listSavings, 
  getGoalsSummary 
} from "../services/purchaseGoals.service";

export async function purchaseGoalsRoutes(app: FastifyInstance) {
  // List with filters and pagination
  app.get("/", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    if (!profileId) return reply.code(400).send({ error: "Header x-profile-id é obrigatório" });
    const { q, category, priority, status, page, pageSize } = req.query || {};
    return listGoals(profileId, { q, category, priority, status, page: Number(page), pageSize: Number(pageSize) });
  });

  // Create
  app.post("/", async (req: any, reply) => {
    const profileId = Number(req.headers["x-profile-id"]);
    if (!profileId) return reply.code(400).send({ error: "Header x-profile-id é obrigatório" });

    const body = req.body as any;
    if (!body.name || typeof body.name !== "string") return reply.code(400).send({ error: "Nome inválido" });
    if (!body.target_amount || Number(body.target_amount) <= 0) return reply.code(400).send({ error: "Valor alvo inválido" });

    const res = createGoal(profileId, {
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
    const changes = updateGoal(id, req.body as any);
    if (changes === 0) return reply.code(404).send({ error: "Meta não encontrada" });
    return { ok: true };
  });

  // Delete
  app.delete<{ Params: { id: string } }>("/:id", async (req: any, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: "ID inválido" });
    const changes = deleteGoal(id);
    if (changes === 0) return reply.code(404).send({ error: "Meta não encontrada" });
    return reply.status(204).send();
  });

  // Complete goal
  app.post<{ Params: { id: string } }>("/:id/complete", async (req: any, reply) => {
    const id = Number(req.params.id);
    if (!id) return reply.code(400).send({ error: "ID inválido" });
    const changes = completeGoal(id);
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
    const res = addSaving(id, Number(amount), date, notes);
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
