import { useEffect, useState } from "react";
import { api } from "../services/api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useProfile } from "../contexts/ProfileContext";
import type { TransactionType, GoalSummary, BudgetSummary } from "../types";
import { Card, Col, Row, Statistic, Typography, Spin, Empty, Progress } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

const { Title, Text } = Typography;

type SummaryData = {
  income: number;
  expense: number;
  balance: number;
};

type CategorySummary = {
  category: string;
  name: string;
  total: number;
  type: TransactionType;
  color?: string;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function Dashboard() {
  const { profile } = useProfile();
  const [summary, setSummary] = useState<SummaryData>({ income: 0, expense: 0, balance: 0 });
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<GoalSummary | null>(null);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary[]>([]);

  useEffect(() => {
    if (!profile) return;
    
    async function loadData() {
      try {
        setLoading(true);
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        
        const [summaryData, catData, goalsData, budgetData] = await Promise.all([
          api<SummaryData>("/summary"),
          api<CategorySummary[]>("/summary/categories"),
          api<GoalSummary>("/purchase-goals/summary"),
          api<BudgetSummary[]>(`/budgets/summary?month=${month}&year=${year}`),
        ]);
        
        setSummary(summaryData);
        setCategorySummary(catData);
        setGoals(goalsData);
        setBudgetSummary(budgetData);
      } catch (error) {
        console.error("Erro ao carregar dashboard", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profile]);

  if (!profile) return <Empty description="Selecione um perfil para visualizar os dados." style={{ marginTop: 100 }} />;
  if (loading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

  const expenseCategories = categorySummary.filter(c => c.type === "EXPENSE");
  const incomeCategories = categorySummary.filter(c => c.type === "INCOME");
  const formatCurrency = (raw: unknown) =>
    Number(raw ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <Title level={2} style={{ margin: 0, letterSpacing: "-0.5px" }}>Visão Geral</Title>
        <Text type="secondary">Resumo financeiro do perfil <strong style={{ color: "#334155" }}>{profile.name}</strong></Text>
      </div>
      
      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} md={8}>
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow" style={{ height: '100%' }}>
              <Statistic
                title="Entradas"
                value={summary.income}
                formatter={formatCurrency}
                valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
                prefix={<ArrowUpOutlined />}
              />
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} md={8}>
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow" style={{ height: '100%' }}>
              <Statistic
                title="Saídas"
                value={summary.expense}
                formatter={formatCurrency}
                valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
                prefix={<ArrowDownOutlined />}
              />
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} md={8}>
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow" style={{ height: '100%' }}>
              <Statistic
                title="Saldo"
                value={summary.balance}
                formatter={formatCurrency}
                valueStyle={{ color: summary.balance >= 0 ? '#3f8600' : '#cf1322', fontWeight: 'bold' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </motion.div>
        </Col>
      </Row>

      {goals && (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <Text type="secondary">Metas de Compras</Text>
                  <div className="text-slate-700 font-semibold">
                    {goals.completed}/{goals.totalGoals} concluídas
                  </div>
                </div>
                <div className="text-slate-500">
                  Ativas: {goals.active}
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <Progress
                  percent={goals.percentCompleted}
                  status="active"
                  strokeColor={{ from: "#2563eb", to: "#60a5fa" }}
                />
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {budgetSummary && budgetSummary.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <Text type="secondary">Orçamentos do Mês</Text>
                  <div className="text-slate-700 font-semibold">
                    {budgetSummary.length} categorias com orçamento
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {budgetSummary.map((budget) => {
                    const percent = budget.budget_amount > 0
                      ? Math.round((budget.spent_amount / budget.budget_amount) * 100)
                      : 0;
                    return (
                      <div key={budget.category_id} className="bg-slate-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span>{budget.category_emoji}</span>
                            <Text strong>{budget.category_name}</Text>
                          </div>
                          <Text type={percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : 'success'}>
                            {percent}%
                          </Text>
                        </div>
                        <Progress
                          percent={percent}
                          strokeColor={percent >= 100 ? '#cf1322' : percent >= 80 ? '#fa8c16' : '#3f8600'}
                          showInfo={false}
                          size="small"
                        />
                        <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                          <span>Gasto: {formatCurrency(budget.spent_amount)}</span>
                          <span>Orçado: {formatCurrency(budget.budget_amount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

        
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
            <Card 
              title="Receitas por Categoria" 
              bordered={false} 
              className="shadow-sm" 
              bodyStyle={{ height: 320, padding: 16 }}
            >
                {incomeCategories.length > 0 ? (
                    <div style={{ width: '100%', height: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                              data={incomeCategories}
                              dataKey="total"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              fill="#82ca9d"
                              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                            >
                              {incomeCategories.map((_, index) => (
                                  <Cell key={`cell-inc-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} /> 
                            <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                ) : (
                    <Empty description="Sem dados de receitas" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
            </Card>
        </Col>
        <Col xs={24} lg={12}>
            <Card 
              title="Despesas por Categoria" 
              bordered={false} 
              className="shadow-sm" 
              bodyStyle={{ height: 320, padding: 16 }}
            >
                {expenseCategories.length > 0 ? (
                    <div style={{ width: '100%', height: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                              data={expenseCategories}
                              dataKey="total"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              fill="#8884d8"
                              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                            >
                              {expenseCategories.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} /> 
                            <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                ) : (
                    <Empty description="Sem dados de despesas" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
            </Card>
        </Col>
      </Row>
    </motion.div>
  );
}
