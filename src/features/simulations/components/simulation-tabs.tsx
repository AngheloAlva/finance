"use client";

import { useTranslations } from "next-intl";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AffordabilityForm } from "@/features/simulations/components/affordability-form";
import { BudgetOptimizerForm } from "@/features/simulations/components/budget-optimizer-form";
import { DebtPayoffForm } from "@/features/simulations/components/debt-payoff-form";
import { IncomeChangeForm } from "@/features/simulations/components/income-change-form";
import { SavingsGoalForm } from "@/features/simulations/components/savings-goal-form";
import type {
  CreditCardSnapshot,
  GoalSnapshot,
} from "@/features/simulations/types/simulations.types";
import type { CurrencyCode } from "@/shared/lib/constants";

interface SimulationTabsProps {
  creditCards: CreditCardSnapshot[];
  goals: GoalSnapshot[];
  currency: CurrencyCode;
}

export function SimulationTabs({
  creditCards,
  goals,
  currency,
}: SimulationTabsProps) {
  const t = useTranslations("simulations.tabs");

  return (
    <Tabs defaultValue="affordability">
      <TabsList className="w-full">
        <TabsTrigger value="affordability">{t("affordability")}</TabsTrigger>
        <TabsTrigger value="savings">{t("savingsGoals")}</TabsTrigger>
        <TabsTrigger value="debt">{t("debtPayoff")}</TabsTrigger>
        <TabsTrigger value="income">{t("incomeImpact")}</TabsTrigger>
        <TabsTrigger value="budget">{t("budgetOptimizer")}</TabsTrigger>
      </TabsList>

      <TabsContent value="affordability" className="mt-4">
        <AffordabilityForm creditCards={creditCards} currency={currency} />
      </TabsContent>

      <TabsContent value="savings" className="mt-4">
        <SavingsGoalForm goals={goals} currency={currency} />
      </TabsContent>

      <TabsContent value="debt" className="mt-4">
        <DebtPayoffForm currency={currency} />
      </TabsContent>

      <TabsContent value="income" className="mt-4">
        <IncomeChangeForm currency={currency} />
      </TabsContent>

      <TabsContent value="budget" className="mt-4">
        <BudgetOptimizerForm currency={currency} />
      </TabsContent>
    </Tabs>
  );
}
