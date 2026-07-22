import Phaser from "phaser";
import type { GameConfig } from "../types";
import { playWinFanfare } from "../audio";

/**
 * Eindscherm (pay-off): confetti-regen + de dynamische uitnodigingstekst,
 * bijv. "Hoera! Vieve wordt 5 jaar! Kom je naar mijn kinderfeestje op
 * woensdag 2 september?" — plus optionele feestdetails uit de uitnodiging.
 */
export class EndScene extends Phaser.Scene {
  private titleText?: Phaser.GameObjects.Text;

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
    this.tweens.add({ targets: overlay, fillAlpha: 0.62, duration: 500 });

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

    const locationLine = config.location
      ? `bij ${config.location} op ${config.dateLabel}?`
      : `op ${config.dateLabel}?`;

    // Grote koptekst (naam + leeftijd + uitnodiging).
    const headline: Array<{ text: string; kind: "title" | "big" }> = [
      { text: `Hoera! ${config.childName} wordt ${config.age} jaar! 🎂`, kind: "title" },
      { text: `Kom jij ook naar mijn kinderfeestje`, kind: "big" },
      { text: locationLine, kind: "big" },
    ];

    const bigSize = Math.min(width * 0.07, 30);
    let nextY = height * 0.14;
    let delayStep = 0;

    headline.forEach(({ text: line, kind }) => {
      const isTitle = kind === "title";
      const obj = this.add
        .text(width / 2, nextY, line, {
          fontFamily: "system-ui, sans-serif",
          fontSize: `${isTitle ? bigSize * 1.08 : bigSize * 0.82}px`,
          fontStyle: "900",
          color: isTitle ? "#ffd97a" : "#ffffff",
          stroke: "#7c2d92",
          strokeThickness: isTitle ? 8 : 6,
          align: "center",
          wordWrap: { width: width * 0.9 },
        })
        .setOrigin(0.5, 0)
        .setDepth(30)
        .setScale(0);

      if (isTitle) this.titleText = obj;
      nextY += obj.height + 12;

      this.tweens.add({
        targets: obj,
        scale: 1,
        delay: 300 + delayStep * 220,
        duration: 520,
        ease: "Back.easeOut",
      });
      delayStep += 1;
    });

    // Detailregels uit de uitnodiging (tijden, ophalen, ...).
    nextY += 6;
    (config.details ?? []).forEach((line) => {
      const detail = this.add
        .text(width / 2, nextY, line, {
          fontFamily: "system-ui, sans-serif",
          fontSize: `${Math.min(width * 0.042, 17)}px`,
          fontStyle: "700",
          color: "#ffe8cc",
          align: "center",
          wordWrap: { width: width * 0.86 },
          lineSpacing: 3,
        })
        .setOrigin(0.5, 0)
        .setDepth(30)
        .setAlpha(0);

      nextY += detail.height + 10;

      this.tweens.add({
        targets: detail,
        alpha: 1,
        delay: 300 + delayStep * 200,
        duration: 400,
      });
      delayStep += 1;
    });

    // Vrolijke slogan als afsluiter, bijv. "We hebben er zin in!".
    if (config.slogan) {
      nextY += 8;
      const slogan = this.add
        .text(width / 2, nextY, config.slogan, {
          fontFamily: "system-ui, sans-serif",
          fontSize: `${Math.min(width * 0.058, 24)}px`,
          fontStyle: "900",
          color: "#ff6fb5",
          stroke: "#ffffff",
          strokeThickness: 5,
          align: "center",
          wordWrap: { width: width * 0.9 },
        })
        .setOrigin(0.5, 0)
        .setDepth(30)
        .setScale(0);

      this.tweens.add({
        targets: slogan,
        scale: 1,
        delay: 400 + delayStep * 200,
        duration: 550,
        ease: "Back.easeOut",
      });
    }

    // Zachte puls op de koptekst als blijvend feest-effect.
    this.time.delayedCall(1800, () => {
      if (this.titleText) {
        this.tweens.add({
          targets: this.titleText,
          scale: 1.06,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    });

    // Nog een keer spelen: tik op het scherm na 3s.
    this.time.delayedCall(3000, () => {
      const replay = this.add
        .text(width / 2, height - 34, "Tik om nog een keer te spelen 🔁", {
          fontFamily: "system-ui, sans-serif",
          fontSize: "16px",
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
