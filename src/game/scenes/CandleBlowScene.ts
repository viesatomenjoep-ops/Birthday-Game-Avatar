import Phaser from "phaser";
import { BaseGameScene } from "./BaseGameScene";
import { playCatchSound } from "../audio";

type Candle = {
  x: number;
  y: number;
  flame: Phaser.GameObjects.Image;
  lit: boolean;
};

/** Kaarsjes uitblazen: tik de brandende kaarsjes op de taart uit. */
export class CandleBlowScene extends BaseGameScene {
  private candles: Candle[] = [];
  private puffEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("CandleBlow");
  }

  protected instruction() {
    return "Tik de kaarsjes uit!";
  }

  protected setupGame() {
    const { width, height } = this.scale;
    this.candles = [];

    // Avatar naast de taart.
    this.createDecorAvatar(width * 0.5, height * 0.34, 0.15);

    // Taart.
    const cakeW = Math.min(width * 0.74, 320);
    const cakeH = 120;
    const cakeX = width / 2 - cakeW / 2;
    const cakeY = height * 0.6;
    const cake = this.add.graphics().setDepth(5);
    cake.fillStyle(0xffe0ec, 1);
    cake.fillRoundedRect(cakeX, cakeY, cakeW, cakeH, 16);
    cake.fillStyle(0xff9ec4, 1);
    cake.fillRoundedRect(cakeX, cakeY, cakeW, 26, { tl: 16, tr: 16, bl: 0, br: 0 });
    // Glazuurdruppels
    for (let i = 0; i <= 6; i++) {
      const dx = cakeX + (cakeW / 6) * i;
      cake.fillCircle(dx, cakeY + 26, 10);
    }
    cake.fillStyle(0xffffff, 0.5);
    cake.fillRoundedRect(cakeX + 12, cakeY + 40, cakeW - 24, 8, 4);

    // Kaarsjes bovenop.
    const count = 6;
    const topY = cakeY - 10;
    for (let i = 0; i < count; i++) {
      const cx = cakeX + (cakeW / (count + 1)) * (i + 1);
      this.add.image(cx, topY, "candle").setDepth(6);
      const flame = this.add.image(cx, topY - 30, "flame").setDepth(7);
      this.tweens.add({
        targets: flame,
        scaleY: { from: 0.85, to: 1.12 },
        duration: 320,
        yoyo: true,
        repeat: -1,
      });
      this.candles.push({ x: cx, y: topY - 20, flame, lit: true });
    }

    this.puffEmitter = this.add
      .particles(0, 0, "spark", {
        speed: { min: 40, max: 120 },
        scale: { start: 0.7, end: 0 },
        lifespan: 400,
        tint: 0xcccccc,
        emitting: false,
      })
      .setDepth(9);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) =>
      this.tryBlow(pointer)
    );
  }

  protected onFinishGame() {
    this.candles.forEach((c) => c.flame.destroy());
  }

  private tryBlow(pointer: Phaser.Input.Pointer) {
    if (this.finished) return;
    let closest: Candle | null = null;
    let closestDist = 44;
    for (const c of this.candles) {
      if (!c.lit) continue;
      const d = Phaser.Math.Distance.Between(pointer.x, pointer.y, c.x, c.y);
      if (d < closestDist) {
        closestDist = d;
        closest = c;
      }
    }
    if (!closest) return;

    closest.lit = false;
    closest.flame.setVisible(false);
    this.puffEmitter.explode(10, closest.x, closest.y - 10);
    playCatchSound();
    this.addScore();

    // Kaarsje gaat na een tijdje weer aan, zodat je 25s door kunt spelen.
    this.time.delayedCall(1400, () => {
      if (this.finished) return;
      closest.lit = true;
      closest.flame.setVisible(true);
    });
  }
}
