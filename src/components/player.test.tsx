import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock localStorage for jsdom
const lsStore = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: vi.fn((key: string) => lsStore.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => lsStore.set(key, value)),
    removeItem: vi.fn((key: string) => lsStore.delete(key)),
    clear: vi.fn(() => lsStore.clear()),
    get length() {
      return lsStore.size;
    },
    key: vi.fn((_: number) => null),
  },
  writable: true,
});

import { Player } from "./player";

// ── Reusable file factories ──

export function createMockFile(name: string, content: string): File {
  return new File([content], name, { type: "text/plain" });
}

export function mockValidCast(name = "sample.cast"): File {
  return createMockFile(
    name,
    '{"version": 2, "width": 80, "height": 24}\n[0.5, "o", "Hello"]\n',
  );
}

export function mockInvalidCast(name = "bad.cast"): File {
  return createMockFile(
    name,
    '{"version": 2, "width": 80, "height": 24}\n[1, "o", "INVALID_SENTINEL"]',
  );
}

// ── Stable asciinema-player lifecycle mock ──

const mockDispose = vi.fn();

vi.mock("asciinema-player", () => ({
  create: vi.fn((src: unknown, container?: HTMLElement) => {
    const data = (src as { data?: string }).data ?? "";
    if (data.includes("INVALID_SENTINEL")) {
      throw new Error("Parse error from player");
    }
    const el = document.createElement("div");
    el.className = "ap-wrapper";
    if (container) container.appendChild(el);
    return {
      el,
      dispose: mockDispose,
      getCurrentTime: vi.fn(() => 0),
      getDuration: vi.fn(() => undefined),
      play: vi.fn(),
      pause: vi.fn(),
      seek: vi.fn(),
      addEventListener: vi.fn(),
    };
  }),
}));

// ── Helpers ──

function getFileInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

function selectFile(input: HTMLInputElement, file: File) {
  fireEvent.change(input, { target: { files: [file] } });
}

// Button label matchers (post-redesign)
const PICKER_BTN = /Open a \.cast file|打开 \.cast 文件/;
const REPLACE_BTN = /^Replace$|^更换$/;

// ── jsdom File.text() polyfill ──

beforeEach(() => {
  mockDispose.mockClear();
  lsStore.clear();
  if (!("text" in File.prototype)) {
    Object.defineProperty(File.prototype, "text", {
      value: function (this: Blob) {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsText(this);
        });
      },
      writable: true,
      configurable: true,
    });
  }
});

// ── US1: First-use playback ──

describe("US1: First-use playback", () => {
  describe("Idle state", () => {
    it("shows hero heading and file picker", () => {
      render(<Player />);
      expect(
        screen.getByRole("heading", {
          name: /Watch your terminal|回放你的终端/,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: PICKER_BTN }),
      ).toBeInTheDocument();
    });

    it("shows privacy message", () => {
      render(<Player />);
      const matches = screen.getAllByText(
        /never uploaded|this device|不会上传|只在此设备/,
      );
      expect(matches.length).toBeGreaterThan(0);
    });

    it("does not render a player container or error alert", () => {
      render(<Player />);
      expect(document.querySelector(".ap-wrapper")).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Loading state", () => {
    it("shows the selected filename during loading", async () => {
      render(<Player />);
      const input = getFileInput();
      selectFile(input, mockValidCast("my-recording.cast"));

      await waitFor(() => {
        expect(screen.getByText(/my-recording\.cast/)).toBeInTheDocument();
      });
    });

    it("shows a loading status region", async () => {
      render(<Player />);
      const input = getFileInput();
      selectFile(input, mockValidCast());

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });
    });
  });

  describe("Ready state", () => {
    it("shows the player after successful file load", async () => {
      render(<Player />);
      const input = getFileInput();
      selectFile(input, mockValidCast());

      await waitFor(() => {
        expect(document.querySelector(".ap-wrapper")).toBeInTheDocument();
      });
    });

    it("shows the current filename in ready state", async () => {
      render(<Player />);
      const input = getFileInput();
      selectFile(input, mockValidCast("my-show.cast"));

      await waitFor(() => {
        expect(screen.getByText(/my-show\.cast/)).toBeInTheDocument();
      });
    });
  });

  describe("Error with recovery", () => {
    it("shows error with role=alert for an invalid file", async () => {
      render(<Player />);
      const input = getFileInput();
      selectFile(input, mockInvalidCast());

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("clears error when a valid file is subsequently picked", async () => {
      render(<Player />);
      const input = getFileInput();
      selectFile(input, mockInvalidCast());

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      // Get fresh reference — the error state renders a new FilePicker with a new input
      const retryInput = getFileInput();
      selectFile(retryInput, mockValidCast());

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });

    it("has file picker enabled while showing error", async () => {
      render(<Player />);
      const input = getFileInput();
      selectFile(input, mockInvalidCast());

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(screen.getByRole("button", { name: PICKER_BTN })).toBeEnabled();
    });
  });
});

// ── US2: Atomic file replacement ──

describe("US2: Atomic file replacement", () => {
  it("shows current filename and replace button in ready state", async () => {
    render(<Player />);
    const input = getFileInput();
    selectFile(input, mockValidCast("my-recording.cast"));

    await waitFor(() => {
      expect(document.querySelector(".ap-wrapper")).toBeInTheDocument();
    });

    expect(screen.getByText(/my-recording\.cast/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: REPLACE_BTN }),
    ).toBeInTheDocument();
  });

  it("successfully replaces recording with new filename", async () => {
    render(<Player />);
    const input = getFileInput();

    selectFile(input, mockValidCast("first.cast"));
    await waitFor(() => {
      expect(document.querySelector(".ap-wrapper")).toBeInTheDocument();
    });

    const replaceInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    selectFile(replaceInput, mockValidCast("second.cast"));

    await waitFor(() => {
      expect(screen.getByText(/second\.cast/)).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: REPLACE_BTN }),
    ).toBeInTheDocument();
  });

  it("disposes old player after successful replacement", async () => {
    render(<Player />);
    const input = getFileInput();

    selectFile(input, mockValidCast("first.cast"));
    await waitFor(() => {
      expect(document.querySelector(".ap-wrapper")).toBeInTheDocument();
    });

    const replaceInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    selectFile(replaceInput, mockValidCast("second.cast"));

    await waitFor(() => {
      expect(screen.getByText(/second\.cast/)).toBeInTheDocument();
    });

    expect(mockDispose).toHaveBeenCalled();
  });

  it("preserves current player on replacement failure", async () => {
    render(<Player />);
    const input = getFileInput();

    selectFile(input, mockValidCast("good.cast"));
    await waitFor(() => {
      expect(document.querySelector(".ap-wrapper")).toBeInTheDocument();
    });

    const replaceInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    selectFile(replaceInput, mockInvalidCast("bad.cast"));

    await waitFor(() => {
      expect(
        screen.getByText(/Could not replace|无法更换/),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/good\.cast/)).toBeInTheDocument();
    expect(document.querySelector(".ap-wrapper")).toBeInTheDocument();
  });

  it("handles long filenames with truncation", async () => {
    const longName =
      "very-long-recording-name-that-goes-on-and-on-中国語-日本語-한국어.cast";
    render(<Player />);
    const input = getFileInput();
    selectFile(input, mockValidCast(longName));

    await waitFor(() => {
      const heading = screen.getByText(
        new RegExp(longName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      );
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveAttribute("title", longName);
    });
  });
});
