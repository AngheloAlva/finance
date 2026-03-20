"use client";

import { useTranslations } from "next-intl";

import { deleteGoalAction } from "@/features/goals/actions/delete-goal.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteGoalButtonProps {
  goalId: string;
  goalName: string;
}

export function DeleteGoalButton({ goalId, goalName }: DeleteGoalButtonProps) {
  const t = useTranslations("goals.deleteDialog");

  return (
    <DeleteEntityButton
      action={deleteGoalAction}
      formEntries={{ id: goalId }}
      dialogTitle={t("title")}
      dialogDescription={t("description", { name: goalName })}
      successMessage={t("success")}
    />
  );
}
