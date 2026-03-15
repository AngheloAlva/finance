import { notFound } from "next/navigation";

import { InvestmentDetail } from "@/features/investments/components/investment-detail";
import { getInvestmentWithSnapshots } from "@/features/investments/lib/investments.queries";
import { requireSession } from "@/shared/lib/auth";

interface InvestmentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvestmentDetailPage({
  params,
}: InvestmentDetailPageProps) {
  const session = await requireSession();
  const { id } = await params;

  const investment = await getInvestmentWithSnapshots(id, session.user.id);

  if (!investment) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <InvestmentDetail investment={investment} />
    </div>
  );
}
