"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, RotateCcw, LayoutGrid } from "lucide-react";
import type { GameConfig } from "@/game/types";
import { GAMES } from "@/game/types";

type View = "menu" | "playing" | "invitation";

/**
 * Client-side wrapper om Phaser. Toont een keuzemenu met 5 spellen; het kind
 * kiest, speelt 25 seconden, en krijgt daarna de volledige uitnodiging.
 */
export default function GameCanvas({ config }: { config: GameConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const bridgeRef = useRef<typeof import("@/game/createGame") | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<View>("menu");
  const [currentScene, setCurrentScene] = useState<string | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => {
    let destroyed = false;

    (async () => {
      const mod = await import("@/game/createGame");
      if (destroyed || !containerRef.current) return;
      bridgeRef.current = mod;
      gameRef.current = mod.createGame(
        containerRef.current,
        config,
        () => setIsLoading(false),
        () => setView("invitation")
      );
    })();

    return () => {
      destroyed = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function playScene(sceneKey: string) {
    const game = gameRef.current;
    const bridge = bridgeRef.current;
    if (!game || !bridge) return;
    bridge.startGame(game, sceneKey);
    setCurrentScene(sceneKey);
    setView("playing");
  }

  function goToMenu() {
    const game = gameRef.current;
    const bridge = bridgeRef.current;
    if (game && bridge) bridge.backToMenu(game);
    setView("menu");
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

      {/* Keuzemenu */}
      {!isLoading && view === "menu" && (
        <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-[#1a0f30]/70 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-md animate-pop-in rounded-3xl bg-white/95 p-6 text-center shadow-2xl">
            {avatarBroken ? (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-amber-100 text-4xl shadow">
                🎮
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.avatarUrl}
                alt={`Avatar van ${config.childName}`}
                onError={() => setAvatarBroken(true)}
                className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-100 to-amber-100 object-contain p-1 shadow"
              />
            )}
            <h2 className="mt-3 text-2xl font-black text-slate-900">
              Kies een spelletje, {config.childName}!
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Elk spel duurt 25 seconden 🎉
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3">
              {GAMES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => playScene(g.sceneKey)}
                  className="flex items-center gap-4 rounded-2xl border-2 border-slate-100 bg-white p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/60 active:scale-[0.98]"
                >
                  <span className="text-3xl">{g.emoji}</span>
                  <span className="flex-1">
                    <span className="block font-extrabold text-slate-800">
                      {g.title}
                    </span>
                    <span className="block text-sm text-slate-500">{g.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Uitnodiging na afloop */}
      {view === "invitation" && (
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
                  <div key={section.label} className="rounded-2xl bg-brand-50/70 p-4">
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

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {currentScene && (
                <button
                  onClick={() => playScene(currentScene)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-3 font-extrabold text-white shadow-lg shadow-brand-500/25 transition hover:from-brand-500 hover:to-brand-400 active:scale-95"
                >
                  <RotateCcw className="h-5 w-5" />
                  Nog een keer
                </button>
              )}
              <button
                onClick={goToMenu}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-5 py-3 font-extrabold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 active:scale-95"
              >
                <LayoutGrid className="h-5 w-5" />
                Ander spel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
