import { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { useProfile } from "../contexts/ProfileContext";
import { useTheme } from "../contexts/ThemeContext";
import type { TransactionType, GoalSummary, BudgetSummary } from "../types";
import { Card, Col, Row, Statistic, Typography, Spin, Empty, Progress, Radio, Tabs } from "antd";
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

type MonthlyPoint = {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
};

type AnnualPoint = {
  year: number;
  income: number;
  expense: number;
  balance: number;
};

type MonthlyRange = "year" | "last6";

export function Dashboard() {
  const { profile } = useProfile();
  const { theme } = useTheme();
  const [summary, setSummary] = useState<SummaryData>({ income: 0, expense: 0, balance: 0 });
  const [categorySummaryMonth, setCategorySummaryMonth] = useState<CategorySummary[]>([]);
  const [categorySummaryYear, setCategorySummaryYear] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<GoalSummary | null>(null);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
  const [annualData, setAnnualData] = useState<AnnualPoint[]>([]);
  const [monthlyRange, setMonthlyRange] = useState<MonthlyRange>("year");

  useEffect(() => {
    if (!profile) return;
    
    async function loadData() {
      try {
        setLoading(true);
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const previousYear = year - 1;
        
        const [
          summaryData,
          goalsData,
          budgetData,
          monthlyCurrent,
          monthlyPrev,
          annual,
        ] = await Promise.all([
          api<SummaryData>("/summary"),
          api<GoalSummary>("/purchase-goals/summary"),
          api<BudgetSummary[]>(`/budgets/summary?month=${month}&year=${year}`),
          api<MonthlyPoint[]>(`/summary/monthly?year=${year}`),
          api<MonthlyPoint[]>(`/summary/monthly?year=${previousYear}`),
          api<AnnualPoint[]>("/summary/annual"),
        ]);

        setSummary(summaryData);
        setGoals(goalsData);
        setBudgetSummary(budgetData);
        const combinedMonthly = [
          ...(monthlyPrev ?? []),
          ...(monthlyCurrent ?? []),
        ].sort((a, b) => {
          if (a.year === b.year) return a.month - b.month;
          return a.year - b.year;
        });
        setMonthlyData(combinedMonthly);
        setAnnualData(annual);

        const incomePaletteBase = [
          theme.token.colorPrimary,
          theme.token.colorPrimaryHover,
          theme.colors.primary,
        ];
        const expensePaletteBase = [
          theme.colors.secondary,
          theme.token.colorText,
          theme.token.colorTextSecondary,
        ];

        const buildPalette = (base: string[], size: number) => {
          const colors: string[] = [];
          const variants = ["FF", "CC", "99"];
          let index = 0;
          while (colors.length < size) {
            const baseColor = base[index % base.length];
            const variant = variants[Math.floor(colors.length / base.length) % variants.length];
            if (baseColor.startsWith("#") && baseColor.length === 7) {
              colors.push(`${baseColor}${variant}`);
            } else {
              colors.push(baseColor);
            }
            index += 1;
          }
          return colors;
        };

        try {
          const rawCatDataMonth = await api<unknown[]>(
            `/summary/categories?month=${month}&year=${year}`
          );
          const monthItems = rawCatDataMonth ?? [];
          const incomePaletteMonth = buildPalette(
            incomePaletteBase,
            Math.max(monthItems.length, incomePaletteBase.length)
          );
          const expensePaletteMonth = buildPalette(
            expensePaletteBase,
            Math.max(monthItems.length, expensePaletteBase.length)
          );

          const normalizedCategoriesMonth: CategorySummary[] = monthItems.map(
            (item, index) => {
              const typed = item as {
                name?: unknown;
                total?: unknown;
                type?: unknown;
              };

              const type = String(typed.type ?? "EXPENSE") as TransactionType;
              const palette =
                type === "INCOME" ? incomePaletteMonth : expensePaletteMonth;

              return {
                category: String(typed.name ?? ""),
                name: String(typed.name ?? ""),
                total: Number(typed.total ?? 0),
                type,
                color: palette[index % palette.length],
              };
            }
          );
          setCategorySummaryMonth(normalizedCategoriesMonth);
        } catch (err) {
          console.error("Erro ao carregar categorias do mês", err);
          setCategorySummaryMonth([]);
        }

        try {
          const rawCatDataYear = await api<unknown[]>(
            `/summary/categories?year=${year}`
          );
          const yearItems = rawCatDataYear ?? [];
          const incomePaletteYear = buildPalette(
            incomePaletteBase,
            Math.max(yearItems.length, incomePaletteBase.length)
          );
          const expensePaletteYear = buildPalette(
            expensePaletteBase,
            Math.max(yearItems.length, expensePaletteBase.length)
          );

          const normalizedCategoriesYear: CategorySummary[] = yearItems.map(
            (item, index) => {
              const typed = item as {
                name?: unknown;
                total?: unknown;
                type?: unknown;
              };

              const type = String(typed.type ?? "EXPENSE") as TransactionType;
              const palette =
                type === "INCOME" ? incomePaletteYear : expensePaletteYear;

              return {
                category: String(typed.name ?? ""),
                name: String(typed.name ?? ""),
                total: Number(typed.total ?? 0),
                type,
                color: palette[index % palette.length],
              };
            }
          );
          setCategorySummaryYear(normalizedCategoriesYear);
        } catch (err) {
          console.error("Erro ao carregar categorias do ano", err);
          setCategorySummaryYear([]);
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profile, theme]);

  if (!profile) return <Empty description="Selecione um perfil para visualizar os dados." style={{ marginTop: 100 }} />;
  if (loading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

  const expenseCategoriesMonth = categorySummaryMonth.filter(c => c.type === "EXPENSE");
  const incomeCategoriesMonth = categorySummaryMonth.filter(c => c.type === "INCOME");
  const expenseCategoriesYear = categorySummaryYear.filter(c => c.type === "EXPENSE");
  const incomeCategoriesYear = categorySummaryYear.filter(c => c.type === "INCOME");
  const formatCurrency = (raw: unknown) =>
    Number(raw ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const monthLabels = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const monthlyByKey = new Map<number, MonthlyPoint>();
  for (const item of monthlyData) {
    const key = item.year * 12 + (item.month - 1);
    monthlyByKey.set(key, item);
  }

  const monthlyYearCore = monthlyData
    .filter((item) => item.year === currentYear)
    .sort((a, b) => a.month - b.month);

  const monthlyLast6Core: MonthlyPoint[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const index = currentYear * 12 + (currentMonth - 1) - offset;
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;
    const existing =
      monthlyByKey.get(index) ??
      {
        year,
        month,
        income: 0,
        expense: 0,
        balance: 0,
      };
    monthlyLast6Core.push(existing);
  }

  const monthlyYear = monthlyYearCore.map((item) => ({
    ...item,
    monthLabel: monthLabels[item.month - 1] ?? String(item.month),
  }));

  const monthlyLast6 = monthlyLast6Core.map((item) => ({
    ...item,
    monthLabel: monthLabels[item.month - 1] ?? String(item.month),
  }));

  const monthlyChartDataFiltered =
    monthlyRange === "year" ? monthlyYear : monthlyLast6;

  const yearSummary = monthlyData
    .filter((item) => item.year === currentYear)
    .reduce(
      (acc, item) => ({
        income: acc.income + item.income,
        expense: acc.expense + item.expense,
        balance: acc.balance + item.balance,
      }),
      { income: 0, expense: 0, balance: 0 }
    );

  const monthSummary = monthlyData
    .filter(
      (item) => item.year === currentYear && item.month === currentMonth
    )
    .reduce(
      (acc, item) => ({
        income: acc.income + item.income,
        expense: acc.expense + item.expense,
        balance: acc.balance + item.balance,
      }),
      { income: 0, expense: 0, balance: 0 }
    );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <Title level={2} style={{ margin: 0, letterSpacing: "-0.5px" }}>Visão Geral</Title>
        <Text type="secondary">Resumo financeiro do perfil <strong style={{ color: "var(--text-main)" }}>{profile.name}</strong></Text>
      </div>
      
      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} lg={8}>
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card
              bordered={false}
              className="shadow-sm hover:shadow-md transition-shadow"
              title="Resumo do mês atual"
            >
              <Row gutter={[12, 12]} align="stretch">
                <Col xs={24} md={8}>
                  <Statistic
                    title="Entradas"
                    value={monthSummary.income}
                    formatter={formatCurrency}
                    valueStyle={{ color: "#3f8600", fontWeight: "bold", fontSize: 16 }}
                    prefix={<ArrowUpOutlined />}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic
                    title="Saídas"
                    value={monthSummary.expense}
                    formatter={formatCurrency}
                    valueStyle={{ color: "#cf1322", fontWeight: "bold", fontSize: 16 }}
                    prefix={<ArrowDownOutlined />}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic
                    title="Saldo"
                    value={monthSummary.balance}
                    formatter={formatCurrency}
                    valueStyle={{
                      color: monthSummary.balance >= 0 ? "#3f8600" : "#cf1322",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                    prefix={<DollarOutlined />}
                  />
                </Col>
              </Row>
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} lg={8}>
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card
              bordered={false}
              className="shadow-sm hover:shadow-md transition-shadow"
              title="Resumo anual"
            >
              <Row gutter={[12, 12]} align="stretch">
                <Col xs={24} md={8}>
                  <Statistic
                    title="Entradas"
                    value={yearSummary.income}
                    formatter={formatCurrency}
                    valueStyle={{ color: "#3f8600", fontWeight: "bold", fontSize: 16 }}
                    prefix={<ArrowUpOutlined />}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic
                    title="Saídas"
                    value={yearSummary.expense}
                    formatter={formatCurrency}
                    valueStyle={{ color: "#cf1322", fontWeight: "bold", fontSize: 16 }}
                    prefix={<ArrowDownOutlined />}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic
                    title="Saldo"
                    value={yearSummary.balance}
                    formatter={formatCurrency}
                    valueStyle={{
                      color: yearSummary.balance >= 0 ? "#3f8600" : "#cf1322",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                    prefix={<DollarOutlined />}
                  />
                </Col>
              </Row>
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} lg={8}>
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card
              bordered={false}
              className="shadow-sm hover:shadow-md transition-shadow"
              title="Resumo total"
            >
              <Row gutter={[12, 12]} align="stretch">
                <Col xs={24} md={8}>
                  <Statistic
                    title="Entradas"
                    value={summary.income}
                    formatter={formatCurrency}
                    valueStyle={{ color: "#3f8600", fontWeight: "bold", fontSize: 16 }}
                    prefix={<ArrowUpOutlined />}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic
                    title="Saídas"
                    value={summary.expense}
                    formatter={formatCurrency}
                    valueStyle={{ color: "#cf1322", fontWeight: "bold", fontSize: 16 }}
                    prefix={<ArrowDownOutlined />}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic
                    title="Saldo"
                    value={summary.balance}
                    formatter={formatCurrency}
                    valueStyle={{
                      color: summary.balance >= 0 ? "#3f8600" : "#cf1322",
                      fontWeight: "bold",
                      fontSize: 16,
                    }}
                    prefix={<DollarOutlined />}
                  />
                </Col>
              </Row>
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
                  <div className="font-semibold">
                    {goals.completed}/{goals.totalGoals} concluídas
                  </div>
                </div>
                <div>
                  Ativas: {goals.active}
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <Progress
                  percent={goals.percentCompleted}
                  status="active"
                  strokeColor={{ from: "#f18539", to: "#d96b27" }}
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
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {budgetSummary.map((budget) => {
                    const percent = budget.budget_amount > 0
                      ? Math.round((budget.spent_amount / budget.budget_amount) * 100)
                      : 0;
                    return (
                      <div key={budget.category_id} className="bg-surface p-3 rounded-lg ">
                        <div className="flex items-center justify-between mb-1">
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
                          strokeColor={percent >= 100 ? '#991b1b' : percent >= 80 ? '#d97706' : '#166534'}
                          showInfo={false}
                          size="small"
                        />
                        <div className="flex items-center justify-between mt-1 text-xs">
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

      
      <Card
        bordered={false}
        className="shadow-sm"
        style={{ marginTop: 24 }}
        bodyStyle={{ padding: 16 }}
      >
        <Tabs
          defaultActiveKey="month"
          items={[
            {
              key: "month",
              label: "Categorias - mês atual",
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card
                      bordered={false}
                      className="shadow-sm"
                      title="Entradas"
                      bodyStyle={{ height: 320, padding: 16 }}
                    >
                      {incomeCategoriesMonth.length > 0 ? (
                        <div style={{ width: "100%", height: "100%" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={incomeCategoriesMonth}
                                dataKey="total"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ name, percent }) =>
                                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                                }
                              >
                                {incomeCategoriesMonth.map((item, index) => (
                                  <Cell
                                    key={`cell-inc-month-${index}`}
                                    fill={item.color ?? theme.colors.primary}
                                  />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <Empty
                          description="Sem dados de receitas"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card
                      bordered={false}
                      className="shadow-sm"
                      title="Saídas"
                      bodyStyle={{ height: 320, padding: 16 }}
                    >
                      {expenseCategoriesMonth.length > 0 ? (
                        <div style={{ width: "100%", height: "100%" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={expenseCategoriesMonth}
                                dataKey="total"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ name, percent }) =>
                                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                                }
                              >
                                {expenseCategoriesMonth.map((item, index) => (
                                  <Cell
                                    key={`cell-exp-month-${index}`}
                                    fill={item.color ?? theme.colors.secondary}
                                  />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <Empty
                          description="Sem dados de despesas"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      )}
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: "year",
              label: "Categorias - ano atual",
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card
                      bordered={false}
                      className="shadow-sm"
                      title="Entradas"
                      bodyStyle={{ height: 320, padding: 16 }}
                    >
                      {incomeCategoriesYear.length > 0 ? (
                        <div style={{ width: "100%", height: "100%" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={incomeCategoriesYear}
                                dataKey="total"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ name, percent }) =>
                                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                                }
                              >
                                {incomeCategoriesYear.map((item, index) => (
                                  <Cell
                                    key={`cell-inc-year-${index}`}
                                    fill={item.color ?? theme.colors.primary}
                                  />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <Empty
                          description="Sem dados de receitas"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card
                      bordered={false}
                      className="shadow-sm"
                      title="Saídas"
                      bodyStyle={{ height: 320, padding: 16 }}
                    >
                      {expenseCategoriesYear.length > 0 ? (
                        <div style={{ width: "100%", height: "100%" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={expenseCategoriesYear}
                                dataKey="total"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ name, percent }) =>
                                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                                }
                              >
                                {expenseCategoriesYear.map((item, index) => (
                                  <Cell
                                    key={`cell-exp-year-${index}`}
                                    fill={item.color ?? theme.colors.secondary}
                                  />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <Empty
                          description="Sem dados de despesas"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      )}
                    </Card>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <div className="flex items-center justify-between gap-2">
                <span>Comparativo mensal (ano atual)</span>
                <Radio.Group
                  size="small"
                  value={monthlyRange}
                  onChange={(e) =>
                    setMonthlyRange(e.target.value as MonthlyRange)
                  }
                >
                  <Radio.Button value="year">Ano inteiro</Radio.Button>
                  <Radio.Button value="last6">Últimos 6 meses</Radio.Button>
                </Radio.Group>
              </div>
            }
            bordered={false}
            className="shadow-sm"
            bodyStyle={{ height: 320, padding: 16 }}
          >
            {monthlyChartDataFiltered.length > 0 ? (
              <div style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyChartDataFiltered}
                    margin={{ top: 8, right: 16, bottom: 8, left: 32 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="monthLabel" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Entradas" fill="#16a34a" />
                    <Bar dataKey="expense" name="Saídas" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty
                description="Sem dados mensais"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="Progressão anual"
            bordered={false}
            className="shadow-sm"
            bodyStyle={{ height: 320, padding: 16 }}
          >
            {annualData.length > 0 ? (
              <div style={{ width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={annualData}
                    margin={{ top: 8, right: 16, bottom: 8, left: 32 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => `Ano: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Entradas"
                      stroke="#16a34a"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      name="Saídas"
                      stroke="#dc2626"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      name="Saldo"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty
                description="Sem dados anuais"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
}
