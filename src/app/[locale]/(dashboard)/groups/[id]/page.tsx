import { GroupRole } from "@/generated/prisma/enums";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitationForm } from "@/features/groups/components/invitation-form";
import { InvitationList } from "@/features/groups/components/invitation-list";
import { MemberList } from "@/features/groups/components/member-list";
import {
  getGroupMembers,
  getGroupInvitations,
} from "@/features/groups/lib/groups.queries";
import { getGroupMembership, canManageMembers } from "@/features/groups/lib/groups.permissions";
import { requireSession } from "@/shared/lib/auth";

interface GroupDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({
  params,
}: GroupDetailPageProps) {
  const session = await requireSession();
  const { id } = await params;

  const [members, membership] = await Promise.all([
    getGroupMembers(id),
    getGroupMembership(session.user.id, id),
  ]);

  const currentUserRole = membership?.role ?? GroupRole.MEMBER;
  const showInvitations = canManageMembers(currentUserRole);
  const t = await getTranslations("groups.members");

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberList
            members={members}
            currentUserRole={currentUserRole}
            groupId={id}
          />
        </CardContent>
      </Card>

      {showInvitations && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("inviteMember")}</CardTitle>
            </CardHeader>
            <CardContent>
              <InvitationForm groupId={id} />
            </CardContent>
          </Card>

          <PendingInvitations groupId={id} />
        </>
      )}
    </div>
  );
}

async function PendingInvitations({ groupId }: { groupId: string }) {
  const invitations = await getGroupInvitations(groupId);
  const t = await getTranslations("groups.members");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pendingInvitations")}</CardTitle>
      </CardHeader>
      <CardContent>
        <InvitationList invitations={invitations} />
      </CardContent>
    </Card>
  );
}
