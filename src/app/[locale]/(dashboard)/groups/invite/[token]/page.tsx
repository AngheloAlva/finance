import { InvitationStatus } from "@/generated/prisma/enums";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("groups.invitation");

  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{t("invalidTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {t("invalidDescription")}
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
            <CardTitle>{t("usedTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {t("usedDescription", { status: invitation.status.toLowerCase() })}
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
            <CardTitle>{t("expiredTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {t("expiredDescription", { date: invitation.expiresAt.toLocaleDateString() })}
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
          <CardTitle>{t("joinGroup")}</CardTitle>
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
            {t("invitedToJoin")}
          </p>

          <AcceptInvitationButton token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
