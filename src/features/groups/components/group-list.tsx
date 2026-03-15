import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { GroupCard } from "@/features/groups/components/group-card";
import { GroupDialog } from "@/features/groups/components/group-dialog";
import { getUserGroups } from "@/features/groups/lib/groups.queries";
import { requireSession } from "@/shared/lib/auth";

export async function GroupList() {
  const session = await requireSession();
  const groups = await getUserGroups(session.user.id);

  if (groups.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users />
          </EmptyMedia>
          <EmptyTitle>No groups yet</EmptyTitle>
          <EmptyDescription>
            Create your first group to start sharing expenses with others.
          </EmptyDescription>
        </EmptyHeader>
        <GroupDialog
          mode="create"
          trigger={<Button size="sm">Create Group</Button>}
        />
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}
