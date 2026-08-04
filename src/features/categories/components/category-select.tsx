"use client";

import { useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { FieldError } from "@/shared/components/field-error";
import { ICON_MAP } from "@/shared/lib/icons";

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryForm } from "@/features/categories/components/category-form";
import type { Category } from "@/generated/prisma/client";
import { FORM_MODE } from "@/shared/types/common.types";
import type { CategoryWithChildren } from "@/features/categories/types/categories.types";

interface CategorySelectProps {
  categories: CategoryWithChildren[];
  name: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string | null) => void;
  error?: string;
  /** When provided, only categories of this transaction type are offered. */
  transactionType?: string;
  /** Show a "+ New category" affordance that creates and auto-selects. */
  allowInlineCreate?: boolean;
}

interface CategoryGroup {
  value: string;
  label: string;
  hasChildren: boolean;
  items: string[];
}

function CategoryOption({ category }: { category: Category | undefined }) {
  if (!category) return null;
  const Icon = ICON_MAP[category.icon];
  return (
    <span className="flex min-w-0 items-center gap-2">
      {Icon && (
        <Icon className="size-4 shrink-0" style={{ color: category.color }} />
      )}
      <span className="truncate">{category.name}</span>
    </span>
  );
}

export function CategorySelect({
  categories,
  name,
  defaultValue,
  value,
  onValueChange,
  error,
  transactionType,
  allowInlineCreate = false,
}: CategorySelectProps) {
  const t = useTranslations("categories");
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const [internalValue, setInternalValue] = useState<string | null>(
    defaultValue ?? null,
  );
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const selected = value !== undefined ? value || null : internalValue;

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categories) {
      map.set(category.id, category);
      for (const child of category.children) {
        map.set(child.id, child);
      }
    }
    return map;
  }, [categories]);

  const groups = useMemo<CategoryGroup[]>(
    () =>
      categories
        .filter(
          (c) =>
            c.parentId === null &&
            (!transactionType || c.transactionType === transactionType),
        )
        .map((root) => ({
          value: root.id,
          label: root.name,
          hasChildren: root.children.length > 0,
          items: [root.id, ...root.children.map((child) => child.id)],
        })),
    [categories, transactionType],
  );

  function handleValueChange(next: string | null) {
    setInternalValue(next);
    onValueChange?.(next);
  }

  function handleCreated(createdId?: string) {
    setCreateOpen(false);
    if (createdId) {
      setInternalValue(createdId);
      onValueChange?.(createdId);
    }
    // The freshly created category is not in the `categories` prop yet —
    // refresh so the server component re-fetches and the picker can render it.
    router.refresh();
  }

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
      <input type="hidden" name={name} value={selected ?? ""} />

      <Combobox
        items={groups}
        value={selected}
        onValueChange={handleValueChange}
        open={open}
        onOpenChange={setOpen}
        itemToStringLabel={(id: string) => categoryById.get(id)?.name ?? ""}
      >
        <ComboboxTrigger
          ref={triggerRef}
          aria-invalid={error ? true : undefined}
          className="border-input flex h-8 w-full items-center justify-between gap-1.5 rounded-none border bg-transparent py-2 pr-2 pl-2.5 text-xs whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
        >
          <ComboboxValue>
            {(selectedId: string | null) => {
              const category = selectedId
                ? categoryById.get(selectedId)
                : undefined;
              return category ? (
                <CategoryOption category={category} />
              ) : (
                <span className="text-muted-foreground">
                  {t("select.placeholder")}
                </span>
              );
            }}
          </ComboboxValue>
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput
            showTrigger={false}
            placeholder={t("select.searchPlaceholder")}
          />
          <ComboboxEmpty>{t("select.noResults")}</ComboboxEmpty>
          <ComboboxList>
            {(group: CategoryGroup) => (
              <ComboboxGroup key={group.value} items={group.items}>
                {group.hasChildren && (
                  <ComboboxLabel>{group.label}</ComboboxLabel>
                )}
                <ComboboxCollection>
                  {(id: string) => {
                    const category = categoryById.get(id);
                    return (
                      <ComboboxItem
                        key={id}
                        value={id}
                        className={category?.parentId ? "pl-6" : undefined}
                      >
                        <CategoryOption category={category} />
                      </ComboboxItem>
                    );
                  }}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
          {allowInlineCreate && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCreateOpen(true);
              }}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 border-t px-2 py-2 text-xs transition-colors"
            >
              <Plus className="size-3.5" />
              {t("select.createNew")}
            </button>
          )}
        </ComboboxContent>
      </Combobox>

      {allowInlineCreate && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent finalFocus={triggerRef}>
            <DialogHeader>
              <DialogTitle>{t("dialog.newTitle")}</DialogTitle>
              <DialogDescription>
                {t("dialog.newDescription")}
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              mode={FORM_MODE.CREATE}
              categories={categories}
              onSuccess={handleCreated}
            />
          </DialogContent>
        </Dialog>
      )}

      <FieldError errors={error} />
    </div>
  );
}
