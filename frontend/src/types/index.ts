export interface Profile {
  id: number;
  name: string;
  theme: 'blue' | 'dark' | 'brown' | 'green' | 'pink' | 'purple';
}

export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: TransactionType;
  category_id: number | null;
  date: string;
}

export interface Category {
  id: number;
  name: string;
  emoji: string;
  type: TransactionType;
}

export type GoalPriority = "Baixa" | "Média" | "Alta" | "Urgente";

export interface PurchaseGoal {
  id: number;
  profile_id: number;
  name: string;
  category?: string | null;
  target_amount: number;
  current_amount_saved: number;
  priority?: GoalPriority | string | null;
  deadline?: string | null;
  notes?: string | null;
  is_completed: number;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalSummary {
  totalGoals: number;
  completed: number;
  active: number;
  overdue: number;
  percentCompleted: number;
  totalSavedActive: number;
  totalRemainingActive: number;
}

export interface SavingsTransaction {
  id: number;
  goal_id: number;
  amount: number;
  date: string;
  notes?: string | null;
  created_at: string;
}

export interface Budget {
  id: number;
  profile_id: number;
  category_id: number;
  month: number;
  year: number;
  amount: number;
  category_name?: string;
  category_emoji?: string;
  category_type?: TransactionType;
}

export interface BudgetSummary {
  category_id: number;
  category_name: string;
  category_emoji: string;
  type: TransactionType;
  budget_amount: number;
  spent_amount: number;
}

export interface Investment {
  id: number;
  profile_id: number;
  name: string;
  category?: string | null;
  broker?: string | null;
  invested_amount: number;
  current_value: number;
  created_at: string;
  updated_at: string;
}

export interface InvestmentOverview {
  totalInvested: number;
  totalCurrent: number;
  totalProfit: number;
  totalProfitPercent: number;
  count: number;
}

export interface InvestmentCategorySummary {
  category: string | null;
  totalInvested: number;
  totalCurrent: number;
  profit: number;
}

export interface InvestmentsSummary {
  overview: InvestmentOverview;
  categories: InvestmentCategorySummary[];
}
