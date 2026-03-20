import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { GroupTabs } from "@/features/groups/components/group-tabs";
import { getGroupById } from "@/features/groups/lib/groups.queries";
import { getGroupMembership } from "@/features/groups/lib/groups.permissions";
import { requireSession } from "@/shared/lib/auth";

interface GroupLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default async function GroupLayout({
  children,
  params,
}: GroupLayoutProps) {
  const session = await requireSession();
  const { id } = await params;

  const group = await getGroupById(id);

  if (!group) {
    notFound();
  }

  const membership = await getGroupMembership(session.user.id, id);

  if (!membership) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">{group.name}</h1>
        {group.description && (
          <p className="text-xs text-muted-foreground">{group.description}</p>
        )}
      </div>

      <GroupTabs groupId={id} currentUserRole={membership.role} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
