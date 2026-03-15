"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { ICON_MAP } from "@/shared/lib/icons";

interface CategoryIconPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  name: string;
}

export function CategoryIconPicker({
  value,
  onChange,
  name,
}: CategoryIconPickerProps) {
  const [selected, setSelected] = useState(value ?? "");

  function handleSelect(iconKey: string) {
    setSelected(iconKey);
    onChange?.(iconKey);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input type="hidden" name={name} value={selected} />
      <div className="grid grid-cols-8 gap-1">
        {Object.entries(ICON_MAP).map(([key, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => handleSelect(key)}
            className={cn(
              "flex size-8 items-center justify-center rounded-none border transition-colors hover:bg-muted",
              selected === key
                ? "border-primary bg-primary/10 text-primary"
                : "border-transparent text-muted-foreground",
            )}
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

export { ICON_MAP as ICONS };
