import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { getUserCategories } from "@/features/categories/lib/categories.queries";
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";
import { RecurringDialog } from "@/features/recurring/components/recurring-dialog";
import { RecurringList } from "@/features/recurring/components/recurring-list";
import { GenerateButton } from "@/features/recurring/components/generate-button";
import {
  getRecurringTemplates,
  getPendingGenerations,
} from "@/features/recurring/lib/recurring.queries";
import { requireSession } from "@/shared/lib/auth";
import type { CurrencyCode } from "@/shared/lib/constants";

export default async function RecurringPage() {
  const t = await getTranslations("recurring");
  const session = await requireSession();

  const [templates, pending, categories] = await Promise.all([
    getRecurringTemplates(session.user.id),
    getPendingGenerations(session.user.id),
    getUserCategories(session.user.id),
  ]);

  const currency = (session.user.currency ?? "USD") as CurrencyCode;
  const typedCategories = categories as CategoryWithChildren[];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <GenerateButton pendingCount={pending.length} />
          <RecurringDialog
            mode="create"
            categories={typedCategories}
            trigger={
              <Button size="sm">
                <Plus className="size-3.5" data-icon="inline-start" />
                {t("newRecurring")}
              </Button>
            }
          />
        </div>
      </div>

      <RecurringList
        templates={templates}
        currency={currency}
        categories={typedCategories}
      />
    </div>
  );
}
