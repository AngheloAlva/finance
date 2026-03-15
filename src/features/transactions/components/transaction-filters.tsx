"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";
import type { TransactionFilters as Filters } from "@/features/transactions/types/transactions.types";

interface TransactionFiltersProps {
  categories: CategoryWithChildren[];
  currentFilters: Filters;
}

export function TransactionFilters({
  categories,
  currentFilters,
}: TransactionFiltersProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const rootCategories = categories.filter((c) => c.parentId === null);

  function handleApply(formData: FormData) {
    const params = new URLSearchParams();

    const dateFrom = formData.get("dateFrom") as string;
    const dateTo = formData.get("dateTo") as string;
    const type = formData.get("type") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const categoryId = formData.get("categoryId") as string;

    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (type && type !== "ALL") params.set("type", type);
    if (paymentMethod && paymentMethod !== "ALL") params.set("paymentMethod", paymentMethod);
    if (categoryId && categoryId !== "ALL") params.set("categoryId", categoryId);

    params.set("page", "1");

    router.push(`/transactions?${params.toString()}`);
  }

  function handleClear() {
    router.push("/transactions");
  }

  return (
    <form ref={formRef} action={handleApply} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <Label className="text-xs">From</Label>
        <DatePicker
          name="dateFrom"
          defaultValue={currentFilters.dateFrom ?? undefined}
          className="w-36"
          placeholder="From"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs">To</Label>
        <DatePicker
          name="dateTo"
          defaultValue={currentFilters.dateTo ?? undefined}
          className="w-36"
          placeholder="To"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs">Type</Label>
        <Select name="type" defaultValue={currentFilters.type ?? "ALL"}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" label="All">All</SelectItem>
            <SelectItem value="INCOME" label="Income">Income</SelectItem>
            <SelectItem value="EXPENSE" label="Expense">Expense</SelectItem>
            <SelectItem value="TRANSFER" label="Transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs">Method</Label>
        <Select
          name="paymentMethod"
          defaultValue={currentFilters.paymentMethod ?? "ALL"}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" label="All">All</SelectItem>
            <SelectItem value="CASH" label="Cash">Cash</SelectItem>
            <SelectItem value="DEBIT" label="Debit">Debit</SelectItem>
            <SelectItem value="CREDIT" label="Credit">Credit</SelectItem>
            <SelectItem value="TRANSFER" label="Transfer">Transfer</SelectItem>
            <SelectItem value="OTHER" label="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs">Category</Label>
        <Select name="categoryId" defaultValue={currentFilters.categoryId ?? "ALL"}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" label="All">All</SelectItem>
            {rootCategories.map((cat) => (
              <span key={cat.id}>
                <SelectItem value={cat.id} label={cat.name}>{cat.name}</SelectItem>
                {cat.children.map((child) => (
                  <SelectItem key={child.id} value={child.id} label={child.name}>
                    <span className="pl-4">{child.name}</span>
                  </SelectItem>
                ))}
              </span>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Apply
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleClear}>
          Clear
        </Button>
      </div>
    </form>
  );
}
