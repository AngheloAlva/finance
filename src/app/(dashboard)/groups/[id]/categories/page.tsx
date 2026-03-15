import { GroupRole } from "@/generated/prisma/enums";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryDialog } from "@/features/categories/components/category-dialog";
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";
import { GroupCategoryTree } from "@/features/groups/components/group-category-tree";
import { getGroupCategories } from "@/features/groups/lib/groups.queries";
import {
  getGroupMembership,
  canManageCategories,
} from "@/features/groups/lib/groups.permissions";
import { requireSession } from "@/shared/lib/auth";

interface GroupCategoriesPageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupCategoriesPage({
  params,
}: GroupCategoriesPageProps) {
  const session = await requireSession();
  const { id } = await params;

  const [categories, membership] = await Promise.all([
    getGroupCategories(id),
    getGroupMembership(session.user.id, id),
  ]);

  const currentUserRole = membership?.role ?? GroupRole.MEMBER;
  const showCreate = canManageCategories(currentUserRole);
  const categoriesWithChildren = categories as CategoryWithChildren[];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Group Categories</CardTitle>
          {showCreate && (
            <CategoryDialog
              mode="create"
              categories={categoriesWithChildren}
              groupId={id}
              trigger={
                <Button size="sm">
                  <Plus className="size-3.5" data-icon="inline-start" />
                  New Category
                </Button>
              }
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <GroupCategoryTree
          groupId={id}
          categories={categoriesWithChildren}
          currentUserRole={currentUserRole}
        />
      </CardContent>
    </Card>
  );
}
