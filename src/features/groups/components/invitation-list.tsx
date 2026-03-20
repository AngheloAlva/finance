import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { GroupInvitationWithInviter } from "@/features/groups/types/groups.types";
import { formatDate } from "@/shared/lib/formatters";

interface InvitationListProps {
  invitations: GroupInvitationWithInviter[];
}

const STATUS_KEYS: Record<string, string> = {
  PENDING: "statusPending",
  ACCEPTED: "statusAccepted",
  DECLINED: "statusDeclined",
};

export function InvitationList({ invitations }: InvitationListProps) {
  const t = useTranslations("groups.members");
  const locale = useLocale();

  if (invitations.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">{t("noPendingInvitations")}</p>
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
              {t("invitedBy", { name: invitation.invitedBy.name ?? invitation.invitedBy.email })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t("expires", { date: formatDate(invitation.expiresAt, "short", locale) })}
            </span>
            <Badge variant="secondary">
              {t(STATUS_KEYS[invitation.status] ?? "statusPending")}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
