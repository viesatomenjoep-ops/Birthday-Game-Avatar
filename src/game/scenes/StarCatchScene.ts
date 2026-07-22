import Phaser from "phaser";
import { BaseGameScene } from "./BaseGameScene";
import { playCatchSound } from "../audio";

/** Sterren vangen: tik de vallende sterren aan voor ze de grond raken. */
export class StarCatchScene extends BaseGameScene {
  private stars!: Phaser.Physics.Arcade.Group;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private sparkEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("StarCatch");
  }

  protected instruction() {
    return "Tik de vallende sterren!";
  }

  protected setupGame() {
    this.createDecorAvatar(this.scale.width / 2, this.scale.height - 100, 0.17);

    this.stars = this.physics.add.group();
    this.spawnTimer = this.time.addEvent({
      delay: 800,
      loop: true,
      callback: () => this.spawnStar(),
    });
    this.spawnStar();

    this.sparkEmitter = this.add
      .particles(0, 0, "spark", {
        speed: { min: 90, max: 240 },
        scale: { start: 1, end: 0 },
        lifespan: 500,
        emitting: false,
      })
      .setDepth(8);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) =>
      this.tryCatch(pointer)
    );
  }

  protected updateGame() {
    this.stars.children.each((child) => {
      const s = child as Phaser.Physics.Arcade.Image;
      if (s.y > this.scale.height + 70) s.destroy();
      return true;
    });
  }

  protected onFinishGame() {
    this.spawnTimer.remove();
    this.physics.pause();
  }

  private spawnStar() {
    if (this.finished) return;
    const x = Phaser.Math.Between(40, this.scale.width - 40);
    const s = this.stars.create(x, -50, "star") as Phaser.Physics.Arcade.Image;
    s.setVelocityY(Phaser.Math.Between(130, 200))
      .setAngularVelocity(Phaser.Math.Between(-120, 120))
      .setDepth(6);
    // Twinkelen.
    this.tweens.add({
      targets: s,
      scale: { from: 0.85, to: 1.1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  private tryCatch(pointer: Phaser.Input.Pointer) {
    if (this.finished) return;
    let closest: Phaser.Physics.Arcade.Image | null = null;
    let closestDist = 46;
    this.stars.children.each((child) => {
      const s = child as Phaser.Physics.Arcade.Image;
      if (!s.active) return true;
      const d = Phaser.Math.Distance.Between(pointer.x, pointer.y, s.x, s.y);
      if (d < closestDist) {
        closestDist = d;
        closest = s;
      }
      return true;
    });
    if (closest) {
      const s = closest as Phaser.Physics.Arcade.Image;
      this.sparkEmitter.explode(18, s.x, s.y);
      playCatchSound();
      s.destroy();
      this.addScore();
    }
  }
}
