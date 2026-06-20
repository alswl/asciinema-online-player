"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "../lib/ui-preferences";
import { t as tr } from "../lib/ui-preferences";
import { usePreferences } from "../lib/use-preferences";
import {
  AlertTriangle,
  ExternalLink,
  FileText,
  Film,
  Loader2,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { FilePicker } from "./file-picker";

// ── Types ──

type PlayerHandle = Awaited<
  ReturnType<(typeof import("asciinema-player"))["create"]>
>;

interface ActiveRecording {
  file: File;
  player: PlayerHandle;
}

interface PendingSelection {
  file: File;
  mode: "initial" | "replacement";
}

type ExperienceState =
  | { status: "idle" }
  | { status: "loading"; pending: PendingSelection }
  | { status: "ready"; active: ActiveRecording }
  | { status: "replacing"; active: ActiveRecording; pending: PendingSelection }
  | {
      status: "ready-with-error";
      active: ActiveRecording;
      error: string;
    }
  | { status: "error"; error: string; failedFileName?: string };

// ── Helpers ──

function looksLikeAsciicast(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const firstLine = trimmed.split("\n")[0].trim();

  try {
    const parsed = JSON.parse(firstLine);
    if (parsed && typeof parsed === "object" && "version" in parsed) {
      return true;
    }
  } catch {
    // not JSON, continue
  }

  if (/^\[\d+\.?\d*,\s*"[oir]"/.test(firstLine)) {
    return true;
  }

  return false;
}

function classifyError(_locale: Locale, err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (
      msg.includes("does not appear") ||
      msg.includes("not a valid") ||
      msg.includes("not look like")
    ) {
      return tr("errorNotCast");
    }
    if (msg.includes("empty") || msg.includes("no content")) {
      return tr("errorEmpty");
    }
  }
  return tr("errorGeneric");
}

// ── Component ──

export function Player() {
  const [state, setState] = useState<ExperienceState>({ status: "idle" });
  const { locale, themeMode, handleLocaleChange, handleThemeChange, t } =
    usePreferences();

  const containerRef = useRef<HTMLDivElement>(null);
  const stashRef = useRef<HTMLDivElement>(null);
  const playerRegionRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("asciinema-player").catch(() => {});
  }, []);

  // ── Player lifecycle ──

  const disposePlayer = useCallback((player: PlayerHandle | null) => {
    if (player) player.dispose();
  }, []);

  const createPlayer = useCallback(
    async (file: File): Promise<PlayerHandle> => {
      const text = await file.text();

      if (!looksLikeAsciicast(text)) {
        throw new Error(
          "This file does not appear to be a valid asciicast recording.",
        );
      }

      const { create: AsciinemaPlayer } = await import("asciinema-player");

      const target =
        (state.status === "ready" || state.status === "ready-with-error"
          ? stashRef.current
          : containerRef.current) ?? containerRef.current;

      if (!target) throw new Error("Player mount point not found.");

      return AsciinemaPlayer({ data: text }, target, {
        fit: "width",
        autoPlay: true,
      });
    },
    [state.status],
  );

  const commitPlayer = useCallback((player: PlayerHandle) => {
    if (containerRef.current && player.el) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(player.el);
    }
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      const prevState = state;
      const isReplacement =
        prevState.status === "ready" || prevState.status === "ready-with-error";

      if (isReplacement) {
        const active = (prevState as { active: ActiveRecording }).active;
        setState({
          status: "replacing",
          active,
          pending: { file, mode: "replacement" },
        });
      } else {
        if (containerRef.current) containerRef.current.innerHTML = "";
        setState({ status: "loading", pending: { file, mode: "initial" } });
      }

      try {
        const player = await createPlayer(file);

        if (isReplacement) {
          const active = (prevState as { active: ActiveRecording }).active;
          commitPlayer(player);
          disposePlayer(active.player);
        }

        setState({ status: "ready", active: { file, player } });

        requestAnimationFrame(() => {
          playerRegionRef.current?.focus();
        });
      } catch (err) {
        const errorMessage = classifyError(locale, err);

        if (isReplacement) {
          const active = (prevState as { active: ActiveRecording }).active;
          setState({
            status: "ready-with-error",
            active,
            error: errorMessage,
          });
        } else {
          setState({
            status: "error",
            error: errorMessage,
            failedFileName: file.name,
          });
        }

        requestAnimationFrame(() => {
          errorRef.current?.focus();
        });
      }
    },
    [state, locale, createPlayer, commitPlayer, disposePlayer],
  );

  useEffect(() => {
    return () => {
      if (
        state.status === "ready" ||
        state.status === "replacing" ||
        state.status === "ready-with-error"
      ) {
        disposePlayer(state.active.player);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derivations ──

  const hasActive =
    state.status === "ready" ||
    state.status === "replacing" ||
    state.status === "ready-with-error";

  const activeFileName = hasActive ? state.active.file.name : undefined;

  // ── Render ──

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      {/* ── Top bar ── */}
      <nav className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--surface-glass)] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 sm:px-6">
          <Link
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            href="/"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-500)] to-cyan-400">
              <Film className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              {t("pageSubtitle")}
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs">
            <label className="flex items-center gap-1.5">
              <span className="hidden text-[var(--text-muted)] sm:inline">
                {t("languageLabel")}
              </span>
              <select
                className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                value={locale}
                onChange={handleLocaleChange}
              >
                <option value="en">EN</option>
                <option value="zh-CN">中文</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5">
              <span className="hidden text-[var(--text-muted)] sm:inline">
                {t("themeLabel")}
              </span>
              <select
                className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                value={themeMode}
                onChange={handleThemeChange}
              >
                <option value="system">{t("themeSystem")}</option>
                <option value="light">{t("themeLight")}</option>
                <option value="dark">{t("themeDark")}</option>
              </select>
            </label>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        {/* ── Idle: compact prompt ── */}
        {state.status === "idle" && (
          <div className="animate-fade-in mx-auto max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-8 text-center shadow-[var(--shadow-md)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-500)] to-cyan-400">
              <Film className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
              {t("heroHeading")}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {t("heroDescription")}
            </p>
            <div className="mt-6">
              <FilePicker
                label={t("openLocalFile")}
                onFileSelected={loadFile}
              />
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              {t("privacyMessage")}
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {state.status === "loading" && (
          <div
            className="animate-fade-in mx-auto max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-8 text-center shadow-[var(--shadow-md)]"
            role="status"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-500)] to-cyan-400">
              <Loader2
                className="h-5 w-5 animate-spin text-white"
                aria-hidden="true"
              />
            </div>
            <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">
              {t("loading")}{" "}
              <span className="break-all font-mono text-[var(--accent-600)]">
                {state.pending.file.name}
              </span>
              …
            </p>
          </div>
        )}

        {/* ── Error (no active) ── */}
        {state.status === "error" && (
          <div
            ref={errorRef}
            className="animate-fade-in mx-auto max-w-md rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] p-6 text-center shadow-[var(--shadow-md)] outline-none"
            role="alert"
            tabIndex={-1}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--danger-text)]/10 text-[var(--danger-text)]">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-3 font-semibold text-[var(--danger-text)]">
              {t("errorTitle")}
            </p>
            <p className="mt-1.5 text-sm text-[var(--danger-text)]/80">
              {state.error}
            </p>
            <div className="mt-5">
              <FilePicker
                label={t("openLocalFile")}
                onFileSelected={loadFile}
              />
            </div>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              {t("privacyMessage")}
            </p>
          </div>
        )}

        {/* ── Player container (always mounted for ref stability) ── */}
        <div
          ref={containerRef}
          className={
            hasActive
              ? "animate-fade-in overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-[var(--shadow-lg)]"
              : "hidden"
          }
        />

        {/* Stash (hidden, always mounted) */}
        <div ref={stashRef} aria-hidden="true" className="hidden" />

        {/* ── Ready / Replacing / ReadyWithError ── */}
        {hasActive && (
          <div className="animate-fade-in">
            {/* Top bar: filename + replace */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-500)]/10 text-[var(--accent-600)]">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                    {t("readyHeading")}
                  </p>
                  <h2
                    className="truncate text-sm font-semibold text-[var(--text-primary)]"
                    title={activeFileName}
                  >
                    {activeFileName}
                  </h2>
                </div>
              </div>

              {state.status === "replacing" ? (
                <div className="flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  {t("loading")}…
                </div>
              ) : (
                <FilePicker
                  label={t("replaceRecording")}
                  onFileSelected={loadFile}
                />
              )}
            </div>

            {/* Replacement error toast */}
            {state.status === "ready-with-error" && (
              <div
                ref={errorRef}
                className="animate-fade-in mt-5 flex items-start gap-3 rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] p-4 shadow-[var(--shadow-md)] outline-none"
                role="alert"
                tabIndex={-1}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--danger-text)]/10 text-[var(--danger-text)]">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="text-sm text-[var(--danger-text)]">
                  <p className="font-semibold">{t("errorReplaceTitle")}</p>
                  <p className="mt-0.5">{state.error}</p>
                  <p className="mt-0.5 text-xs opacity-75">
                    {t("replacementFailed")}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="mt-16 border-t border-[var(--border-subtle)] pt-6">
          <nav
            aria-label="Project links"
            className="flex flex-wrap items-center justify-center gap-5 text-xs"
          >
            <a
              className="inline-flex items-center gap-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              href="https://github.com/alswl/asciinema-online-player"
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("sourceCode")}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
            <a
              className="inline-flex items-center gap-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              href="https://github.com/alswl/asciinema-online-player#readme"
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("help")}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
            <a
              className="inline-flex items-center gap-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              href="https://github.com/alswl/asciinema-online-player/issues"
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("reportIssue")}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </nav>
          <p className="mt-3 text-center text-xs text-[var(--text-muted)]/70">
            {t("privacyMessage")}
          </p>
        </footer>
      </div>
    </div>
  );
}
