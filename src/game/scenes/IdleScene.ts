import Phaser from "phaser";
import { drawFestivalBackground } from "../background";

/**
 * Rustig decor achter het HTML-keuzemenu: de feest-achtergrond met een paar
 * zacht dwarrelende cadeautjes. Geen interactie — de React-laag toont het menu.
 */
export class IdleScene extends Phaser.Scene {
  constructor() {
    super("Idle");
  }

  create() {
    drawFestivalBackground(this);

    const { width, height } = this.scale;
    for (let i = 0; i < 6; i++) {
      const x = Phaser.Math.Between(30, width - 30);
      const variant = Phaser.Math.Between(0, 2);
      const gift = this.add
        .image(x, Phaser.Math.Between(120, height - 160), `gift-${variant}`)
        .setDepth(6)
        .setAlpha(0.9);
      this.tweens.add({
        targets: gift,
        y: gift.y - Phaser.Math.Between(16, 30),
        angle: { from: -8, to: 8 },
        duration: Phaser.Math.Between(1600, 2600),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }
}
