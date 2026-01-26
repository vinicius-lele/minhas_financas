export interface Profile {
  id: number;
  name: string;
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
