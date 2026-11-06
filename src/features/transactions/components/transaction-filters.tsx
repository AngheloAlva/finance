"use client";

import { useRef, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

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
import { CategorySelect } from "@/features/categories/components/category-select";
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";
import type { TagOption } from "@/features/tags/types/tags.types";
import type { TransactionFilters as Filters } from "@/features/transactions/types/transactions.types";
import { cn } from "@/lib/utils";

interface TransactionFiltersProps {
  categories: CategoryWithChildren[];
  tags?: TagOption[];
  currentFilters: Filters;
}

export function TransactionFilters({
  categories,
  tags = [],
  currentFilters,
}: TransactionFiltersProps) {
  const t = useTranslations("transactions");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [search, setSearch] = useState(currentFilters.search ?? "");
  const [categoryId, setCategoryId] = useState(currentFilters.categoryId ?? "");

  const activeCount = [
    currentFilters.dateFrom,
    currentFilters.dateTo,
    currentFilters.type,
    currentFilters.paymentMethod,
    currentFilters.categoryId,
    currentFilters.tagId,
  ].filter(Boolean).length;
  const [isOpen, setIsOpen] = useState(activeCount > 0);
  const [resetKey, setResetKey] = useState(0);

  /** Waits for React to commit the picker's value into its hidden input. */
  function applySoon(delay = 0) {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => formRef.current?.requestSubmit(), delay);
  }

  function handleApply(formData: FormData) {
    const params = new URLSearchParams();

    const query = (formData.get("search") as string).trim();
    const dateFrom = formData.get("dateFrom") as string;
    const dateTo = formData.get("dateTo") as string;
    const type = formData.get("type") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const selectedCategory = formData.get("categoryId") as string;
    const tagId = formData.get("tagId") as string;

    if (query) params.set("search", query);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (type && type !== "ALL") params.set("type", type);
    if (paymentMethod && paymentMethod !== "ALL") params.set("paymentMethod", paymentMethod);
    if (selectedCategory) params.set("categoryId", selectedCategory);
    if (tagId && tagId !== "ALL") params.set("tagId", tagId);

    params.set("page", "1");

    router.replace(`/transactions?${params.toString()}`);
  }

  function handleClear() {
    clearTimeout(searchTimer.current);
    setSearch("");
    setCategoryId("");
    setResetKey((key) => key + 1);
    setIsOpen(false);
    router.replace("/transactions");
  }

  return (
    <form ref={formRef} action={handleApply} className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input
            name="search"
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              applySoon(350);
            }}
            placeholder={t("filter.search")}
            aria-label={t("filter.search")}
            className="pl-8"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <SlidersHorizontal className="size-3.5" data-icon="inline-start" />
          {t("filter.toggle")}
          {activeCount > 0 && <span className="tabular-nums">({activeCount})</span>}
        </Button>
      </div>

      <div
        key={resetKey}
        className={cn("flex-wrap items-end gap-3", isOpen ? "flex" : "hidden")}
      >
      <div className="flex flex-col gap-1">
        <Label className="text-xs">{t("filter.from")}</Label>
        <DatePicker
          name="dateFrom"
          defaultValue={currentFilters.dateFrom ?? undefined}
          onChange={() => applySoon()}
          className="w-36"
          placeholder={t("filter.from")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs">{t("filter.to")}</Label>
        <DatePicker
          name="dateTo"
          defaultValue={currentFilters.dateTo ?? undefined}
          onChange={() => applySoon()}
          className="w-36"
          placeholder={t("filter.to")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs">{t("filter.type")}</Label>
        <Select
          name="type"
          onValueChange={() => applySoon()}
          defaultValue={currentFilters.type ?? "ALL"}
          items={[
            { value: "ALL", label: t("filter.all") },
            { value: "INCOME", label: t("types.income") },
            { value: "EXPENSE", label: t("types.expense") },
            { value: "TRANSFER", label: t("types.transfer") },
          ]}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder={t("filter.all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("filter.all")}</SelectItem>
            <SelectItem value="INCOME">{t("types.income")}</SelectItem>
            <SelectItem value="EXPENSE">{t("types.expense")}</SelectItem>
            <SelectItem value="TRANSFER">{t("types.transfer")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs">{t("filter.method")}</Label>
        <Select
          name="paymentMethod"
          onValueChange={() => applySoon()}
          defaultValue={currentFilters.paymentMethod ?? "ALL"}
          items={[
            { value: "ALL", label: t("filter.all") },
            { value: "CASH", label: t("paymentMethods.cash") },
            { value: "DEBIT", label: t("paymentMethods.debit") },
            { value: "CREDIT", label: t("paymentMethods.credit") },
            { value: "TRANSFER", label: t("paymentMethods.transfer") },
            { value: "OTHER", label: t("paymentMethods.other") },
          ]}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder={t("filter.all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("filter.all")}</SelectItem>
            <SelectItem value="CASH">{t("paymentMethods.cash")}</SelectItem>
            <SelectItem value="DEBIT">{t("paymentMethods.debit")}</SelectItem>
            <SelectItem value="CREDIT">{t("paymentMethods.credit")}</SelectItem>
            <SelectItem value="TRANSFER">{t("paymentMethods.transfer")}</SelectItem>
            <SelectItem value="OTHER">{t("paymentMethods.other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs">{t("filter.category")}</Label>
        <CategorySelect
          categories={categories}
          name="categoryId"
          value={categoryId}
          onValueChange={(value) => {
            setCategoryId(value ?? "");
            applySoon();
          }}
        />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs">{t("filter.tag")}</Label>
          <Select
            name="tagId"
            onValueChange={() => applySoon()}
            defaultValue={currentFilters.tagId ?? "ALL"}
            items={[
              { value: "ALL", label: t("filter.all") },
              ...tags.map((tag) => ({ value: tag.id, label: tag.name })),
            ]}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t("filter.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("filter.all")}</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {activeCount > 0 && (
        <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
          {t("filter.clear")}
        </Button>
      )}
      </div>
    </form>
  );
}
