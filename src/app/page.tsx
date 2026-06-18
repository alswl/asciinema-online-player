import { Suspense } from "react";
import { Player } from "../components/player";

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-6 text-sm text-slate-300">
          加载播放器...
        </main>
      }
    >
      <Player />
    </Suspense>
  );
}
