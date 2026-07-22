"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { GameConfig } from "@/game/types";

/**
 * Client-side wrapper die Phaser pas in de browser laadt (SSR-safe) en de
 * game-configuratie vanuit Next.js injecteert.
 */
export default function GameCanvas({ config }: { config: GameConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let game: import("phaser").Game | undefined;
    let destroyed = false;

    (async () => {
      const { createGame } = await import("@/game/createGame");
      if (destroyed || !containerRef.current) return;
      game = createGame(containerRef.current, config, () => setIsLoading(false));
    })();

    return () => {
      destroyed = true;
      game?.destroy(true);
    };
    // config is per pagina statisch (server-props) — bewust geen deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    </div>
  );
}
