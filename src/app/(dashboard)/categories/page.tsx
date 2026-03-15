import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryDialog } from "@/features/categories/components/category-dialog";
import { CategoryTree } from "@/features/categories/components/category-tree";
import { getUserCategories } from "@/features/categories/lib/categories.queries";
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";
import { requireSession } from "@/shared/lib/auth";

export default async function CategoriesPage() {
  const session = await requireSession();
  const categories = (await getUserCategories(
    session.user.id,
  )) as CategoryWithChildren[];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Categories</h1>
        <CategoryDialog
          mode="create"
          categories={categories}
          trigger={
            <Button size="sm">
              <Plus className="size-3.5" data-icon="inline-start" />
              New Category
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryTree categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
