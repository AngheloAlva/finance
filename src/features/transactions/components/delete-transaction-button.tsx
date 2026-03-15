import { deleteTransactionAction } from "@/features/transactions/actions/delete-transaction.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteTransactionButtonProps {
  transactionId: string;
  transactionDescription: string;
}

export function DeleteTransactionButton({
  transactionId,
  transactionDescription,
}: DeleteTransactionButtonProps) {
  return (
    <DeleteEntityButton
      action={deleteTransactionAction}
      formEntries={{ id: transactionId }}
      dialogTitle="Delete Transaction"
      dialogDescription={`Are you sure you want to delete "${transactionDescription}"? This action cannot be undone.`}
      successMessage="Transaction deleted successfully"
    />
  );
}
