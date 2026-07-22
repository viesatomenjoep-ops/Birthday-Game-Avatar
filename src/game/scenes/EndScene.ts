import Phaser from "phaser";
import type { GameConfig } from "../types";
import { playWinFanfare } from "../audio";

/**
 * Eindscherm (pay-off): confetti-regen + de dynamische uitnodigingstekst,
 * bijv. "Hoera! Vive wordt 5 jaar! Kom je naar mijn feestje op 14 augustus?"
 */
export class EndScene extends Phaser.Scene {
  constructor() {
    super("End");
  }

  create() {
    const config = this.registry.get("gameConfig") as GameConfig;
    const { width, height } = this.scale;

    playWinFanfare();

    // Donkere overlay die zacht infadet zodat de tekst leesbaar is.
    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x1a0f30, 0)
      .setDepth(20);
    this.tweens.add({ targets: overlay, fillAlpha: 0.55, duration: 500 });

    // Realistische confetti: meerdere kleuren, rotatie, zwaartekracht en drift.
    for (let i = 0; i < 6; i++) {
      this.add
        .particles(0, 0, `confetti-${i}`, {
          x: { min: 0, max: width },
          y: -20,
          lifespan: 4200,
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

    // Uitnodigingstekst in drie regels, met bounce-animatie.
    const lines = [
      `Hoera! ${config.childName} wordt ${config.age} jaar! 🎂`,
      `Kom je naar mijn feestje`,
      `op ${config.dateLabel}?`,
    ];

    const fontSize = Math.min(width * 0.075, 34);
    let nextY = height * 0.3;
    lines.forEach((line, index) => {
      const text = this.add
        .text(width / 2, nextY, line, {
          fontFamily: "system-ui, sans-serif",
          fontSize: `${index === 0 ? fontSize : fontSize * 0.82}px`,
          fontStyle: "900",
          color: index === 0 ? "#ffd97a" : "#ffffff",
          stroke: "#7c2d92",
          strokeThickness: 8,
          align: "center",
          wordWrap: { width: width * 0.9 },
        })
        .setOrigin(0.5, 0)
        .setDepth(30)
        .setScale(0);

      // Volgende regel onder de (eventueel gewrapte) vorige regel.
      nextY += text.height + 14;

      this.tweens.add({
        targets: text,
        scale: 1,
        delay: 300 + index * 250,
        duration: 550,
        ease: "Back.easeOut",
      });
    });

    // Zachte puls op de eerste regel als blijvend feest-effect.
    this.time.delayedCall(1600, () => {
      const firstLine = this.children.list.find(
        (child) => child instanceof Phaser.GameObjects.Text
      );
      if (firstLine) {
        this.tweens.add({
          targets: firstLine,
          scale: 1.06,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    });

    // Nog een keer spelen: tik op het scherm na 2,5s.
    this.time.delayedCall(2500, () => {
      const replay = this.add
        .text(width / 2, height * 0.82, "Tik om nog een keer te spelen 🔁", {
          fontFamily: "system-ui, sans-serif",
          fontSize: "17px",
          fontStyle: "700",
          color: "#ffe8cc",
        })
        .setOrigin(0.5)
        .setDepth(30)
        .setAlpha(0);
      this.tweens.add({ targets: replay, alpha: 1, duration: 400 });

      this.input.once("pointerdown", () => {
        this.scene.stop("End");
        this.scene.get("Game").scene.restart();
      });
    });
  }
}
