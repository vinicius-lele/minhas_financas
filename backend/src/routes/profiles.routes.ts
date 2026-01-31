import { FastifyInstance } from "fastify";
import {
  listProfiles,
  createProfile,
  deleteProfile,
  updateProfile
} from "../services/profiles.service";

export async function profilesRoutes(app: FastifyInstance) {
  app.get("/", () => {
    return listProfiles();
  });

  app.post("/", async (req: any) => {
    const { name, theme } = req.body;
    return createProfile(name, theme);
  });

  app.put<{ Params: { id: string } }>("/:id", async (req: any) => {
    const id = Number(req.params.id);
    const { name, theme } = req.body;

    if (Number.isNaN(id)) {
      return { error: "ID inválido" };
    }

    updateProfile(id, name, theme);
    return { ok: true };
  });

  app.delete<{ Params: { id: string } }>("/:id", async (req) => {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return { error: "ID inválido" };
    }

    deleteProfile(id);
    return { ok: true };
  });
}
