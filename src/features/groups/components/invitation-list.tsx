import { Badge } from "@/components/ui/badge";
import type { GroupInvitationWithInviter } from "@/features/groups/types/groups.types";
import { formatDate } from "@/shared/lib/formatters";

interface InvitationListProps {
  invitations: GroupInvitationWithInviter[];
}

export function InvitationList({ invitations }: InvitationListProps) {
  if (invitations.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No pending invitations.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="flex items-center justify-between rounded-none border px-3 py-2"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium">{invitation.email}</span>
            <span className="text-xs text-muted-foreground">
              Invited by {invitation.invitedBy.name ?? invitation.invitedBy.email}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Expires{" "}
              {formatDate(invitation.expiresAt, "short")}
            </span>
            <Badge variant="secondary">{invitation.status}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
