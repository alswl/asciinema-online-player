"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FilePicker } from "./file-picker";

/** Check whether text content resembles a valid asciicast recording. */
function looksLikeAsciicast(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const firstLine = trimmed.split("\n")[0].trim();

  // v1/v2: first line is a JSON object with a "version" field
  try {
    const parsed = JSON.parse(firstLine);
    if (parsed && typeof parsed === "object" && "version" in parsed) {
      return true;
    }
  } catch {
    // not JSON, continue checking
  }

  // v1 raw: first line is an event array like [time, "o", "..."]
  if (/^\[\d+\.?\d*,\s*"[oir]"/.test(firstLine)) {
    return true;
  }

  return false;
}

type LoadState =
  | { status: "idle" }
  | { status: "loading"; file: File }
  | { status: "ready"; file: File }
  | { status: "error"; file?: File; message: string };

export function Player() {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Awaited<
    ReturnType<(typeof import("asciinema-player"))["create"]>
  > | null>(null);

  const disposePlayer = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
  }, []);

  // Eagerly preload the asciinema-player module on mount so it is cached
  // alongside other static assets, enabling offline playback.
  useEffect(() => {
    import("asciinema-player").catch(() => {
      // Silently ignore preload failures — the module will be loaded again
      // when a file is picked.
    });
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      disposePlayer();
      setState({ status: "loading", file });

      try {
        const text = await file.text();

        // Pre-validate: reject files that don't look like asciicast recordings
        if (!looksLikeAsciicast(text)) {
          throw new Error(
            "This file does not appear to be a valid asciicast recording.",
          );
        }

        const { create: AsciinemaPlayer } = await import("asciinema-player");

        if (!containerRef.current) {
          return;
        }

        playerRef.current = AsciinemaPlayer(
          { data: text },
          containerRef.current,
          { fit: "width", autoPlay: true },
        );
        setState({ status: "ready", file });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load recording";
        setState({ status: "error", file, message });
      }
    },
    [disposePlayer],
  );

  // Dispose on unmount
  useEffect(() => {
    return () => {
      disposePlayer();
    };
  }, [disposePlayer]);

  const isLoading = state.status === "loading";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-2 border-b border-slate-800 pb-5">
          <p className="text-sm font-medium text-teal-300">
            Static Asciinema Player
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Asciinema Online Player
          </h1>
        </header>

        <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <FilePicker disabled={isLoading} onFileSelected={loadFile} />
        </section>

        {state.status === "error" ? (
          <section className="rounded-lg border border-rose-700 bg-rose-950/40 p-4 text-sm text-rose-100">
            {state.message}
          </section>
        ) : null}

        {state.status === "idle" ? (
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
            Pick a local <code className="text-slate-300">.cast</code> file to
            start playback.
          </section>
        ) : null}

        <div
          ref={containerRef}
          className={state.status === "ready" ? "" : "hidden"}
        />
      </div>
    </main>
  );
}
