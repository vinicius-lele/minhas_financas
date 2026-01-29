import { FastifyInstance } from 'fastify';
import { listBudgets, createBudget, updateBudget, deleteBudget, getBudgetSummary } from '../services/budgets.service';

export async function budgetsRoutes(app: FastifyInstance) {
  app.get('/', async (req: any, reply) => {
    const { month, year } = req.query;
    const profileId = Number(req.headers['x-profile-id']);

    if (!profileId) return reply.code(400).send({ error: 'Header x-profile-id é obrigatório' });
    if (!month || !year) return reply.code(400).send({ error: 'Parâmetros month e year são obrigatórios' });

    const budgets = listBudgets(profileId, Number(month), Number(year));
    return reply.send(budgets);
  });

  app.get('/summary', async (req: any, reply) => {
    const { month, year } = req.query;
    const profileId = Number(req.headers['x-profile-id']);

    if (!profileId) return reply.code(400).send({ error: 'Header x-profile-id é obrigatório' });
    if (!month || !year) return reply.code(400).send({ error: 'Parâmetros month e year são obrigatórios' });

    const summary = getBudgetSummary(profileId, Number(month), Number(year));
    return reply.send(summary);
  });

  app.post('/', async (req: any, reply) => {
    const { categoryId, month, year, amount } = req.body;
    const profileId = Number(req.headers['x-profile-id']);

    if (!profileId) return reply.code(400).send({ error: 'Header x-profile-id é obrigatório' });
    if (!categoryId || !month || !year || !amount) return reply.code(400).send({ error: 'Todos os campos são obrigatórios' });

    createBudget(profileId, Number(categoryId), Number(month), Number(year), Number(amount));
    return reply.code(201).send({ ok: true });
  });

  app.put('/:id', async (req: any, reply) => {
    const { id } = req.params;
    const { amount } = req.body;
    const profileId = Number(req.headers['x-profile-id']);

    if (!profileId) return reply.code(400).send({ error: 'Header x-profile-id é obrigatório' });
    if (!amount) return reply.code(400).send({ error: 'Campo amount é obrigatório' });

    updateBudget(Number(id), Number(amount));
    return reply.send({ ok: true });
  });

  app.delete('/:id', async (req: any, reply) => {
    const { id } = req.params;
    const profileId = Number(req.headers['x-profile-id']);

    if (!profileId) return reply.code(400).send({ error: 'Header x-profile-id é obrigatório' });

    deleteBudget(Number(id));
    return reply.send({ ok: true });
  });
}