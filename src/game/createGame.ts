import Phaser from "phaser";
import type { GameConfig } from "./types";
import { PreloadScene } from "./scenes/PreloadScene";
import { GameScene } from "./scenes/GameScene";
import { EndScene } from "./scenes/EndScene";

/**
 * Boot de Phaser-game in een DOM-container. De GameConfig (avatar-URL, naam,
 * leeftijd, datum) komt vanuit Next.js en wordt via de scene-registry
 * doorgegeven aan alle scenes.
 */
export function createGame(
  parent: HTMLElement,
  config: GameConfig,
  onReady: () => void
): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO, // WebGL waar mogelijk, Canvas-fallback
    parent,
    backgroundColor: "#2d1b4e",
    scale: {
      // RESIZE + het CSS-fullscreen wrapper-element = perfect passend op
      // elke smartphone-verhouding, ook in de WhatsApp in-app browser.
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { debug: false },
    },
    render: {
      antialias: true,
      roundPixels: false,
    },
    fps: { target: 60 },
    scene: [PreloadScene, GameScene, EndScene],
  });

  game.registry.set("gameConfig", config);
  game.events.once("ready", onReady);

  return game;
}
