"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { simulateAffordabilityAction } from "@/features/simulations/actions/simulate-affordability.action";
import { AffordabilityResults } from "@/features/simulations/components/affordability-results";
import { SimulationEmptyState } from "@/features/simulations/components/simulation-empty-state";
import type {
  AffordabilityResult,
  CreditCardSnapshot,
} from "@/features/simulations/types/simulations.types";
import { FieldError } from "@/shared/components/field-error";
import type { CurrencyCode } from "@/shared/lib/constants";
import type { ActionResult } from "@/shared/types/common.types";

interface AffordabilityFormProps {
  creditCards: CreditCardSnapshot[];
  currency: CurrencyCode;
}

const initialState: ActionResult<AffordabilityResult> = {
  success: false,
  error: "",
};

export function AffordabilityForm({
  creditCards,
  currency,
}: AffordabilityFormProps) {
  const t = useTranslations("simulations.affordability");
  const tErrors = useTranslations("errors");
  const [state, formAction, isPending] = useActionState(
    simulateAffordabilityAction,
    initialState,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="currencyCode" value={currency} />
          <div className="space-y-2">
            <Label htmlFor="purchaseAmount">{t("purchaseAmount")}</Label>
            <Input
              id="purchaseAmount"
              name="purchaseAmount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              required
              disabled={isPending}
            />
            {!state.success && <FieldError errors={state.fieldErrors?.purchaseAmount} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="installments">{t("installments")}</Label>
            <Input
              id="installments"
              name="installments"
              type="number"
              min={1}
              max={48}
              defaultValue={1}
              disabled={isPending}
            />
          </div>

          {creditCards.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="creditCardId">{t("creditCard")}</Label>
              <NativeSelect
                className="w-full"
                id="creditCardId"
                name="creditCardId"
                disabled={isPending}
              >
                <option value="">{t("noneCashDebit")}</option>
                {creditCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name} (*{card.lastFourDigits})
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                {t("simulating")}
              </>
            ) : (
              t("simulate")
            )}
          </Button>

          {!state.success && state.error && !state.fieldErrors && (
            <p className="text-xs text-destructive">{tErrors(state.error as Parameters<typeof tErrors>[0])}</p>
          )}
        </form>
      </div>

      <div>
        {state.success ? (
          <AffordabilityResults result={state.data} currency={currency} />
        ) : (
          <SimulationEmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
          />
        )}
      </div>
    </div>
  );
}
