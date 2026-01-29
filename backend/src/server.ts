import Fastify from "fastify";
import cors from "@fastify/cors";

import { profilesRoutes } from "./routes/profiles.routes";
import { categoriesRoutes } from "./routes/categories.routes";
import { transactionsRoutes } from "./routes/transactions.routes";
import { summaryRoutes } from "./routes/summary.routes";
import { purchaseGoalsRoutes } from "./routes/purchaseGoals.routes";
import { budgetsRoutes } from "./routes/budgets.routes";

const app = Fastify({ 
  bodyLimit: 1048576,
  ignoreTrailingSlash: true});

app.register(cors, {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});


// Registrar rotas com prefixo
app.register(profilesRoutes, { prefix: "/profiles" });
app.register(categoriesRoutes, { prefix: "/categories" });
app.register(transactionsRoutes, { prefix: "/transactions" });
app.register(summaryRoutes, { prefix: "/summary" });
app.register(purchaseGoalsRoutes, { prefix: "/purchase-goals" });
app.register(budgetsRoutes, { prefix: "/budgets" });

// Rota raiz de teste
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
