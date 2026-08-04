"use client";

import { Fragment, useMemo } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { FieldError } from "@/shared/components/field-error";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";

interface CategorySelectProps {
  categories: CategoryWithChildren[];
  name: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string | null) => void;
  error?: string;
}

export function CategorySelect({
  categories,
  name,
  defaultValue,
  value,
  onValueChange,
  error,
}: CategorySelectProps) {
  const t = useTranslations("categories");
  const rootCategories = categories.filter((c) => c.parentId === null);

  const items = useMemo(
    () =>
      rootCategories.flatMap((category) => [
        { value: category.id, label: category.name },
        ...category.children.map((child) => ({
          value: child.id,
          label: child.name,
        })),
      ]),
    [rootCategories],
  );

  if (categories.length === 0) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="text-muted-foreground rounded-none border border-dashed px-3 py-2 text-xs">
          {t("select.empty")}{" "}
          <Link
            href="/categories"
            className="text-foreground underline underline-offset-2"
          >
            {t("newCategory")}
          </Link>
        </div>
        <FieldError errors={error} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Select
        name={name}
        defaultValue={defaultValue}
        value={value}
        onValueChange={onValueChange}
        items={items}
      >
        <SelectTrigger
          className="w-full"
          aria-invalid={error ? true : undefined}
        >
          <SelectValue placeholder={t("select.placeholder")} />
        </SelectTrigger>
        <SelectContent>
          {rootCategories.map((category) => (
            <Fragment key={category.id}>
              <SelectItem value={category.id}>{category.name}</SelectItem>
              {category.children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  <span className="pl-4">{child.name}</span>
                </SelectItem>
              ))}
            </Fragment>
          ))}
        </SelectContent>
      </Select>
      <FieldError errors={error} />
    </div>
  );
}
