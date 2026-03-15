import { deleteGroupTransactionAction } from "@/features/group-finances/actions/delete-group-transaction.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteGroupTransactionButtonProps {
  transactionId: string;
  transactionDescription: string;
}

export function DeleteGroupTransactionButton({
  transactionId,
  transactionDescription,
}: DeleteGroupTransactionButtonProps) {
  return (
    <DeleteEntityButton
      action={deleteGroupTransactionAction}
      formEntries={{ id: transactionId }}
      dialogTitle="Delete Transaction"
      dialogDescription={`Are you sure you want to delete "${transactionDescription}"? This action cannot be undone.`}
      successMessage="Transaction deleted successfully"
    />
  );
}
