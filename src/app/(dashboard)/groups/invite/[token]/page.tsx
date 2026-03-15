import { InvitationStatus } from "@/generated/prisma/enums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AcceptInvitationButton } from "@/features/groups/components/accept-invitation-button";
import { getInvitationByToken } from "@/features/groups/lib/groups.queries";
import { requireSession } from "@/shared/lib/auth";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  await requireSession();
  const { token } = await params;

  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              This invitation link is invalid or does not exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status !== InvitationStatus.PENDING) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Invitation Used</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              This invitation has already been {invitation.status.toLowerCase()}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Invitation Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              This invitation expired on{" "}
              {invitation.expiresAt.toLocaleDateString()}. Please ask the group
              administrator to send a new invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Join Group</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-1">
            <p className="text-sm font-medium">{invitation.group.name}</p>
            {invitation.group.description && (
              <p className="text-xs text-muted-foreground">
                {invitation.group.description}
              </p>
            )}
          </div>

          <p className="mb-4 text-xs text-muted-foreground">
            You have been invited to join this group. Click the button below to
            accept.
          </p>

          <AcceptInvitationButton token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
