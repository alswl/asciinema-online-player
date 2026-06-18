import { describe, expect, it } from "vitest";
import { parseAsciicast, stripAnsi } from "../src/lib/asciicast";

describe("parseAsciicast", () => {
  it("parses asciicast v2 output events", () => {
    const recording = parseAsciicast(
      [
        JSON.stringify({ version: 2, width: 100, height: 30, title: "demo" }),
        JSON.stringify([0.1, "o", "hello"]),
        JSON.stringify([0.2, "i", "ignored"]),
        JSON.stringify([0.3, "o", " world"]),
      ].join("\n"),
    );

    expect(recording.version).toBe(2);
    expect(recording.width).toBe(100);
    expect(recording.height).toBe(30);
    expect(recording.title).toBe("demo");
    expect(recording.duration).toBe(0.3);
    expect(recording.events).toHaveLength(2);
  });

  it("strips common ansi escapes for the MVP renderer", () => {
    expect(stripAnsi("\u001b[31mred\u001b[0m")).toBe("red");
  });
});
