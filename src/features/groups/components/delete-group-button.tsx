import { deleteGroupAction } from "@/features/groups/actions/delete-group.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface DeleteGroupButtonProps {
  groupId: string;
  groupName: string;
}

export function DeleteGroupButton({
  groupId,
  groupName,
}: DeleteGroupButtonProps) {
  return (
    <DeleteEntityButton
      action={deleteGroupAction}
      formEntries={{ id: groupId }}
      dialogTitle="Delete Group"
      dialogDescription={`Are you sure you want to delete "${groupName}"? This action cannot be undone. All group data will be permanently removed.`}
      successMessage="Group deleted successfully"
    />
  );
}
