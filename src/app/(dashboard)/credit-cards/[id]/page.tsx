import { notFound } from "next/navigation";

import { CreditCardDetail } from "@/features/credit-cards/components/credit-card-detail";
import { getCreditCardWithTransactions } from "@/features/credit-cards/lib/credit-cards.queries";
import { requireSession } from "@/shared/lib/auth";
import type { CurrencyCode } from "@/shared/lib/constants";

interface CreditCardDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CreditCardDetailPage({
  params,
}: CreditCardDetailPageProps) {
  const session = await requireSession();
  const { id } = await params;
  const currency = (session.user.currency ?? "USD") as CurrencyCode;

  const result = await getCreditCardWithTransactions(id, session.user.id);

  if (!result) {
    notFound();
  }

  const { transactions, cycleStart, cycleEnd, usedLimit, availableLimit, ...card } = result;

  const cardWithUsage = {
    ...card,
    usedLimit,
    availableLimit,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <CreditCardDetail
        card={cardWithUsage}
        transactions={transactions}
        cycleStart={cycleStart}
        cycleEnd={cycleEnd}
        currency={currency}
      />
    </div>
  );
}
