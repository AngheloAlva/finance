import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { CreditCardDialog } from "@/features/credit-cards/components/credit-card-dialog";
import { CreditCardList } from "@/features/credit-cards/components/credit-card-list";
import { requireSession } from "@/shared/lib/auth";
import type { CurrencyCode } from "@/shared/lib/constants";

export default async function CreditCardsPage() {
  const [session, t] = await Promise.all([requireSession(), getTranslations("creditCards")]);
  const currency = (session.user.currency ?? "USD") as CurrencyCode;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <CreditCardDialog
          mode="create"
          trigger={
            <Button size="sm">
              <Plus className="size-3.5" data-icon="inline-start" />
              {t("newCard")}
            </Button>
          }
        />
      </div>

      <CreditCardList userId={session.user.id} currency={currency} />
    </div>
  );
}
