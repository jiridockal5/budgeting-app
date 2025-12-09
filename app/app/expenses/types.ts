import { ExpenseFrequency } from "@prisma/client";

export type PlanSummary = {
  id: string;
  name: string;
  currency: string;
  startMonth: string;
  months: number;
};

export type ExpenseView = {
  id: string;
  planId: string;
  name: string;
  category: string;
  amount: number;
  frequency: ExpenseFrequency;
  startMonth: string;
  endMonth: string | null;
  createdAt: string;
  updatedAt: string;
};

