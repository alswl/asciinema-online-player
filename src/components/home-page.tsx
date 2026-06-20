"use client";

import type { MessageKey } from "../lib/ui-preferences";
import { usePreferences } from "../lib/use-preferences";
import {
  ArrowRight,
  ExternalLink,
  Film,
  FolderOpen,
  Globe,
  MonitorPlay,
  Shield,
  Terminal,
  Zap,
} from "lucide-react";
import Link from "next/link";

export function HomePage() {
  const { locale, handleLocaleChange, handleThemeChange, themeMode, t } =
    usePreferences();

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      {/* ── Nav ── */}
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* ── Hero ── */}
        <section className="animate-fade-in py-16 text-center sm:py-24">
          <span className="inline-block rounded-full bg-[var(--surface-2)] px-4 py-1.5 text-xs font-medium text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)]">
            {t("heroBadge")}
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            {t("heroHeading")}
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[var(--text-secondary)]">
            {t("heroDescription")}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent-500)] to-[var(--accent-400)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-glow)] hover:brightness-110 active:scale-[0.97]"
              href="/play"
            >
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
              {t("openLocalFile")}
            </Link>
          </div>

          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-1)] px-3 py-1.5 text-xs text-[var(--text-muted)] ring-1 ring-[var(--border-subtle)]">
            <Shield className="h-4 w-4" aria-hidden="true" />
            {t("privacyMessage")}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-16 sm:py-20">
          <h2 className="text-center text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {t("featuresTitle")}
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Shield,
                titleKey: "feature1Title" as const,
                descKey: "feature1Desc" as const,
              },
              {
                icon: Globe,
                titleKey: "feature2Title" as const,
                descKey: "feature2Desc" as const,
              },
              {
                icon: Zap,
                titleKey: "feature3Title" as const,
                descKey: "feature3Desc" as const,
              },
            ].map(({ icon: Icon, titleKey, descKey }) => (
              <div
                key={titleKey}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-500)]/15 to-cyan-400/15 text-[var(--accent-600)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
                  {t(titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {t(descKey)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How-to ── */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-8 shadow-[var(--shadow-md)] sm:p-10">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {t("howtoTitle")}
            </h2>

            <div className="mt-8 space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-500)] to-cyan-400 text-xs font-bold text-white">
                  1
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {t("howtoStep1")}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {t("howtoInstall")}:{" "}
                    <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-xs">
                      brew install asciinema
                    </code>{" "}
                    {locale === "zh-CN" ? "或访问" : "or visit"}{" "}
                    <a
                      className="inline-flex items-center gap-1 text-[var(--accent-600)] underline hover:text-[var(--accent-700)]"
                      href="https://asciinema.org/docs/installation"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      asciinema.org
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-500)] to-cyan-400 text-xs font-bold text-white">
                  2
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {t("howtoStep2")}
                  </p>
                  <p className="mt-1 font-mono text-sm text-[var(--text-secondary)]">
                    <Terminal
                      className="mr-1 inline h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    {t("howtoRecordCmd")}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-500)] to-cyan-400 text-xs font-bold text-white">
                  3
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {t("howtoStep3")}
                  </p>
                  <Link
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent-600)] hover:text-[var(--accent-700)]"
                    href="/play"
                  >
                    <MonitorPlay className="h-4 w-4" aria-hidden="true" />
                    {t("openLocalFile")}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── asciinema credit ── */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            {t("poweredBy")}{" "}
            <a
              className="inline-flex items-center gap-1 font-medium text-[var(--accent-600)] hover:underline"
              href="https://asciinema.org"
              rel="noopener noreferrer"
              target="_blank"
            >
              asciinema
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
            {" · "}
            <a
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              href="https://asciinema.org"
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("learnMore")}
            </a>
          </p>
        </div>

        {/* Footer */}
        <Footer t={t} />
      </div>
    </div>
  );
}

function Footer({ t: tr }: { t: (key: MessageKey) => string }) {
  return (
    <footer className="mt-12 border-t border-[var(--border-subtle)] py-6">
      <nav
        aria-label="Project links"
        className="flex flex-wrap items-center justify-center gap-5 text-xs"
      >
        {[
          {
            key: "sourceCode" as const,
            href: "https://github.com/alswl/asciinema-online-player",
          },
          {
            key: "help" as const,
            href: "https://github.com/alswl/asciinema-online-player#readme",
          },
          {
            key: "reportIssue" as const,
            href: "https://github.com/alswl/asciinema-online-player/issues",
          },
        ].map((link) => (
          <a
            key={link.key}
            className="inline-flex items-center gap-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            href={link.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {tr(link.key)}
          </a>
        ))}
      </nav>
      <p className="mt-3 text-center text-xs text-[var(--text-muted)]/70">
        {tr("privacyMessage")}
      </p>
    </footer>
  );
}
