import { deleteGoalAction } from "@/features/goals/actions/delete-goal.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteGoalButtonProps {
  goalId: string;
  goalName: string;
}

export function DeleteGoalButton({ goalId, goalName }: DeleteGoalButtonProps) {
  return (
    <DeleteEntityButton
      action={deleteGoalAction}
      formEntries={{ id: goalId }}
      dialogTitle="Delete Goal"
      dialogDescription={`Are you sure you want to delete "${goalName}"? This will also delete all contributions. This action cannot be undone.`}
      successMessage="Goal deleted successfully"
    />
  );
}
