import { CategoryTreeItem } from "@/features/categories/components/category-tree-item";
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";

interface CategoryTreeProps {
  categories: CategoryWithChildren[];
}

export function CategoryTree({ categories }: CategoryTreeProps) {
  const rootCategories = categories.filter((c) => c.parentId === null);

  if (rootCategories.length === 0) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">
        No categories found. Create your first category to get started.
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
