import { prisma } from "@/shared/lib/prisma";

import type { RecurringTemplateWithRule } from "../types/recurring.types";

export async function getRecurringTemplates(
  userId: string,
): Promise<RecurringTemplateWithRule[]> {
  const templates = await prisma.transaction.findMany({
    where: {
      userId,
      isTemplate: true,
    },
    include: {
      recurrenceRule: {
        select: {
          id: true,
          frequency: true,
          interval: true,
          nextGenerationDate: true,
          endDate: true,
          isActive: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter out any templates without a recurrence rule (data integrity)
  return templates.filter(
    (t): t is RecurringTemplateWithRule => t.recurrenceRule !== null,
  );
}

export async function getPendingGenerations(
  userId: string,
): Promise<RecurringTemplateWithRule[]> {
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
      recurrenceRule: {
        select: {
          id: true,
          frequency: true,
          interval: true,
          nextGenerationDate: true,
          endDate: true,
          isActive: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
    },
  });

  return templates.filter(
    (t): t is RecurringTemplateWithRule => t.recurrenceRule !== null,
  );
}
