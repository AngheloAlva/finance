"use client";

import { useCallback } from "react";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Eye, EyeOff, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import type {
  DashboardConfig,
  WidgetConfig,
  WidgetKey,
  WidgetSize,
} from "@/features/dashboard/lib/dashboard.schema";
import { WIDGET_REGISTRY } from "@/features/dashboard/components/widget-registry";

interface SortableWidgetListProps {
  config: DashboardConfig;
  onChange: (next: DashboardConfig) => void;
}

interface SortableRowProps {
  widget: WidgetConfig;
  onToggleVisible: (key: WidgetKey) => void;
  onChangeSize: (key: WidgetKey, size: WidgetSize) => void;
}

function SortableRow({
  widget,
  onToggleVisible,
  onChangeSize,
}: SortableRowProps) {
  const t = useTranslations();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.key });

  const meta = WIDGET_REGISTRY[widget.key];
  const name = t(`dashboard.widgets.${widget.key}.name`);
  const description = t(`dashboard.widgets.${widget.key}.description`);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card flex items-center gap-3 border p-3"
    >
      <button
        type="button"
        aria-label={t("dashboard.customizer.dragHandle")}
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              widget.visible ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {name}
          </span>
          {!widget.visible ? (
            <EyeOff className="text-muted-foreground h-3 w-3" />
          ) : null}
        </div>
        <span className="text-muted-foreground truncate text-xs">
          {description}
        </span>
      </div>

      {meta.supportsHalf ? (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={widget.size === "half" ? "default" : "outline"}
            onClick={() => onChangeSize(widget.key, "half")}
            disabled={!widget.visible}
            className="h-7 px-2 text-xs"
          >
            {t("dashboard.customizer.sizeHalf")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={widget.size === "full" ? "default" : "outline"}
            onClick={() => onChangeSize(widget.key, "full")}
            disabled={!widget.visible}
            className="h-7 px-2 text-xs"
          >
            {t("dashboard.customizer.sizeFull")}
          </Button>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Eye className="text-muted-foreground h-3.5 w-3.5" />
        <Switch
          checked={widget.visible}
          onCheckedChange={() => onToggleVisible(widget.key)}
          aria-label={t("dashboard.customizer.toggleVisibility")}
        />
      </div>
    </div>
  );
}

export function SortableWidgetList({
  config,
  onChange,
}: SortableWidgetListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sorted = [...config.widgets].sort((a, b) => a.position - b.position);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sorted.findIndex((w) => w.key === active.id);
      const newIndex = sorted.findIndex((w) => w.key === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      const reordered = arrayMove(sorted, oldIndex, newIndex).map(
        (w, index) => ({
          ...w,
          position: index,
        }),
      );
      onChange({ widgets: reordered });
    },
    [sorted, onChange],
  );

  const handleToggleVisible = useCallback(
    (key: WidgetKey) => {
      onChange({
        widgets: config.widgets.map((w) =>
          w.key === key ? { ...w, visible: !w.visible } : w,
        ),
      });
    },
    [config, onChange],
  );

  const handleChangeSize = useCallback(
    (key: WidgetKey, size: WidgetSize) => {
      onChange({
        widgets: config.widgets.map((w) =>
          w.key === key ? { ...w, size } : w,
        ),
      });
    },
    [config, onChange],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sorted.map((w) => w.key)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {sorted.map((widget) => (
            <SortableRow
              key={widget.key}
              widget={widget}
              onToggleVisible={handleToggleVisible}
              onChangeSize={handleChangeSize}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

