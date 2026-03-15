import { deleteCategoryAction } from "@/features/categories/actions/delete-category.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteCategoryButtonProps {
  categoryId: string;
  categoryName: string;
}

export function DeleteCategoryButton({
  categoryId,
  categoryName,
}: DeleteCategoryButtonProps) {
  return (
    <DeleteEntityButton
      action={deleteCategoryAction}
      formEntries={{ id: categoryId }}
      dialogTitle="Delete Category"
      dialogDescription={`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`}
      successMessage="Category deleted successfully"
    />
  );
}
