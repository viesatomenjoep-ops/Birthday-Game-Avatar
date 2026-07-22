import Phaser from "phaser";
import { BaseGameScene } from "./BaseGameScene";
import { playCatchSound } from "../audio";

/** Snoep rennen: de avatar rent, tik om te springen over hindernissen en snoep te pakken. */
export class CandyRunScene extends BaseGameScene {
  private obstacles!: Phaser.Physics.Arcade.Group;
  private candies!: Phaser.Physics.Arcade.Group;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private collectEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private groundY = 0;

  constructor() {
    super("CandyRun");
  }

  protected instruction() {
    return "Tik om te springen! 🍬";
  }

  protected setupGame() {
    const { width, height } = this.scale;
    this.groundY = height * 0.85;

    // Onzichtbare grond waar de avatar op landt.
    const ground = this.add.rectangle(width / 2, this.groundY + 8, width * 2, 16, 0x000000, 0);
    this.physics.add.existing(ground, true);

    // Rennende avatar links.
    this.glow = this.add.image(width * 0.24, this.groundY - 40, "glow").setScale(0.8).setDepth(4);
    const avatar = this.physics.add
      .image(width * 0.24, this.groundY - 60, "avatar")
      .setDepth(5)
      .setTint(0xffe8cc);
    const targetHeight = Math.min(height * 0.2, 170);
    avatar.setScale(targetHeight / avatar.height);
    avatar.setGravityY(1800);
    avatar.setCollideWorldBounds(true);
    this.physics.add.collider(avatar, ground);
    this.player = avatar;

    // Rennen: lichte bob.
    this.tweens.add({
      targets: avatar,
      angle: { from: -5, to: 5 },
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.obstacles = this.physics.add.group({ allowGravity: false });
    this.candies = this.physics.add.group({ allowGravity: false });

    this.spawnTimer = this.time.addEvent({
      delay: 1300,
      loop: true,
      callback: () => this.spawnStuff(),
    });
    this.time.delayedCall(600, () => this.spawnStuff());

    this.collectEmitter = this.add
      .particles(0, 0, "spark", {
        speed: { min: 90, max: 220 },
        scale: { start: 0.9, end: 0 },
        lifespan: 450,
        emitting: false,
      })
      .setDepth(8);

    this.physics.add.overlap(avatar, this.candies, (_a, candy) =>
      this.collectCandy(candy as Phaser.Physics.Arcade.Image)
    );
    this.physics.add.overlap(avatar, this.obstacles, (_a, obs) =>
      this.hitObstacle(obs as Phaser.Physics.Arcade.Image)
    );

    this.input.on("pointerdown", () => this.jump());
  }

  protected updateGame() {
    const cleanup = (group: Phaser.Physics.Arcade.Group) => {
      group.children.each((child) => {
        const item = child as Phaser.Physics.Arcade.Image;
        if (item.x < -60) item.destroy();
        return true;
      });
    };
    cleanup(this.obstacles);
    cleanup(this.candies);
  }

  protected onFinishGame() {
    this.spawnTimer.remove();
    this.physics.pause();
  }

  private jump() {
    if (this.finished || !this.player) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down || body.touching.down) {
      this.player.setVelocityY(-780);
    }
  }

  private spawnStuff() {
    if (this.finished) return;
    const { width } = this.scale;
    const speed = -Phaser.Math.Between(240, 320);

    // Hindernis op de grond.
    const obs = this.obstacles.create(width + 40, this.groundY - 30, "obstacle") as Phaser.Physics.Arcade.Image;
    obs.setVelocityX(speed).setDepth(6);
    obs.setData("hit", false);

    // Snoepje erboven om over de hindernis heen te pakken.
    if (Phaser.Math.Between(0, 1) === 1) {
      const candy = this.candies.create(
        width + 40 + Phaser.Math.Between(90, 160),
        this.groundY - Phaser.Math.Between(110, 160),
        "candy"
      ) as Phaser.Physics.Arcade.Image;
      candy.setVelocityX(speed).setDepth(6);
      this.tweens.add({
        targets: candy,
        y: candy.y - 12,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private collectCandy(candy: Phaser.Physics.Arcade.Image) {
    if (this.finished || !candy.active) return;
    this.collectEmitter.explode(16, candy.x, candy.y);
    playCatchSound();
    candy.destroy();
    this.addScore();
  }

  private hitObstacle(obs: Phaser.Physics.Arcade.Image) {
    if (this.finished || obs.getData("hit")) return;
    obs.setData("hit", true);
    // Geen straf voor een 5-jarige: alleen een vrolijke flits.
    if (this.player) {
      this.player.setTint(0xff6fb5);
      this.time.delayedCall(200, () => this.player?.setTint(0xffe8cc));
    }
    this.cameras.main.shake(120, 0.008);
  }
}
