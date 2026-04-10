"use client";

import { useRef } from "react";
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
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";
import type { TagOption } from "@/features/tags/types/tags.types";
import type { TransactionFilters as Filters } from "@/features/transactions/types/transactions.types";

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

  const rootCategories = categories.filter((c) => c.parentId === null);

  function handleApply(formData: FormData) {
    const params = new URLSearchParams();

    const dateFrom = formData.get("dateFrom") as string;
    const dateTo = formData.get("dateTo") as string;
    const type = formData.get("type") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const categoryId = formData.get("categoryId") as string;
    const tagId = formData.get("tagId") as string;

    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (type && type !== "ALL") params.set("type", type);
    if (paymentMethod && paymentMethod !== "ALL") params.set("paymentMethod", paymentMethod);
    if (categoryId && categoryId !== "ALL") params.set("categoryId", categoryId);
    if (tagId && tagId !== "ALL") params.set("tagId", tagId);

    params.set("page", "1");

    router.push(`/transactions?${params.toString()}`);
  }

  function handleClear() {
    router.push("/transactions");
  }

  return (
    <form ref={formRef} action={handleApply} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <Label className="text-xs">{t("filter.from")}</Label>
        <DatePicker
          name="dateFrom"
          defaultValue={currentFilters.dateFrom ?? undefined}
          className="w-36"
          placeholder={t("filter.from")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs">{t("filter.to")}</Label>
        <DatePicker
          name="dateTo"
          defaultValue={currentFilters.dateTo ?? undefined}
          className="w-36"
          placeholder={t("filter.to")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs">{t("filter.type")}</Label>
        <Select
          name="type"
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
        <Select
          name="categoryId"
          defaultValue={currentFilters.categoryId ?? "ALL"}
          items={[
            { value: "ALL", label: t("filter.all") },
            ...rootCategories.flatMap((cat) => [
              { value: cat.id, label: cat.name },
              ...cat.children.map((child) => ({
                value: child.id,
                label: child.name,
              })),
            ]),
          ]}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t("filter.all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("filter.all")}</SelectItem>
            {rootCategories.map((cat) => (
              <span key={cat.id}>
                <SelectItem value={cat.id}>{cat.name}</SelectItem>
                {cat.children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    <span className="pl-4">{child.name}</span>
                  </SelectItem>
                ))}
              </span>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs">{t("filter.tag")}</Label>
          <Select
            name="tagId"
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
                      className="inline-block size-2 rounded-none"
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

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          {t("filter.apply")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleClear}>
          {t("filter.clear")}
        </Button>
      </div>
    </form>
  );
}
