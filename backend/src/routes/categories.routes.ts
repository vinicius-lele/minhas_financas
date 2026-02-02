import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { listCategories, createCategory, deleteCategory, updateCategory, CategoryType } from "../services/categories.service";
import { pool } from "../database";

export async function categoriesRoutes(app: FastifyInstance) {
  
  // GET /categories?type=INCOME
  app.get("/", async (req: FastifyRequest<{ Querystring: { type?: CategoryType } }>, reply) => {
    const { type } = req.query;
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

    return listCategories(profileId, type);
  });

  // POST /categories
  app.post("/", async (req: FastifyRequest<{ Body: { name: string; emoji: string; type: CategoryType } }>, reply: FastifyReply) => {
    const { name, emoji, type } = req.body;
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
    if (!name || name.length < 2) return reply.code(400).send({ error: "Nome inválido" });
    if (!emoji || emoji.length > 4) return reply.code(400).send({ error: "Emoji inválido" });
    if (type !== "INCOME" && type !== "EXPENSE") return reply.code(400).send({ error: "Tipo inválido" });

    const category = await createCategory(profileId, name, emoji, type);
    return category;
  });

  // PUT /categories/:id
  app.put<{ Params: { id: string }, Body: { name: string; emoji: string; type: CategoryType } }>("/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const { name, emoji, type } = req.body;

    if (!id || id <= 0) return reply.code(400).send({ error: "ID inválido" });
    if (!name || name.length < 2) return reply.code(400).send({ error: "Nome inválido" });
    if (!emoji || emoji.length > 4) return reply.code(400).send({ error: "Emoji inválido" });
    if (type !== "INCOME" && type !== "EXPENSE") return reply.code(400).send({ error: "Tipo inválido" });

    const updated = await updateCategory(id, name, emoji, type);
    if (updated === 0) return reply.code(404).send({ error: "Categoria não encontrada" });

    return { id, name, emoji, type };
  });

  // DELETE /categories/:id
  app.delete<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!id || id <= 0) return reply.code(400).send({ error: "ID inválido" });

    const deleted = await deleteCategory(id);
    if (deleted === 0) return reply.code(404).send({ error: "Categoria não encontrada" });

    return { ok: true };
  });
}
