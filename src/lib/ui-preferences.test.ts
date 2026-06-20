import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Store and mocks ──

const store = new Map<string, string>();
const mediaQueryListeners = new Map<
  string,
  Set<(e: MediaQueryListEvent) => void>
>();
let darkModeMatches = true;

// Replace localStorage with a fully controlled mock
const ls = {
  getItem: vi.fn((key: string) => store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    store.delete(key);
  }),
  clear: vi.fn(() => {
    store.clear();
  }),
  get length() {
    return store.size;
  },
  key: vi.fn((_: number) => null),
};

Object.defineProperty(globalThis, "localStorage", {
  value: ls,
  writable: true,
});

// Replace matchMedia
window.matchMedia = vi.fn((query: string) => {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  mediaQueryListeners.set(query, listeners);
  return {
    matches: query === "(prefers-color-scheme: dark)" ? darkModeMatches : false,
    media: query,
    addEventListener: vi.fn(
      (_type: string, fn: (e: MediaQueryListEvent) => void) => {
        listeners.add(fn);
      },
    ),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;
});

// ── Imports after mocks are established ──

import {
  clearPreferences,
  getLocale,
  getThemeMode,
  resolveTheme,
  setLocale,
  setThemeMode,
  subscribeToSystemTheme,
  t,
} from "./ui-preferences";
import type { MessageKey } from "./ui-preferences";

function setBrowserLang(lang: string) {
  Object.defineProperty(navigator, "language", {
    value: lang,
    writable: true,
    configurable: true,
  });
}

// ── Tests ──

describe("Locale resolution", () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
    clearPreferences();
    setBrowserLang("en");
  });

  it("returns en when no preference is saved and browser language is en", () => {
    expect(getLocale()).toBe("en");
  });

  it("returns zh-CN when browser language starts with zh", () => {
    setBrowserLang("zh-CN");
    clearPreferences();
    expect(getLocale()).toBe("zh-CN");
  });

  it("returns en when browser language is unsupported", () => {
    setBrowserLang("fr");
    clearPreferences();
    expect(getLocale()).toBe("en");
  });

  it("returns saved locale over browser default", () => {
    store.set("locale", "zh-CN");
    expect(getLocale()).toBe("zh-CN");
  });

  it("ignores corrupted saved locale and falls back to en", () => {
    store.set("locale", "invalid");
    expect(getLocale()).toBe("en");
  });

  it("setLocale persists the value and updates", () => {
    setLocale("zh-CN");
    expect(ls.setItem).toHaveBeenCalledWith("locale", "zh-CN");
    expect(getLocale()).toBe("zh-CN");
  });
});

describe("Theme resolution", () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
    clearPreferences();
    darkModeMatches = true;
  });

  it("defaults to system when no preference is saved", () => {
    expect(getThemeMode()).toBe("system");
  });

  it("returns saved theme mode", () => {
    store.set("themeMode", "dark");
    expect(getThemeMode()).toBe("dark");
  });

  it("ignores corrupted saved themeMode", () => {
    store.set("themeMode", "blue");
    expect(getThemeMode()).toBe("system");
  });

  it("resolveTheme returns dark when system prefers dark", () => {
    darkModeMatches = true;
    expect(resolveTheme("system")).toBe("dark");
  });

  it("resolveTheme returns light when system prefers light", () => {
    darkModeMatches = false;
    expect(resolveTheme("system")).toBe("light");
  });

  it("resolveTheme returns explicit mode regardless of system", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });

  it("setThemeMode persists the value", () => {
    setThemeMode("dark");
    expect(ls.setItem).toHaveBeenCalledWith("themeMode", "dark");
    expect(getThemeMode()).toBe("dark");
  });

  it("subscribeToSystemTheme calls callback on system theme change", () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToSystemTheme(callback);

    const listeners = mediaQueryListeners.get("(prefers-color-scheme: dark)");
    expect(listeners).toBeDefined();
    const listener = [...listeners!][0];
    listener({ matches: true } as MediaQueryListEvent);

    expect(callback).toHaveBeenCalledWith("dark");
    unsubscribe();
  });
});

describe("Translation dictionary", () => {
  beforeEach(() => {
    store.clear();
    clearPreferences();
  });

  it("returns English translations by default", () => {
    expect(t("pageTitle")).toBe("asciinema online player");
  });

  it("returns Chinese translations when locale is zh-CN", () => {
    setLocale("zh-CN");
    // pageTitle is a proper noun — same in both locales
    expect(t("heroHeading")).toBe("回放你的终端操作");
  });

  it("all message keys exist in both languages", () => {
    const enKeys: MessageKey[] = [
      "pageTitle",
      "pageSubtitle",
      "heroBadge",
      "heroHeading",
      "heroDescription",
      "privacyMessage",
      "openLocalFile",
      "replaceRecording",
      "loading",
      "readyHeading",
      "idleHint",
      "errorTitle",
      "errorReplaceTitle",
      "errorGeneric",
      "errorNotCast",
      "errorEmpty",
      "replacementFailed",
      "sourceCode",
      "help",
      "reportIssue",
      "externalLink",
      "languageLabel",
      "themeLabel",
      "themeSystem",
      "themeLight",
      "themeDark",
      "featuresTitle",
      "feature1Title",
      "feature1Desc",
      "feature2Title",
      "feature2Desc",
      "feature3Title",
      "feature3Desc",
      "howtoTitle",
      "howtoStep1",
      "howtoStep2",
      "howtoStep3",
      "howtoInstall",
      "howtoRecord",
      "howtoRecordCmd",
      "howtoPlayCmd",
      "poweredBy",
      "learnMore",
    ];

    setLocale("en");
    for (const key of enKeys) {
      expect(t(key), `Missing en translation for: ${key}`).toBeTruthy();
    }

    setLocale("zh-CN");
    for (const key of enKeys) {
      expect(t(key), `Missing zh-CN translation for: ${key}`).toBeTruthy();
    }
  });
});

describe("Preference persistence failure", () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
    clearPreferences();
  });

  it("getLocale returns en when localStorage throws", () => {
    ls.getItem.mockImplementationOnce(() => {
      throw new Error("QuotaExceeded");
    });
    clearPreferences();
    expect(getLocale()).toBe("en");
  });

  it("getThemeMode returns system when localStorage throws", () => {
    ls.getItem.mockImplementationOnce(() => {
      throw new Error("QuotaExceeded");
    });
    clearPreferences();
    expect(getThemeMode()).toBe("system");
  });

  it("setLocale does not throw when localStorage fails", () => {
    ls.setItem.mockImplementationOnce(() => {
      throw new Error("QuotaExceeded");
    });
    expect(() => setLocale("zh-CN")).not.toThrow();
  });
});

describe("clearPreferences", () => {
  beforeEach(() => {
    store.clear();
    clearPreferences();
  });

  it("removes locale and themeMode from storage", () => {
    setLocale("zh-CN");
    setThemeMode("dark");

    expect(store.get("locale")).toBe("zh-CN");
    expect(store.get("themeMode")).toBe("dark");

    clearPreferences();
    expect(ls.removeItem).toHaveBeenCalledWith("locale");
    expect(ls.removeItem).toHaveBeenCalledWith("themeMode");
  });
});
