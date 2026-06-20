"use client";

import { useCallback, useEffect, useState } from "react";
import type { Locale, ResolvedTheme, ThemeMode } from "./ui-preferences";
import {
  getLocale,
  getThemeMode,
  resolveTheme,
  setLocale as saveLocale,
  setThemeMode as saveThemeMode,
  subscribeToSystemTheme,
  t,
} from "./ui-preferences";

/**
 * Read preferences directly from localStorage.
 * During SSR these fall back to safe defaults (localStorage unavailable).
 */
export function usePreferences() {
  const [locale, setLocaleState] = useState<Locale>(getLocale);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getThemeMode);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getThemeMode()),
  );

  // ── Keep data-theme in sync ──
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  // ── Keep document lang / title in sync ──
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t("pageTitle", locale);
  }, [locale]);

  // ── System theme subscription ──
  useEffect(() => {
    if (themeMode !== "system") return;
    return subscribeToSystemTheme(setResolvedTheme);
  }, [themeMode]);

  // ── Handlers ──

  const handleLocaleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const next = e.target.value as Locale;
      saveLocale(next);
      setLocaleState(next);
    },
    [],
  );

  const handleThemeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const next = e.target.value as ThemeMode;
      saveThemeMode(next);
      setThemeModeState(next);
      setResolvedTheme(resolveTheme(next));
    },
    [],
  );

  const tl = useCallback(
    (key: Parameters<typeof t>[0]) => t(key, locale),
    [locale],
  );

  return {
    locale,
    themeMode,
    resolvedTheme,
    handleLocaleChange,
    handleThemeChange,
    t: tl,
  } as const;
}
