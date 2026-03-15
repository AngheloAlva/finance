"use client";

import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

const THEME_CYCLE = {
  light: "dark",
  dark: "system",
  system: "light",
} as const;

type ThemeCycle = (typeof THEME_CYCLE)[keyof typeof THEME_CYCLE];

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
} as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const currentTheme = (theme ?? "system") as keyof typeof THEME_CYCLE;
  const Icon = THEME_ICONS[currentTheme] ?? MonitorIcon;

  function handleCycle() {
    const next: ThemeCycle = THEME_CYCLE[currentTheme] ?? "light";
    setTheme(next);
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={handleCycle}>
      <Icon />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
