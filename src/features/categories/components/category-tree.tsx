import { getTranslations } from "next-intl/server";

import { CategoryTreeItem } from "@/features/categories/components/category-tree-item";
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";

interface CategoryTreeProps {
  categories: CategoryWithChildren[];
}

export async function CategoryTree({ categories }: CategoryTreeProps) {
  const t = await getTranslations("categories");
  const rootCategories = categories.filter((c) => c.parentId === null);

  if (rootCategories.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">
        {t("noCategoriesFound")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {rootCategories.map((category) => (
        <CategoryTreeItem
          key={category.id}
          category={category}
          allCategories={categories}
        />
      ))}
    </div>
  );
}
