"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseAsciicast, Recording, stripAnsi } from "../lib/asciicast";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; recording: Recording }
  | { status: "error"; message: string };

export function Player() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") ?? "";
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [terminalText, setTerminalText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const appliedIndexRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);

  const recording = state.status === "ready" ? state.recording : null;
  const progress = useMemo(() => {
    if (!recording || recording.duration === 0) {
      return 0;
    }

    return Math.min(100, (currentTime / recording.duration) * 100);
  }, [currentTime, recording]);

  useEffect(() => {
    if (initialUrl) {
      void loadRecording(initialUrl);
    }
  }, [initialUrl]);

  useEffect(() => {
    if (!isPlaying || !recording) {
      return;
    }

    let frame = 0;

    const tick = (now: number) => {
      if (startedAtRef.current === null) {
        startedAtRef.current = now - currentTime * 1000;
      }

      const nextTime = Math.min(
        recording.duration,
        (now - startedAtRef.current) / 1000,
      );

      setCurrentTime(nextTime);
      flushEvents(recording, nextTime);

      if (nextTime >= recording.duration) {
        setIsPlaying(false);
        startedAtRef.current = null;
        return;
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frame);
  }, [currentTime, isPlaying, recording]);

  async function loadRecording(nextUrl: string) {
    const trimmedUrl = nextUrl.trim();

    if (!trimmedUrl) {
      setState({ status: "idle" });
      return;
    }

    setState({ status: "loading" });
    setIsPlaying(false);
    setCurrentTime(0);
    setTerminalText("");
    appliedIndexRef.current = 0;
    startedAtRef.current = null;

    try {
      const response = await fetch(trimmedUrl);

      if (!response.ok) {
        throw new Error(`请求失败：HTTP ${response.status}`);
      }

      const text = await response.text();
      const nextRecording = parseAsciicast(text);
      setState({ status: "ready", recording: nextRecording });
    } catch (error) {
      const message = error instanceof Error ? error.message : "加载失败";
      setState({ status: "error", message });
    }
  }

  function flushEvents(nextRecording: Recording, untilTime: number) {
    let nextText = "";
    let nextIndex = appliedIndexRef.current;

    while (
      nextIndex < nextRecording.events.length &&
      nextRecording.events[nextIndex].time <= untilTime
    ) {
      nextText += stripAnsi(nextRecording.events[nextIndex].data);
      nextIndex += 1;
    }

    if (nextText) {
      setTerminalText((previous) => previous + nextText);
      appliedIndexRef.current = nextIndex;
    }
  }

  function handleLoad() {
    const inputUrl = inputRef.current?.value ?? "";
    void loadRecording(inputUrl);
  }

  function togglePlayback() {
    if (!recording) {
      return;
    }

    if (currentTime >= recording.duration) {
      setCurrentTime(0);
      setTerminalText("");
      appliedIndexRef.current = 0;
    }

    startedAtRef.current = null;
    setIsPlaying((playing) => !playing);
  }

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
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              ref={inputRef}
              aria-label="asciinema cast URL"
              className="min-h-11 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-teal-400"
              defaultValue={initialUrl}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLoad();
              }}
              placeholder="https://example.com/demo.cast"
              type="url"
            />
            <button
              className="min-h-11 rounded-md bg-teal-500 px-5 text-sm font-semibold text-slate-950 hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={state.status === "loading"}
              onClick={handleLoad}
              type="button"
            >
              {state.status === "loading" ? "加载中" : "加载录屏"}
            </button>
          </div>
        </section>

        {state.status === "error" ? (
          <section className="rounded-lg border border-rose-700 bg-rose-950/40 p-4 text-sm text-rose-100">
            {state.message}
          </section>
        ) : null}

        <section className="overflow-hidden rounded-lg border border-slate-800 bg-black">
          <div className="flex flex-col gap-3 border-b border-slate-800 bg-slate-900 p-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {recording?.title ?? "未加载录屏"}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {recording
                  ? `asciicast v${recording.version} · ${recording.width}x${recording.height} · ${recording.events.length} output events`
                  : "输入 .cast 文件 URL 后开始"}
              </div>
            </div>
            <button
              className="min-h-10 rounded-md border border-slate-700 px-4 text-sm font-semibold hover:border-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!recording}
              onClick={togglePlayback}
              type="button"
            >
              {isPlaying ? "暂停" : "播放"}
            </button>
          </div>

          <div className="h-1 bg-slate-800">
            <div
              className="h-full bg-teal-400 transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <pre className="min-h-[28rem] overflow-auto whitespace-pre-wrap p-4 font-mono text-sm leading-6 text-emerald-100">
            {terminalText || "等待播放输出..."}
          </pre>
        </section>
      </div>
    </main>
  );
}
