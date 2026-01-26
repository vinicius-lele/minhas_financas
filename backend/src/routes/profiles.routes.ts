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
    const { name } = req.body;
    return createProfile(name);
  });

  app.put<{ Params: { id: string } }>("/:id", async (req: any) => {
    const id = Number(req.params.id);
    const { name } = req.body;

    if (Number.isNaN(id)) {
      return { error: "ID inválido" };
    }

    updateProfile(id, name);
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
