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

  it("sorts output events and ignores unsupported event types", () => {
    const recording = parseAsciicast(
      [
        JSON.stringify([0.3, "o", "third"]),
        JSON.stringify([0.1, "o", "first"]),
        JSON.stringify([0.2, "i", "ignored"]),
      ].join("\n"),
    );

    expect(recording.version).toBe(1);
    expect(recording.duration).toBe(0.3);
    expect(recording.events).toEqual([
      { time: 0.1, type: "o", data: "first" },
      { time: 0.3, type: "o", data: "third" },
    ]);
  });

  it("rejects invalid json lines", () => {
    expect(() => parseAsciicast("not-json")).toThrow(
      "文件包含无法解析的 JSON 行",
    );
  });

  it("strips common ansi escapes for the MVP renderer", () => {
    expect(stripAnsi("\u001b[31mred\u001b[0m")).toBe("red");
  });
});
