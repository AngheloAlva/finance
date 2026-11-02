import { getTranslations } from "next-intl/server";

import { CategoryTreeItem } from "@/features/categories/components/category-tree-item";
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";

interface CategoryTreeProps {
  categories: CategoryWithChildren[];
}

const SECTIONS = [
  { type: "EXPENSE", label: "sections.expense" },
  { type: "INCOME", label: "sections.income" },
  { type: "TRANSFER", label: "sections.transfer" },
] as const;

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
    <div className="flex flex-col gap-6">
      {SECTIONS.map((section) => {
        const sectionCategories = rootCategories.filter(
          (c) => c.transactionType === section.type,
        );
        if (sectionCategories.length === 0) return null;

        return (
          <section key={section.type} className="flex flex-col gap-1">
            <h2 className="text-muted-foreground px-2 text-xs font-medium">
              {t(section.label)}
            </h2>
            {sectionCategories.map((category) => (
              <CategoryTreeItem
                key={category.id}
                category={category}
                allCategories={categories}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}
