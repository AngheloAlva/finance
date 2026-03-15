"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";

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

const SPLIT_RULE_LABELS = {
  EQUAL: "Equal",
  PROPORTIONAL: "Proportional",
  CUSTOM: "Custom",
} as const;

interface GroupTransactionTableProps {
  transactions: TransactionWithSplits[];
  currency: CurrencyCode;
}

export function GroupTransactionTable({
  transactions,
  currency,
}: GroupTransactionTableProps) {
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
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Payer</TableHead>
            <TableHead>Split</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={8}
              className="py-8 text-center text-muted-foreground"
            >
              No transactions found.
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
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Payer</TableHead>
          <TableHead>Split</TableHead>
          <TableHead className="w-20">Actions</TableHead>
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
        <TableCell>{formatDate(tx.date, "short")}</TableCell>
        <TableCell className="max-w-48 truncate">{tx.description}</TableCell>
        <TableCell>
          <CurrencyDisplay cents={tx.amount} currency={currency} />
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
            {SPLIT_RULE_LABELS[tx.splitRule as keyof typeof SPLIT_RULE_LABELS] ??
              tx.splitRule}
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
              <CurrencyDisplay cents={split.amount} currency={currency} />
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
