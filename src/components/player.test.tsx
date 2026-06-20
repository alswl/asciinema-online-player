import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Player } from "./player";

// jsdom does not implement File.text(), so stub it via FileReader
beforeEach(() => {
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

// Mock the dynamic import of asciinema-player
vi.mock("asciinema-player", () => ({
  create: vi.fn((src: unknown) => {
    const data = (src as { data?: string }).data ?? "";
    if (data.includes("INVALID_SENTINEL")) {
      throw new Error("Parse error from player");
    }
    return {
      el: document.createElement("div"),
      dispose: vi.fn(),
      getCurrentTime: vi.fn(() => 0),
      getDuration: vi.fn(() => undefined),
      play: vi.fn(),
      pause: vi.fn(),
      seek: vi.fn(),
      addEventListener: vi.fn(),
    };
  }),
}));

function createMockFile(name: string, content: string): File {
  return new File([content], name, { type: "text/plain" });
}

describe("Player", () => {
  it("renders idle state with file picker", () => {
    render(<Player />);
    expect(
      screen.getByRole("button", { name: "Open local file" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pick a local/)).toBeInTheDocument();
  });

  it("shows error banner when player rejects the file", async () => {
    render(<Player />);

    const fileInput = document.querySelector('input[type="file"]')!;
    // Content passes lookLikeAsciicast but triggers the mock's sentinel throw
    const badFile = createMockFile(
      "bad.cast",
      '{"version": 2, "width": 80, "height": 24}\n[1, "o", "INVALID_SENTINEL"]',
    );
    fireEvent.change(fileInput, { target: { files: [badFile] } });

    await waitFor(() => {
      expect(screen.getByText("Parse error from player")).toBeInTheDocument();
    });

    // FilePicker remains enabled while error is shown
    expect(
      screen.getByRole("button", { name: "Open local file" }),
    ).not.toBeDisabled();
  });

  it("clears error when a valid file is picked after an error", async () => {
    render(<Player />);

    const fileInput = document.querySelector('input[type="file"]')!;

    // First, trigger an error
    const badFile = createMockFile(
      "bad.cast",
      '{"version": 2, "width": 80, "height": 24}\n[1, "o", "INVALID_SENTINEL"]',
    );
    fireEvent.change(fileInput, { target: { files: [badFile] } });

    await waitFor(() => {
      expect(screen.getByText("Parse error from player")).toBeInTheDocument();
    });

    // Then pick a valid file
    const goodFile = createMockFile(
      "good.cast",
      '{"version":2,"width":80,"height":24}\n',
    );
    fireEvent.change(fileInput, { target: { files: [goodFile] } });

    await waitFor(() => {
      expect(
        screen.queryByText("Parse error from player"),
      ).not.toBeInTheDocument();
    });
  });
});
