"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#64748b",
] as const;

interface CategoryColorPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  name: string;
}

export function CategoryColorPicker({
  value,
  onChange,
  name,
}: CategoryColorPickerProps) {
  const [selected, setSelected] = useState(value ?? "");

  function handleSelect(color: string) {
    setSelected(color);
    onChange?.(color);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input type="hidden" name={name} value={selected} />
      <div className="grid grid-cols-8 gap-1">
        {COLOR_PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handleSelect(color)}
            className={cn(
              "size-8 rounded-none border-2 transition-all",
              selected === color
                ? "border-foreground ring-1 ring-foreground/20"
                : "border-transparent",
            )}
            style={{ backgroundColor: color }}
          >
            <span className="sr-only">{color}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
