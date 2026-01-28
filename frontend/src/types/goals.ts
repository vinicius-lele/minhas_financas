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

export interface SavingsTransaction {
  id: number;
  goal_id: number;
  amount: number;
  date: string;
  notes?: string | null;
  created_at: string;
}
