import { deleteGroupCategoryAction } from "@/features/groups/actions/delete-group-category.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteGroupCategoryButtonProps {
  categoryId: string;
  categoryName: string;
  groupId: string;
}

export function DeleteGroupCategoryButton({
  categoryId,
  categoryName,
  groupId,
}: DeleteGroupCategoryButtonProps) {
  return (
    <DeleteEntityButton
      action={deleteGroupCategoryAction}
      formEntries={{ id: categoryId, groupId }}
      dialogTitle="Delete Category"
      dialogDescription={`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`}
      successMessage="Category deleted successfully"
    />
  );
}
