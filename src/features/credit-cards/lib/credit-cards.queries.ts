import { TransactionType } from "@/generated/prisma/enums";
import { prisma } from "@/shared/lib/prisma";

import { getCurrentCycleRange } from "@/features/credit-cards/lib/billing-cycle.utils";
import type { CreditCardWithUsage } from "@/features/credit-cards/types/credit-cards.types";

export async function getCreditCards(
  userId: string,
): Promise<CreditCardWithUsage[]> {
  const cards = await prisma.creditCard.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  const cardsWithUsage = await Promise.all(
    cards.map(async (card) => {
      const usage = await getCreditCardUsage(
        card.id,
        card.closingDay,
        card.paymentDay,
        card.totalLimit,
      );
      return {
        ...card,
        usedLimit: usage.used,
        availableLimit: usage.available,
      };
    }),
  );

  return cardsWithUsage;
}

export async function getCreditCardById(
  id: string,
  userId: string,
) {
  const card = await prisma.creditCard.findUnique({
    where: { id },
  });

  if (!card || card.userId !== userId) {
    return null;
  }

  return card;
}

export async function getCreditCardUsage(
  creditCardId: string,
  closingDay: number,
  paymentDay: number,
  totalLimit: number,
): Promise<{ used: number; available: number; total: number }> {
  const { start, end } = getCurrentCycleRange(closingDay, paymentDay);

  const result = await prisma.transaction.aggregate({
    where: {
      creditCardId,
      type: TransactionType.EXPENSE,
      isTemplate: false,
      date: { gte: start, lte: end },
    },
    _sum: { amount: true },
  });

  const used = result._sum.amount ?? 0;

  return {
    used,
    available: Math.max(0, totalLimit - used),
    total: totalLimit,
  };
}

export async function getCreditCardWithTransactions(
  id: string,
  userId: string,
  cycleStart?: Date,
  cycleEnd?: Date,
) {
  const card = await prisma.creditCard.findUnique({
    where: { id },
  });

  if (!card || card.userId !== userId) {
    return null;
  }

  const { start, end } = cycleStart && cycleEnd
    ? { start: cycleStart, end: cycleEnd }
    : getCurrentCycleRange(card.closingDay, card.paymentDay);

  const transactions = await prisma.transaction.findMany({
    where: {
      creditCardId: id,
      isTemplate: false,
      date: { gte: start, lte: end },
    },
    orderBy: { date: "desc" },
    include: {
      category: {
        select: { id: true, name: true, icon: true, color: true },
      },
      creditCard: {
        select: { name: true, lastFourDigits: true, color: true },
      },
      tags: {
        include: { tag: { select: { id: true, name: true, color: true } } },
      },
    },
  });

  const used = transactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return {
    ...card,
    usedLimit: used,
    availableLimit: Math.max(0, card.totalLimit - used),
    transactions,
    cycleStart: start,
    cycleEnd: end,
  };
}
