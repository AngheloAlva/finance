"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";
import type { TagOption } from "@/features/tags/types/tags.types";
import { getPaymentMethodOptions } from "@/features/transactions/lib/payment-method-options";
import { cn } from "@/lib/utils";
import { DateRangeSelector } from "@/features/analytics/components/date-range-selector";
import { hasActiveFilters } from "@/features/analytics/lib/analytics-filters";
import type { AnalyticsFilters } from "@/features/analytics/types/analytics.types";

const ALL = "ALL";
const CARD_PREFIX = "card:";
const FILTER_PARAMS = ["categories", "method", "card", "tag"] as const;

interface AnalyticsFiltersBarProps {
  preset: string;
  from: string;
  to: string;
  filters: AnalyticsFilters;
  categories: CategoryWithChildren[];
  creditCards: Array<{ id: string; name: string }>;
  tags: TagOption[];
}

export function AnalyticsFiltersBar({
  preset,
  from,
  to,
  filters,
  categories,
  creditCards,
  tags,
}: AnalyticsFiltersBarProps) {
  const t = useTranslations("analytics.filters");
  const tTransactions = useTranslations("transactions");
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(update: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    update(params);
    router.push(`/analytics?${params.toString()}`, { scroll: false });
  }

  const methodValue = filters.creditCardId
    ? `${CARD_PREFIX}${filters.creditCardId}`
    : (filters.paymentMethod ?? ALL);

  const methodItems = [
    { value: ALL, label: t("allMethods") },
    ...getPaymentMethodOptions(tTransactions).flatMap((option) => [
      option,
      ...(option.value === "CREDIT"
        ? creditCards.map((card) => ({ value: `${CARD_PREFIX}${card.id}`, label: card.name }))
        : []),
    ]),
  ];

  const tagItems = [
    { value: ALL, label: t("allTags") },
    ...tags.map((tag) => ({ value: tag.id, label: tag.name })),
  ];

  const hasFilters = hasActiveFilters(filters);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangeSelector
        currentPreset={preset}
        from={from}
        to={to}
        onPresetChange={(value) =>
          navigate((params) => {
            params.set("preset", value);
            params.delete("from");
            params.delete("to");
          })
        }
        onRangeChange={(nextFrom, nextTo) =>
          navigate((params) => {
            params.set("preset", "custom");
            params.set("from", nextFrom);
            params.set("to", nextTo);
          })
        }
      />

      <CategoryMultiSelect
        categories={categories}
        selectedIds={filters.categoryIds}
        onChange={(ids) =>
          navigate((params) => {
            if (ids.length > 0) params.set("categories", ids.join(","));
            else params.delete("categories");
          })
        }
      />

      <Select
        value={methodValue}
        items={methodItems}
        onValueChange={(value) =>
          navigate((params) => {
            params.delete("method");
            params.delete("card");
            if (typeof value !== "string" || value === ALL) return;
            if (value.startsWith(CARD_PREFIX)) params.set("card", value.slice(CARD_PREFIX.length));
            else params.set("method", value);
          })
        }
      >
        <SelectTrigger className="w-40" aria-label={t("method")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {methodItems.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
              className={item.value.startsWith(CARD_PREFIX) ? "pl-6" : undefined}
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {tags.length > 0 && (
        <Select
          value={filters.tagId ?? ALL}
          items={tagItems}
          onValueChange={(value) =>
            navigate((params) => {
              if (typeof value === "string" && value !== ALL) params.set("tag", value);
              else params.delete("tag");
            })
          }
        >
          <SelectTrigger className="w-36" aria-label={t("tag")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("allTags")}</SelectItem>
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
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          onClick={() =>
            navigate((params) => {
              for (const key of FILTER_PARAMS) params.delete(key);
            })
          }
        >
          {t("clear")}
        </Button>
      )}
    </div>
  );
}

const TYPE_ORDER = ["EXPENSE", "INCOME"] as const;

interface CategoryMultiSelectProps {
  categories: CategoryWithChildren[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/** Checkbox list grouped by type; the URL updates once, when it closes. */
function CategoryMultiSelect({ categories, selectedIds, onChange }: CategoryMultiSelectProps) {
  const t = useTranslations("analytics.filters");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selectedIds);

  const sections = useMemo(
    () =>
      TYPE_ORDER.map((type) => ({
        type,
        parents: categories
          .filter((c) => c.parentId === null && c.transactionType === type)
          .sort((a, b) => a.name.localeCompare(b.name)),
      })).filter((section) => section.parents.length > 0),
    [categories],
  );

  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) {
      map.set(category.id, category.name);
      for (const child of category.children) map.set(child.id, child.name);
    }
    return map;
  }, [categories]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(selectedIds);
    } else {
      const changed =
        draft.length !== selectedIds.length || draft.some((id) => !selectedIds.includes(id));
      if (changed) onChange(draft);
    }
    setOpen(nextOpen);
  }

  function toggle(id: string, checked: boolean) {
    setDraft((current) => (checked ? [...current, id] : current.filter((value) => value !== id)));
  }

  const label =
    selectedIds.length === 0
      ? t("allCategories")
      : selectedIds.length === 1
        ? (names.get(selectedIds[0]) ?? t("categoriesCount", { count: 1 }))
        : t("categoriesCount", { count: selectedIds.length });

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="max-w-48 justify-between font-normal"
            aria-label={t("category")}
          />
        }
      >
        <span className="truncate">{label}</span>
        <ChevronDownIcon className="text-muted-foreground size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="max-h-80 overflow-y-auto p-2">
          {sections.map((section) => (
            <div key={section.type} className="mb-2 last:mb-0">
              <p className="text-muted-foreground px-2 py-1 text-xs font-medium">
                {t(section.type === "EXPENSE" ? "expenses" : "income")}
              </p>
              {section.parents.map((parent) => (
                <div key={parent.id}>
                  <CategoryCheckbox
                    id={parent.id}
                    name={parent.name}
                    color={parent.color}
                    checked={draft.includes(parent.id)}
                    onCheckedChange={toggle}
                  />
                  {parent.children.map((child) => (
                    <CategoryCheckbox
                      key={child.id}
                      id={child.id}
                      name={child.name}
                      color={child.color}
                      checked={draft.includes(child.id) || draft.includes(parent.id)}
                      disabled={draft.includes(parent.id)}
                      indent
                      onCheckedChange={toggle}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
        {draft.length > 0 && (
          <div className="border-t p-2">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setDraft([])}>
              {t("clearCategories")}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface CategoryCheckboxProps {
  id: string;
  name: string;
  color: string;
  checked: boolean;
  disabled?: boolean;
  indent?: boolean;
  onCheckedChange: (id: string, checked: boolean) => void;
}

function CategoryCheckbox({
  id,
  name,
  color,
  checked,
  disabled,
  indent,
  onCheckedChange,
}: CategoryCheckboxProps) {
  return (
    <label
      className={cn(
        "hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm has-disabled:cursor-default has-disabled:opacity-60",
        indent && "pl-7",
      )}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(id, value === true)}
      />
      <span className="inline-block size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="truncate">{name}</span>
    </label>
  );
}
