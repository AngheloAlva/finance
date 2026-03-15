import { computeStatementDates } from "@/features/credit-cards/lib/billing-cycle.utils";
import { computeNextDate } from "@/features/recurring/lib/recurring.utils";
import { prisma } from "@/shared/lib/prisma";

/**
 * Generate all pending recurring transaction instances for a user.
 *
 * Finds active recurrence rules where nextGenerationDate <= today,
 * creates transaction instances from templates, and advances the rules.
 * Deactivates rules that have passed their endDate.
 *
 * @param userId - The user to generate transactions for
 * @returns The number of transactions generated
 */
export async function generatePendingRecurring(userId: string): Promise<number> {
  const now = new Date();

  const templates = await prisma.transaction.findMany({
    where: {
      userId,
      isTemplate: true,
      recurrenceRule: {
        isActive: true,
        nextGenerationDate: { lte: now },
      },
    },
    include: {
      recurrenceRule: true,
    },
  });

  if (templates.length === 0) return 0;

  const templateIds = templates.map((t) => t.id);

  // Pre-fetch all existing generated transactions for these templates (duplicate guard)
  const existingTransactions = await prisma.transaction.findMany({
    where: {
      generatedFromId: { in: templateIds },
      isTemplate: false,
    },
    select: {
      generatedFromId: true,
      date: true,
    },
  });

  // Build a Set of "templateId|dateISO" for O(1) duplicate lookups
  const existingSet = new Set(
    existingTransactions.map(
      (tx) => `${tx.generatedFromId}|${tx.date.toISOString()}`,
    ),
  );

  // Pre-fetch all credit cards needed (deduplicated)
  const creditCardIds = [
    ...new Set(
      templates
        .map((t) => t.creditCardId)
        .filter((id): id is string => id != null),
    ),
  ];

  const creditCards =
    creditCardIds.length > 0
      ? await prisma.creditCard.findMany({
          where: { id: { in: creditCardIds } },
        })
      : [];

  const creditCardMap = new Map(creditCards.map((cc) => [cc.id, cc]));

  let totalGenerated = 0;

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  // Collect rule updates to batch at the end
  const ruleUpdates: Array<{
    id: string;
    data: { nextGenerationDate: Date; isActive?: boolean };
  }> = [];

  for (const template of templates) {
    const rule = template.recurrenceRule;
    if (!rule) continue;

    let currentDate = new Date(rule.nextGenerationDate);

    // Collect create payloads for this template
    const createPayloads: Array<{
      amount: number;
      description: string;
      notes: string | null;
      date: Date;
      impactDate: Date;
      type: typeof template.type;
      paymentMethod: typeof template.paymentMethod;
      categoryId: string;
      userId: string;
      isTemplate: false;
      generatedFromId: string;
      creditCardId: string | null;
    }> = [];

    while (currentDate <= todayStart) {
      if (rule.endDate && currentDate > rule.endDate) {
        break;
      }

      const key = `${template.id}|${currentDate.toISOString()}`;

      if (!existingSet.has(key)) {
        let impactDate = currentDate;

        if (template.creditCardId) {
          const creditCard = creditCardMap.get(template.creditCardId);

          if (creditCard) {
            const { paymentDueDate } = computeStatementDates(
              creditCard.closingDay,
              creditCard.paymentDay,
              currentDate,
            );
            impactDate = paymentDueDate;
          }
        }

        createPayloads.push({
          amount: template.amount,
          description: template.description,
          notes: template.notes,
          date: currentDate,
          impactDate,
          type: template.type,
          paymentMethod: template.paymentMethod,
          categoryId: template.categoryId,
          userId: template.userId,
          isTemplate: false,
          generatedFromId: template.id,
          creditCardId: template.creditCardId,
        });
      }

      currentDate = computeNextDate(
        currentDate,
        rule.frequency,
        rule.interval,
      );
    }

    // Batch-create all transactions for this template
    if (createPayloads.length > 0) {
      await prisma.transaction.createMany({ data: createPayloads });
      totalGenerated += createPayloads.length;
    }

    // Queue rule update
    const nextDate = currentDate;
    if (rule.endDate && nextDate > rule.endDate) {
      ruleUpdates.push({
        id: rule.id,
        data: { isActive: false, nextGenerationDate: nextDate },
      });
    } else {
      ruleUpdates.push({
        id: rule.id,
        data: { nextGenerationDate: nextDate },
      });
    }
  }

  // Batch all rule updates in a single transaction
  if (ruleUpdates.length > 0) {
    await prisma.$transaction(
      ruleUpdates.map((update) =>
        prisma.recurrenceRule.update({
          where: { id: update.id },
          data: update.data,
        }),
      ),
    );
  }

  return totalGenerated;
}
