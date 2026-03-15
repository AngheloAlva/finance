import { deleteCreditCardAction } from "@/features/credit-cards/actions/delete-credit-card.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteCreditCardButtonProps {
  creditCardId: string;
  creditCardName: string;
}

export function DeleteCreditCardButton({
  creditCardId,
  creditCardName,
}: DeleteCreditCardButtonProps) {
  return (
    <DeleteEntityButton
      action={deleteCreditCardAction}
      formEntries={{ id: creditCardId }}
      dialogTitle="Delete Credit Card"
      dialogDescription={`Are you sure you want to delete "${creditCardName}"? This action cannot be undone.`}
      successMessage="Credit card deleted successfully"
    />
  );
}
