import { deleteInvestmentAction } from "@/features/investments/actions/delete-investment.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteInvestmentButtonProps {
  investmentId: string;
  investmentName: string;
}

export function DeleteInvestmentButton({
  investmentId,
  investmentName,
}: DeleteInvestmentButtonProps) {
  return (
    <DeleteEntityButton
      action={deleteInvestmentAction}
      formEntries={{ id: investmentId }}
      dialogTitle="Delete Investment"
      dialogDescription={`Are you sure you want to delete "${investmentName}"? All snapshots will be permanently deleted.`}
    />
  );
}
