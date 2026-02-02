import Fastify from "fastify";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth.routes";
import { profilesRoutes } from "./routes/profiles.routes";
import { categoriesRoutes } from "./routes/categories.routes";
import { transactionsRoutes } from "./routes/transactions.routes";
import { summaryRoutes } from "./routes/summary.routes";
import { purchaseGoalsRoutes } from "./routes/purchaseGoals.routes";
import { budgetsRoutes } from "./routes/budgets.routes";
import { verifyAuthToken, isTokenRevoked } from "./services/auth.service";

const app = Fastify({
  bodyLimit: 1048576,
  ignoreTrailingSlash: true,
});

app.register(cors, {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

app.addHook("preHandler", async (req, reply) => {
  const url = req.raw.url || "";
  if (
    url === "/" ||
    url.startsWith("/api/auth") ||
    url.startsWith("/documentation")
  ) {
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "Não autenticado" });
  }

  const token = authHeader.substring("Bearer ".length);
  try {
    const payload = verifyAuthToken(token);
    if (isTokenRevoked(payload.jti)) {
      return reply.code(401).send({ error: "Token revogado" });
    }
    (req as any).user = {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
    };
  } catch {
    return reply.code(401).send({ error: "Token inválido" });
  }
});

app.register(authRoutes, { prefix: "/api/auth" });
app.register(profilesRoutes, { prefix: "/profiles" });
app.register(categoriesRoutes, { prefix: "/categories" });
app.register(transactionsRoutes, { prefix: "/transactions" });
app.register(summaryRoutes, { prefix: "/summary" });
app.register(purchaseGoalsRoutes, { prefix: "/purchase-goals" });
app.register(budgetsRoutes, { prefix: "/budgets" });

app.get("/", async () => {
  return { ok: true, message: "API Minhas Finanças rodando!" };
});

app.listen({ port: 3333 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`API rodando em ${address}`);
});
