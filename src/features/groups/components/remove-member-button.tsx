import { removeMemberAction } from "@/features/groups/actions/remove-member.action";
import { DeleteEntityButton } from "@/shared/components/delete-entity-button";

interface RemoveMemberButtonProps {
  groupId: string;
  memberId: string;
  memberName: string;
}

export function RemoveMemberButton({
  groupId,
  memberId,
  memberName,
}: RemoveMemberButtonProps) {
  return (
    <DeleteEntityButton
      action={removeMemberAction}
      formEntries={{ groupId, memberId }}
      dialogTitle="Remove Member"
      dialogDescription={`Are you sure you want to remove "${memberName}" from this group?`}
      successMessage="Member removed successfully"
    />
  );
}
