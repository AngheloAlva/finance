"use client";

import { useState, useTransition } from "react";

import { LayoutGrid, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { updateDashboardConfigAction } from "@/features/dashboard/actions/update-dashboard-config.action";
import {
  DEFAULT_DASHBOARD_CONFIG,
  type DashboardConfig,
} from "@/features/dashboard/lib/dashboard.schema";
import { SortableWidgetList } from "@/features/dashboard/components/sortable-widget-list";

interface DashboardCustomizerProps {
  initialConfig: DashboardConfig;
}

export function DashboardCustomizer({
  initialConfig,
}: DashboardCustomizerProps) {
  const t = useTranslations("dashboard.customizer");
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<DashboardConfig>(initialConfig);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      // Reset to the latest server-provided config every time we open
      setConfig(initialConfig);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_DASHBOARD_CONFIG);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateDashboardConfigAction(config);
      if (result.success) {
        toast.success(t("saveSuccess"));
        setOpen(false);
      } else {
        toast.error(t("saveError"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        <Button variant="outline" size="sm">
          <LayoutGrid className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">{t("trigger")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <SortableWidgetList config={config} onChange={setConfig} />
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            {t("reset")}
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="button" onClick={handleSave} disabled={isPending}>
              {isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
