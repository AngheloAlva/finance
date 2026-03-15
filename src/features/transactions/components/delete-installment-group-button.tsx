import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteInstallmentGroupAction } from "@/features/transactions/actions/delete-installment-group.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteInstallmentGroupButtonProps {
  parentTransactionId: string;
  description: string;
}

export function DeleteInstallmentGroupButton({
  parentTransactionId,
  description,
}: DeleteInstallmentGroupButtonProps) {
  return (
    <DeleteEntityButton
      action={deleteInstallmentGroupAction}
      formEntries={{ parentTransactionId }}
      dialogTitle="Delete Installment Group"
      dialogDescription={`Are you sure you want to delete ALL installments for "${description}"? This action cannot be undone.`}
      successMessage="Installment group deleted successfully"
      trigger={
        <Button variant="ghost" size="icon-xs" title="Delete all installments">
          <Trash2 className="size-3 text-destructive" />
        </Button>
      }
    />
  );
}
