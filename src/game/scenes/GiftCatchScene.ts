import Phaser from "phaser";
import { BaseGameScene } from "./BaseGameScene";
import { playCatchSound } from "../audio";

/** Cadeautjes vangen: sleep de avatar en vang vallende cadeautjes. */
export class GiftCatchScene extends BaseGameScene {
  private gifts!: Phaser.Physics.Arcade.Group;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private catchEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("GiftCatch");
  }

  protected instruction() {
    return `Sleep ${this.config.childName} en vang de cadeautjes!`;
  }

  protected setupGame() {
    this.createDraggableAvatar();

    this.gifts = this.physics.add.group();
    this.spawnTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.spawnGift(),
    });
    this.spawnGift();

    this.catchEmitter = this.add
      .particles(0, 0, "spark", {
        speed: { min: 120, max: 320 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.1, end: 0 },
        rotate: { min: 0, max: 360 },
        lifespan: 600,
        gravityY: 300,
        emitting: false,
      })
      .setDepth(8);

    this.physics.add.overlap(this.player!, this.gifts, (_p, gift) =>
      this.catchGift(gift as Phaser.Physics.Arcade.Image)
    );
  }

  protected updateGame() {
    this.gifts.children.each((child) => {
      const gift = child as Phaser.Physics.Arcade.Image;
      if (gift.y > this.scale.height + 80) gift.destroy();
      return true;
    });
  }

  protected onFinishGame() {
    this.spawnTimer.remove();
    this.physics.pause();
  }

  private spawnGift() {
    if (this.finished) return;
    const x = Phaser.Math.Between(40, this.scale.width - 40);
    const variant = Phaser.Math.Between(0, 2);
    const gift = this.gifts.create(x, -60, `gift-${variant}`) as Phaser.Physics.Arcade.Image;
    gift
      .setVelocityY(Phaser.Math.Between(160, 240))
      .setAngularVelocity(Phaser.Math.Between(-60, 60))
      .setDepth(6);
  }

  private catchGift(gift: Phaser.Physics.Arcade.Image) {
    if (this.finished || !gift.active) return;
    this.catchEmitter.explode(24, gift.x, gift.y);
    playCatchSound();
    gift.destroy();
    if (this.rig) {
      const s = this.rig.scaleX;
      this.tweens.add({
        targets: this.rig,
        scaleX: s * 1.1,
        scaleY: s * 0.9,
        duration: 90,
        yoyo: true,
      });
    }
    this.addScore();
  }
}
