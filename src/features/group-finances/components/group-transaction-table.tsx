"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteGroupTransactionButton } from "@/features/group-finances/components/delete-group-transaction-button";
import { SettleButton } from "@/features/group-finances/components/settle-button";
import type { TransactionWithSplits } from "@/features/group-finances/types/group-finances.types";
import { CategoryIcon } from "@/shared/components/category-icon";
import { CurrencyDisplay } from "@/shared/components/currency-display";
import type { CurrencyCode } from "@/shared/lib/constants";
import { formatDate } from "@/shared/lib/formatters";

const SPLIT_RULE_KEYS = {
  EQUAL: "equal",
  PROPORTIONAL: "proportional",
  CUSTOM: "custom",
} as const;

interface GroupTransactionTableProps {
  transactions: TransactionWithSplits[];
  currency: CurrencyCode;
}

export function GroupTransactionTable({
  transactions,
  currency,
}: GroupTransactionTableProps) {
  const t = useTranslations("groupFinances.table");
  const tSplit = useTranslations("groupFinances.splitRules");
  const locale = useLocale();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (transactions.length === 0) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead>{t("date")}</TableHead>
            <TableHead>{t("description")}</TableHead>
            <TableHead>{t("amount")}</TableHead>
            <TableHead>{t("category")}</TableHead>
            <TableHead>{t("payer")}</TableHead>
            <TableHead>{t("split")}</TableHead>
            <TableHead className="w-20">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={8}
              className="py-8 text-center text-muted-foreground"
            >
              {t("noTransactions")}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8" />
          <TableHead>{t("date")}</TableHead>
          <TableHead>{t("description")}</TableHead>
          <TableHead>{t("amount")}</TableHead>
          <TableHead>{t("category")}</TableHead>
          <TableHead>{t("payer")}</TableHead>
          <TableHead>{t("split")}</TableHead>
          <TableHead className="w-20">{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => {
          const isExpanded = expandedRows.has(tx.id);

          return (
            <TransactionRow
              key={tx.id}
              tx={tx}
              currency={currency}
              isExpanded={isExpanded}
              onToggle={() => toggleRow(tx.id)}
            />
          );
        })}
      </TableBody>
    </Table>
  );
}

// ---------------------------------------------------------------------------
// Single transaction row + expandable splits
// ---------------------------------------------------------------------------

function TransactionRow({
  tx,
  currency,
  isExpanded,
  onToggle,
}: {
  tx: TransactionWithSplits;
  currency: CurrencyCode;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const tSplit = useTranslations("groupFinances.splitRules");
  const locale = useLocale();
  return (
    <>
      <TableRow>
        <TableCell>
          <Button variant="ghost" size="icon-xs" onClick={onToggle}>
            {isExpanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </Button>
        </TableCell>
        <TableCell>{formatDate(tx.date, "short", locale)}</TableCell>
        <TableCell className="max-w-48 truncate">{tx.description}</TableCell>
        <TableCell>
          <CurrencyDisplay cents={tx.amount} currency={currency} locale={locale} />
        </TableCell>
        <TableCell>
          <span className="inline-flex items-center gap-1.5">
            <CategoryIcon icon={tx.category.icon} color={tx.category.color} />
            <span>{tx.category.name}</span>
          </span>
        </TableCell>
        <TableCell>{tx.payer.name ?? tx.payer.email}</TableCell>
        <TableCell>
          <Badge variant="outline">
            {tSplit(SPLIT_RULE_KEYS[tx.splitRule as keyof typeof SPLIT_RULE_KEYS] ?? tx.splitRule)}
          </Badge>
        </TableCell>
        <TableCell>
          <DeleteGroupTransactionButton
            transactionId={tx.id}
            transactionDescription={tx.description}
          />
        </TableCell>
      </TableRow>

      {isExpanded &&
        tx.splits.map((split) => (
          <TableRow key={split.splitId} className="bg-muted/30">
            <TableCell />
            <TableCell colSpan={2} className="pl-8 text-sm">
              {split.userName ?? split.userEmail}
            </TableCell>
            <TableCell>
              <CurrencyDisplay cents={split.amount} currency={currency} locale={locale} />
            </TableCell>
            <TableCell colSpan={2} />
            <TableCell colSpan={2}>
              <SettleButton splitId={split.splitId} isPaid={split.isPaid} />
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}
