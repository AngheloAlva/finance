import { getLocale, getTranslations } from "next-intl/server";

import { getFinancialSnapshot } from "@/features/simulations/lib/simulations.queries";
import { SimulationTabs } from "@/features/simulations/components/simulation-tabs";
import { APP_CURRENCY } from "@/shared/lib/constants";
import { requireSession } from "@/shared/lib/auth";

export default async function SimulationsPage() {
  const t = await getTranslations("simulations");
  const session = await requireSession();
  const currency = APP_CURRENCY;
  const snapshot = await getFinancialSnapshot(session.user.id, await getLocale());

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        {snapshot.isLimitedData && (
          <p className="text-xs text-muted-foreground">
            {t("limitedData", { months: snapshot.dataMonths })}
          </p>
        )}
      </div>

      <SimulationTabs
        creditCards={snapshot.creditCards}
        goals={snapshot.goals}
        currency={currency}
      />
    </div>
  );
}
