import Phaser from "phaser";
import type { GameConfig } from "./types";
import { GAMES } from "./types";
import { PreloadScene } from "./scenes/PreloadScene";
import { IdleScene } from "./scenes/IdleScene";
import { GiftCatchScene } from "./scenes/GiftCatchScene";
import { BalloonPopScene } from "./scenes/BalloonPopScene";
import { CandleBlowScene } from "./scenes/CandleBlowScene";
import { CandyRunScene } from "./scenes/CandyRunScene";
import { StarCatchScene } from "./scenes/StarCatchScene";
import { EndScene } from "./scenes/EndScene";

/**
 * Boot de Phaser-game. De React-laag (GameCanvas) bepaalt via `startGame`/
 * `backToMenu` welke scene actief is; `onFinish` laat React de uitnodiging tonen.
 */
export function createGame(
  parent: HTMLElement,
  config: GameConfig,
  onReady: () => void,
  onFinish: () => void
): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#2d1b4e",
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { debug: false },
    },
    render: { antialias: true, roundPixels: false },
    fps: { target: 60 },
    scene: [
      PreloadScene,
      IdleScene,
      GiftCatchScene,
      BalloonPopScene,
      CandleBlowScene,
      CandyRunScene,
      StarCatchScene,
      EndScene,
    ],
  });

  game.registry.set("gameConfig", config);
  game.registry.set("onFinish", onFinish);
  game.events.once("ready", onReady);

  return game;
}

const ALL_SCENE_KEYS = [
  "Idle",
  "End",
  ...GAMES.map((g) => g.sceneKey),
];

/** Stop alle actieve spel-scenes en start één specifieke spel-scene. */
export function startGame(game: Phaser.Game, sceneKey: string) {
  ALL_SCENE_KEYS.forEach((key) => {
    if (game.scene.isActive(key) || game.scene.isPaused(key)) {
      game.scene.stop(key);
    }
  });
  game.scene.start(sceneKey);
}

/** Terug naar het rustige menu-decor. */
export function backToMenu(game: Phaser.Game) {
  ALL_SCENE_KEYS.forEach((key) => {
    if (game.scene.isActive(key) || game.scene.isPaused(key)) {
      game.scene.stop(key);
    }
  });
  game.scene.start("Idle");
}
