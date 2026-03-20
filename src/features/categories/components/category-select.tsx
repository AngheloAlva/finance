"use client";

import { Fragment, useMemo } from "react";
import { useTranslations } from "next-intl";

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
  error?: string;
}

export function CategorySelect({
  categories,
  name,
  defaultValue,
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

  return (
    <div className="flex flex-col gap-1.5">
      <Select name={name} defaultValue={defaultValue} items={items}>
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
