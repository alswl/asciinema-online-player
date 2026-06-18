export type CastEvent = {
  time: number;
  type: string;
  data: string;
};

export type Recording = {
  version: 1 | 2;
  width: number;
  height: number;
  duration: number;
  events: CastEvent[];
  title?: string;
};

type Header = {
  version?: number;
  width?: number;
  height?: number;
  duration?: number;
  title?: string;
};

export function parseAsciicast(source: string): Recording {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("文件为空");
  }

  const firstLine = parseJson(lines[0]);

  if (isHeader(firstLine)) {
    return parseV2(firstLine, lines.slice(1));
  }

  return parseLineEvents(lines, {
    version: 1,
    width: 80,
    height: 24,
  });
}

export function stripAnsi(input: string): string {
  return input.replace(
    // Covers common CSI, OSC, and one-byte escape sequences for the MVP text renderer.
    /\u001b(?:\][^\u0007]*(?:\u0007|\u001b\\)|\[[0-?]*[ -/]*[@-~]|[@-Z\\-_])/g,
    "",
  );
}

function parseV2(header: Header, eventLines: string[]): Recording {
  return parseLineEvents(eventLines, {
    version: 2,
    width: header.width ?? 80,
    height: header.height ?? 24,
    title: header.title,
    duration: header.duration,
  });
}

function parseLineEvents(
  lines: string[],
  meta: {
    version: 1 | 2;
    width: number;
    height: number;
    title?: string;
    duration?: number;
  },
): Recording {
  const events: CastEvent[] = [];
  const warnings: string[] = [];

  for (const line of lines) {
    const parsed = parseJson(line, warnings);

    if (!Array.isArray(parsed) || parsed.length < 3) {
      continue;
    }

    const [time, type, data] = parsed;

    if (typeof time !== "number" || typeof type !== "string") {
      continue;
    }

    if (type === "o" && typeof data === "string") {
      events.push({ time, type, data });
    }
  }

  events.sort((left, right) => left.time - right.time);

  const lastEvent = events.at(-1);

  return {
    version: meta.version,
    width: meta.width,
    height: meta.height,
    duration: meta.duration ?? lastEvent?.time ?? 0,
    events,
    title: meta.title,
  };
}

function parseJson(line: string, warnings?: string[]): unknown {
  try {
    return JSON.parse(line);
  } catch {
    warnings?.push(line);
    throw new Error("文件包含无法解析的 JSON 行");
  }
}

function isHeader(value: unknown): value is Header {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "version" in value
  );
}
