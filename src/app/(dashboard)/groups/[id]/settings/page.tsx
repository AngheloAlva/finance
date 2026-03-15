import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteGroupButton } from "@/features/groups/components/delete-group-button";
import { GroupForm } from "@/features/groups/components/group-form";
import { getGroupById } from "@/features/groups/lib/groups.queries";
import {
  getGroupMembership,
  canManageCategories,
  canDeleteGroup,
} from "@/features/groups/lib/groups.permissions";
import { requireSession } from "@/shared/lib/auth";

interface GroupSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupSettingsPage({
  params,
}: GroupSettingsPageProps) {
  const session = await requireSession();
  const { id } = await params;

  const [group, membership] = await Promise.all([
    getGroupById(id),
    getGroupMembership(session.user.id, id),
  ]);

  if (!group || !membership) {
    redirect(`/groups/${id}`);
  }

  if (!canManageCategories(membership.role)) {
    redirect(`/groups/${id}`);
  }

  const defaultValues = {
    id: group.id,
    name: group.name,
    description: group.description,
    currency: group.currency,
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Group Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupForm mode="edit" defaultValues={defaultValues} />
        </CardContent>
      </Card>

      {canDeleteGroup(membership.role) && (
        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Delete Group</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete this group and all its data.
                </p>
              </div>
              <DeleteGroupButton groupId={group.id} groupName={group.name} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
