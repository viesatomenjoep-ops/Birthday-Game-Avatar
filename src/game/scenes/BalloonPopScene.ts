import Phaser from "phaser";
import { BaseGameScene } from "./BaseGameScene";
import { playCatchSound } from "../audio";

/** Ballonnen knallen: tik opstijgende ballonnen weg voor ze wegzweven. */
export class BalloonPopScene extends BaseGameScene {
  private balloons!: Phaser.Physics.Arcade.Group;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private popEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("BalloonPop");
  }

  protected instruction() {
    return "Tik de ballonnen weg!";
  }

  protected setupGame() {
    this.createDecorAvatar(this.scale.width / 2, this.scale.height - 100, 0.17);

    this.balloons = this.physics.add.group();
    this.spawnTimer = this.time.addEvent({
      delay: 750,
      loop: true,
      callback: () => this.spawnBalloon(),
    });
    this.spawnBalloon();

    this.popEmitter = this.add
      .particles(0, 0, "spark", {
        speed: { min: 100, max: 260 },
        scale: { start: 0.9, end: 0 },
        lifespan: 500,
        emitting: false,
      })
      .setDepth(8);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) =>
      this.tryPop(pointer)
    );
  }

  protected updateGame(time: number) {
    this.balloons.children.each((child) => {
      const b = child as Phaser.Physics.Arcade.Image;
      const baseX = b.getData("baseX") as number;
      const phase = b.getData("phase") as number;
      b.x = baseX + Math.sin(time / 500 + phase) * 24;
      if (b.y < -70) b.destroy();
      return true;
    });
  }

  protected onFinishGame() {
    this.spawnTimer.remove();
    this.physics.pause();
  }

  private spawnBalloon() {
    if (this.finished) return;
    const x = Phaser.Math.Between(50, this.scale.width - 50);
    const variant = Phaser.Math.Between(0, 3);
    const b = this.balloons.create(
      x,
      this.scale.height + 60,
      `balloon-${variant}`
    ) as Phaser.Physics.Arcade.Image;
    b.setVelocityY(-Phaser.Math.Between(70, 120)).setDepth(6);
    b.setData("baseX", x);
    b.setData("phase", Phaser.Math.FloatBetween(0, Math.PI * 2));
  }

  private tryPop(pointer: Phaser.Input.Pointer) {
    if (this.finished) return;
    let closest: Phaser.Physics.Arcade.Image | null = null;
    let closestDist = 48;
    this.balloons.children.each((child) => {
      const b = child as Phaser.Physics.Arcade.Image;
      if (!b.active) return true;
      const d = Phaser.Math.Distance.Between(pointer.x, pointer.y, b.x, b.y);
      if (d < closestDist) {
        closestDist = d;
        closest = b;
      }
      return true;
    });
    if (closest) {
      const b = closest as Phaser.Physics.Arcade.Image;
      this.popEmitter.explode(16, b.x, b.y);
      playCatchSound();
      b.destroy();
      this.addScore();
    }
  }
}
