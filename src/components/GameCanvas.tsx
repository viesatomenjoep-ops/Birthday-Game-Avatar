"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import type { GameConfig } from "@/game/types";

/**
 * Client-side wrapper die Phaser pas in de browser laadt (SSR-safe) en de
 * game-configuratie vanuit Next.js injecteert. Na 25 seconden verschijnt de
 * volledige uitnodiging als leesbare HTML-kaart bovenop het canvas.
 */
export default function GameCanvas({ config }: { config: GameConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  // Wijzigen van round herstart de hele game (useEffect draait opnieuw).
  const [round, setRound] = useState(0);

  useEffect(() => {
    let game: import("phaser").Game | undefined;
    let destroyed = false;

    (async () => {
      const { createGame } = await import("@/game/createGame");
      if (destroyed || !containerRef.current) return;
      game = createGame(
        containerRef.current,
        config,
        () => setIsLoading(false),
        () => setFinished(true)
      );
    })();

    return () => {
      destroyed = true;
      game?.destroy(true);
    };
    // config is per pagina statisch (server-props); round triggert een herstart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  function replay() {
    setFinished(false);
    setIsLoading(true);
    setRound((r) => r + 1);
  }

  return (
    <div className="game-root bg-[#2d1b4e]">
      <div ref={containerRef} className="game-root" />

      {isLoading && (
        <div className="pointer-events-none fixed inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#2d1b4e] text-white">
          <Loader2 className="h-10 w-10 animate-spin text-amber-300" />
          <p className="text-lg font-extrabold">
            De game van {config.childName} wordt geladen…
          </p>
        </div>
      )}

      {finished && (
        <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-[#1a0f30]/80 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-md animate-pop-in rounded-3xl bg-white/95 p-6 text-center shadow-2xl sm:p-8">
            <p className="text-xl font-black uppercase tracking-wide text-brand-500">
              Hoera!
            </p>
            <h2 className="mt-1 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
              {config.childName} wordt {config.age}! 🎂
            </h2>
            {config.greeting && (
              <p className="mt-3 text-lg font-bold text-brand-600">
                {config.greeting}
              </p>
            )}

            {config.sections && config.sections.length > 0 && (
              <div className="mt-6 space-y-4 text-left">
                {config.sections.map((section) => (
                  <div
                    key={section.label}
                    className="rounded-2xl bg-brand-50/70 p-4"
                  >
                    <p className="mb-1 text-sm font-black uppercase tracking-wide text-sun-500">
                      {section.label}
                    </p>
                    {section.lines.map((line, i) => (
                      <p key={i} className="font-semibold leading-snug text-slate-700">
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {config.slogan && (
              <p className="mt-6 text-2xl font-black text-brand-600">
                {config.slogan} 🎉
              </p>
            )}

            <button
              onClick={replay}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-3 font-extrabold text-white shadow-lg shadow-brand-500/25 transition hover:from-brand-500 hover:to-brand-400 active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
              Speel nog een keer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
