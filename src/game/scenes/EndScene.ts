import Phaser from "phaser";
import { playWinFanfare } from "../audio";

/**
 * Eindscherm: alleen confetti-regen + fanfare. De uitnodigingstekst wordt in
 * leesbare HTML getoond door de React-laag (GameCanvas), bovenop dit canvas.
 */
export class EndScene extends Phaser.Scene {
  constructor() {
    super("End");
  }

  create() {
    const { width } = this.scale;

    playWinFanfare();

    // Realistische confetti: meerdere kleuren, rotatie, zwaartekracht en drift.
    for (let i = 0; i < 6; i++) {
      this.add
        .particles(0, 0, `confetti-${i}`, {
          x: { min: 0, max: width },
          y: -20,
          lifespan: 4600,
          speedY: { min: 140, max: 320 },
          speedX: { min: -60, max: 60 },
          rotate: { start: 0, end: 720 },
          scale: { min: 0.6, max: 1.2 },
          gravityY: 60,
          quantity: 1,
          frequency: 90,
        })
        .setDepth(25);
    }
  }
}
