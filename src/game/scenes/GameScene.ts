import Phaser from "phaser";
import { TARGET_SCORE, type GameConfig } from "../types";
import { playCatchSound } from "../audio";

/**
 * Cadeautjes Vangen — de speler sleept de avatar onderaan het scherm en vangt
 * vallende cadeautjes tegen een golden-hour pretparkachtergrond.
 */
export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private gifts!: Phaser.Physics.Arcade.Group;
  private catchEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private scoreText!: Phaser.GameObjects.Text;
  private glow!: Phaser.GameObjects.Image;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private score = 0;
  private finished = false;

  constructor() {
    super("Game");
  }

  create() {
    const config = this.registry.get("gameConfig") as GameConfig;
    const { width, height } = this.scale;

    this.score = 0;
    this.finished = false;

    this.drawBackground(width, height);

    // --- Avatar (dynamisch ingeladen via Cloudinary) ---
    // Warme gloed erachter zodat de uitgesneden foto opgaat in de belichting.
    this.glow = this.add.image(width / 2, height - 120, "glow").setDepth(4);

    this.player = this.physics.add
      .image(width / 2, height - 120, "avatar")
      .setDepth(5)
      .setCollideWorldBounds(true);

    // Haarscherp schalen naar een vaste hoogte, verhouding behouden.
    const targetHeight = Math.min(height * 0.22, 190);
    const scaleFactor = targetHeight / this.player.height;
    this.player.setScale(scaleFactor);
    // Subtiele warme tint = integratie met de golden-hour omgeving.
    this.player.setTint(0xffe8cc);

    // Ruime hitbox: 1.6× de sprite-breedte, makkelijk voor een 5-jarige.
    const bodyWidth = this.player.displayWidth * 1.6;
    const bodyHeight = this.player.displayHeight * 1.1;
    (this.player.body as Phaser.Physics.Arcade.Body)
      .setSize(bodyWidth / scaleFactor, bodyHeight / scaleFactor)
      .setOffset(
        (this.player.width - bodyWidth / scaleFactor) / 2,
        (this.player.height - bodyHeight / scaleFactor) / 2
      );

    // --- Besturing: slepen via touch/pointer ---
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && !this.finished) {
        this.player.x = Phaser.Math.Clamp(
          pointer.x,
          this.player.displayWidth / 2,
          this.scale.width - this.player.displayWidth / 2
        );
      }
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.finished) this.player.x = pointer.x;
    });

    // --- Cadeautjes ---
    this.gifts = this.physics.add.group();
    this.spawnTimer = this.time.addEvent({
      delay: 1100,
      loop: true,
      callback: () => this.spawnGift(),
    });
    this.spawnGift();

    // --- Vang-effect: glitters/vonken ---
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

    this.physics.add.overlap(this.player, this.gifts, (_player, gift) =>
      this.catchGift(gift as Phaser.Physics.Arcade.Image)
    );

    // --- HUD ---
    this.scoreText = this.add
      .text(width / 2, 28, this.scoreLabel(), {
        fontFamily: "system-ui, sans-serif",
        fontSize: "26px",
        fontStyle: "900",
        color: "#ffffff",
        stroke: "#7c2d92",
        strokeThickness: 6,
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    this.add
      .text(width / 2, height - 24, `Sleep ${config.childName} en vang de cadeautjes!`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "15px",
        fontStyle: "700",
        color: "#ffe8cc",
      })
      .setOrigin(0.5, 1)
      .setDepth(10)
      .setAlpha(0.9);

    // Responsief: herpositioneer bij rotatie/resize van de telefoon.
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });
  }

  update() {
    if (this.finished) return;

    // Gloed volgt de avatar.
    this.glow.setPosition(this.player.x, this.player.y + 10);

    // Gemiste cadeautjes opruimen zodra ze onder het scherm zijn.
    this.gifts.children.each((child) => {
      const gift = child as Phaser.Physics.Arcade.Image;
      if (gift.y > this.scale.height + 80) {
        gift.destroy();
      }
      return true;
    });
  }

  // --- helpers ---

  private scoreLabel() {
    return `🎁 ${this.score} / ${TARGET_SCORE}`;
  }

  private spawnGift() {
    if (this.finished) return;
    const { width } = this.scale;
    const x = Phaser.Math.Between(40, width - 40);
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

    // Kleine "squash"-feedback op de avatar.
    this.tweens.add({
      targets: this.player,
      scaleX: this.player.scaleX * 1.12,
      scaleY: this.player.scaleY * 0.92,
      duration: 90,
      yoyo: true,
    });

    this.score += 1;
    this.scoreText.setText(this.scoreLabel());

    if (this.score >= TARGET_SCORE) {
      this.finishGame();
    }
  }

  /** Score bereikt: stop de game loop en start het eindscherm. */
  private finishGame() {
    this.finished = true;
    this.spawnTimer.remove();
    this.physics.pause();

    this.tweens.add({
      targets: [this.player, this.glow],
      y: "-=30",
      duration: 400,
      ease: "Back.easeOut",
    });

    this.time.delayedCall(600, () => {
      this.scene.launch("End");
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    if (!this.player) return;
    this.player.y = gameSize.height - 120;
    this.scoreText.setPosition(gameSize.width / 2, 28);
  }

  /** Golden-hour pretpark: lucht met zonsondergang, zon, reuzenrad-silhouet. */
  private drawBackground(width: number, height: number) {
    // Lucht: verticale gradient van warm goud naar dieppaars.
    const sky = this.add.graphics().setDepth(0);
    const bands = 64;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0xffb347),
        Phaser.Display.Color.ValueToColor(0x2d1b4e),
        bands - 1,
        bands - 1 - i
      );
      sky.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      sky.fillRect(0, t * height, width, height / bands + 1);
    }

    // Laagstaande zon met gloed.
    const sunY = height * 0.62;
    this.add.image(width * 0.72, sunY, "glow").setScale(2.2).setDepth(1);
    const sun = this.add.graphics().setDepth(1);
    sun.fillStyle(0xffd97a, 1);
    sun.fillCircle(width * 0.72, sunY, 42);

    // Reuzenrad-silhouet.
    const wheel = this.add.graphics().setDepth(2);
    const cx = width * 0.24;
    const cy = height * 0.58;
    const radius = Math.min(width, height) * 0.17;
    wheel.lineStyle(5, 0x1a0f30, 1);
    wheel.strokeCircle(cx, cy, radius);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const gx = cx + Math.cos(angle) * radius;
      const gy = cy + Math.sin(angle) * radius;
      wheel.lineBetween(cx, cy, gx, gy);
      wheel.fillStyle(0x1a0f30, 1);
      wheel.fillRoundedRect(gx - 7, gy - 4, 14, 12, 4);
    }
    // Poten van het rad + grond.
    wheel.lineStyle(6, 0x1a0f30, 1);
    wheel.lineBetween(cx, cy, cx - radius * 0.7, height * 0.86);
    wheel.lineBetween(cx, cy, cx + radius * 0.7, height * 0.86);
    wheel.fillStyle(0x1a0f30, 1);
    wheel.fillRect(0, height * 0.85, width, height * 0.15);

    // Feestvlaggetjes bovenin.
    const flags = this.add.graphics().setDepth(2);
    const flagColors = [0xf94144, 0xf9c74f, 0x90be6d, 0xe879f9];
    flags.lineStyle(2, 0x1a0f30, 0.8);
    flags.beginPath();
    flags.moveTo(0, 54);
    flags.lineTo(width, 84);
    flags.strokePath();
    const flagCount = Math.ceil(width / 46);
    for (let i = 0; i < flagCount; i++) {
      const fx = i * 46 + 20;
      const fy = 54 + (fx / width) * 30;
      flags.fillStyle(flagColors[i % flagColors.length], 0.95);
      flags.fillTriangle(fx, fy, fx + 16, fy + 2, fx + 8, fy + 20);
    }
  }
}
