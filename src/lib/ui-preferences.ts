// ── Types ──

export type Locale = "zh-CN" | "en";
export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export type MessageKey = keyof typeof dictionaries.en;

// ── Bilingual dictionaries ──

const dictionaries = {
  en: {
    pageTitle: "asciinema online player",
    pageSubtitle: "static asciinema player",
    heroBadge: "🎬 Local-first Terminal Recorder",
    heroHeading: "Watch your terminal recordings",
    heroDescription:
      "Open any .cast file and relive your CLI sessions — smooth, private, and offline-ready.",
    privacyMessage:
      "Your files are processed entirely on this device and are never uploaded.",
    openLocalFile: "Open a .cast file",
    replaceRecording: "Replace",
    loading: "Opening",
    readyHeading: "Now Playing",
    idleHint: "Drop a .cast file or click above to get started",
    errorTitle: "Could not open the recording",
    errorReplaceTitle: "Could not replace recording",
    errorGeneric:
      "Could not open the recording. The file may be corrupted or in an unsupported format.",
    errorNotCast:
      "This file does not appear to be a valid asciicast recording.",
    errorEmpty: "The selected file is empty.",
    replacementFailed: "The current recording is still playing.",
    sourceCode: "Source",
    help: "Docs",
    reportIssue: "Issues",
    externalLink: "(external link)",
    languageLabel: "Language",
    themeLabel: "Theme",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    featuresTitle: "Why use this?",
    feature1Title: "100% Private",
    feature1Desc:
      "Files never leave your device. No uploads, no servers, no tracking — everything happens right in your browser.",
    feature2Title: "Works Offline",
    feature2Desc:
      "Once the page loads, you can open and play recordings without an internet connection. Perfect for air-gapped environments.",
    feature3Title: "Instant Playback",
    feature3Desc:
      "Open a .cast file and it plays immediately. Pause, rewind, copy text — the full terminal replay at your fingertips.",
    howtoTitle: "How to get started",
    howtoStep1: "Record your terminal with asciinema",
    howtoStep2: "Download the .cast file",
    howtoStep3: "Open it here and watch",
    howtoInstall: "Install asciinema",
    howtoRecord: "Record a session",
    howtoRecordCmd: "asciinema rec demo.cast",
    howtoPlayCmd: "Then open demo.cast here",
    poweredBy: "Powered by",
    learnMore: "Learn more about asciinema",
  },
  "zh-CN": {
    pageTitle: "asciinema online player",
    pageSubtitle: "static asciinema player",
    heroBadge: "🎬 本地优先的终端录制器",
    heroHeading: "回放你的终端操作",
    heroDescription:
      "打开 .cast 文件，重温每一次 CLI 之旅 —— 流畅、私密、离线可用。",
    privacyMessage: "录制文件只在此设备中处理，不会上传。",
    openLocalFile: "打开 .cast 文件",
    replaceRecording: "更换",
    loading: "正在打开",
    readyHeading: "正在播放",
    idleHint: "拖入 .cast 文件或点击上方按钮开始播放",
    errorTitle: "无法打开这个录制",
    errorReplaceTitle: "无法更换录制",
    errorGeneric: "无法打开录制，文件可能已损坏或格式不受支持。",
    errorNotCast: "此文件似乎不是有效的 asciicast 录制。",
    errorEmpty: "所选文件为空。",
    replacementFailed: "当前录制仍在播放中。",
    sourceCode: "源码",
    help: "文档",
    reportIssue: "反馈",
    externalLink: "（外部链接）",
    languageLabel: "语言",
    themeLabel: "主题",
    themeSystem: "跟随系统",
    themeLight: "浅色",
    themeDark: "深色",
    featuresTitle: "为什么选择我们？",
    feature1Title: "100% 隐私",
    feature1Desc:
      "文件不会离开你的设备。无上传、无服务器、无追踪——一切都在你的浏览器中完成。",
    feature2Title: "离线可用",
    feature2Desc:
      "页面加载后，无需网络即可打开和播放录制文件，适用于完全离线的环境。",
    feature3Title: "即开即播",
    feature3Desc:
      "打开 .cast 文件即可播放。暂停、回放、复制文本——完整的终端回放在你指尖。",
    howtoTitle: "如何开始",
    howtoStep1: "用 asciinema 录制终端",
    howtoStep2: "下载 .cast 文件",
    howtoStep3: "在这里打开并观看",
    howtoInstall: "安装 asciinema",
    howtoRecord: "录制一个会话",
    howtoRecordCmd: "asciinema rec demo.cast",
    howtoPlayCmd: "然后在这里打开 demo.cast",
    poweredBy: "基于",
    learnMore: "了解更多关于 asciinema",
  },
} as const;

// ── Storage keys ──

const STORAGE_KEY_LOCALE = "locale";
const STORAGE_KEY_THEME = "themeMode";

// ── Safe storage helpers ──

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — silently ignore
  }
}

// ── Locale ──

/** Resolve locale: saved value → browser preference → en fallback. */
export function getLocale(): Locale {
  const saved = safeGetItem(STORAGE_KEY_LOCALE);
  if (saved === "zh-CN" || saved === "en") {
    return saved;
  }
  // Unknown saved value or no storage → fall back to browser
  return resolveBrowserLocale();
}

export function setLocale(locale: Locale): void {
  safeSetItem(STORAGE_KEY_LOCALE, locale);
}

function resolveBrowserLocale(): Locale {
  try {
    const lang = navigator.language;
    if (lang.startsWith("zh")) return "zh-CN";
  } catch {
    // navigator.language unavailable
  }
  return "en";
}

// ── Theme ──

/** Resolve theme mode: saved value → system default. */
export function getThemeMode(): ThemeMode {
  const saved = safeGetItem(STORAGE_KEY_THEME);
  if (saved === "system" || saved === "light" || saved === "dark") {
    return saved;
  }
  return "system";
}

export function setThemeMode(mode: ThemeMode): void {
  safeSetItem(STORAGE_KEY_THEME, mode);
}

/** Resolve a theme mode to the actual light/dark value. */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    return getSystemTheme();
  }
  return mode;
}

function getSystemTheme(): ResolvedTheme {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

/** Subscribe to system theme changes. Returns an unsubscribe function. */
export function subscribeToSystemTheme(
  callback: (theme: ResolvedTheme) => void,
): () => void {
  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  } catch {
    return () => {};
  }
}

// ── Translation ──

/** Get the translation for a message key in the current locale. */
export function t(key: MessageKey, locale?: Locale): string {
  const loc = locale ?? getLocale();
  return dictionaries[loc][key];
}

// ── Clear ──

export function clearPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_LOCALE);
    localStorage.removeItem(STORAGE_KEY_THEME);
  } catch {
    // Storage not available
  }
}
