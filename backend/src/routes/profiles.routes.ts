import { FastifyInstance } from "fastify";
import {
  listProfiles,
  createProfile,
  deleteProfile,
  updateProfile
} from "../services/profiles.service";

export async function profilesRoutes(app: FastifyInstance) {
  app.get("/", (req: any) => {
    const userId = (req as any).user?.id as number | undefined;
    if (!userId) {
      return { error: "Usuário não autenticado" };
    }
    return listProfiles(userId);
  });

  app.post("/", async (req: any) => {
    const userId = (req as any).user?.id as number | undefined;
    if (!userId) {
      return { error: "Usuário não autenticado" };
    }
    const { name, theme } = req.body;
    return createProfile(userId, name, theme);
  });

  app.put<{ Params: { id: string } }>("/:id", async (req: any) => {
    const userId = (req as any).user?.id as number | undefined;
    if (!userId) {
      return { error: "Usuário não autenticado" };
    }
    const id = Number(req.params.id);
    const { name, theme } = req.body;

    if (Number.isNaN(id)) {
      return { error: "ID inválido" };
    }

    const updated = updateProfile(userId, id, name, theme);
    if (!updated) {
      return { error: "Perfil não encontrado" };
    }
    return { ok: true };
  });

  app.delete<{ Params: { id: string } }>("/:id", async (req) => {
    const userId = (req as any).user?.id as number | undefined;
    if (!userId) {
      return { error: "Usuário não autenticado" };
    }
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return { error: "ID inválido" };
    }

    const removed = deleteProfile(userId, id);
    if (!removed) {
      return { error: "Perfil não encontrado" };
    }
    return { ok: true };
  });
}
