import Phaser from "phaser";
import { GAME_DURATION_MS, type GameConfig } from "../types";
import { drawFestivalBackground } from "../background";

/**
 * Gedeelde basis voor alle spellen: golden-hour achtergrond, avatar, HUD met
 * score + 25s-aftelklok, en het gemeenschappelijke einde (confetti + de HTML-
 * uitnodiging). Elk spel implementeert alleen `setupGame()` en `instruction()`.
 */
export abstract class BaseGameScene extends Phaser.Scene {
  protected config!: GameConfig;
  protected score = 0;
  protected remaining = GAME_DURATION_MS / 1000;
  protected finished = false;

  protected player?: Phaser.Physics.Arcade.Sprite;
  protected glow?: Phaser.GameObjects.Image;

  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private scorePill!: Phaser.GameObjects.Graphics;
  private timerPill!: Phaser.GameObjects.Graphics;
  private countdownTimer!: Phaser.Time.TimerEvent;
  private endTimer!: Phaser.Time.TimerEvent;

  create() {
    this.config = this.registry.get("gameConfig") as GameConfig;
    this.score = 0;
    this.remaining = GAME_DURATION_MS / 1000;
    this.finished = false;

    drawFestivalBackground(this);
    this.setupGame();
    this.createHud();
    this.startTimer();

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
    });
  }

  update(time: number, delta: number) {
    if (this.finished) return;
    if (this.glow && this.player) {
      this.glow.setPosition(this.player.x, this.player.y + 10);
    }
    this.updateGame(time, delta);
  }

  /** Elk spel bouwt hier zijn eigen mechaniek. */
  protected abstract setupGame(): void;

  /** Korte instructie onderin beeld. */
  protected abstract instruction(): string;

  /** Optionele per-frame logica per spel. */
  protected updateGame(_time: number, _delta: number): void {}

  /** Optionele opruiming bij het einde (bijv. physics pauzeren). */
  protected onFinishGame(): void {}

  // --- gedeelde helpers ---

  protected addScore(amount = 1) {
    this.score += amount;
    this.scoreText.setText(`🎁 ${this.score}`);
    this.redrawHudPills();
  }

  /** Avatar onderaan die je met touch sleept (vang-spellen). */
  protected createDraggableAvatar() {
    const { width, height } = this.scale;
    this.glow = this.add.image(width / 2, height - 120, "glow").setDepth(4);

    const player = this.physics.add
      .sprite(width / 2, height - 120, "avatar")
      .setDepth(5)
      .setCollideWorldBounds(true);
    this.playWalkAnim(player);

    const targetHeight = Math.min(height * 0.26, 230);
    const scaleFactor = targetHeight / player.height;
    player.setScale(scaleFactor);
    player.setTint(0xffe8cc);

    const bodyWidth = player.displayWidth * 1.6;
    const bodyHeight = player.displayHeight * 1.1;
    (player.body as Phaser.Physics.Arcade.Body)
      .setSize(bodyWidth / scaleFactor, bodyHeight / scaleFactor)
      .setOffset(
        (player.width - bodyWidth / scaleFactor) / 2,
        (player.height - bodyHeight / scaleFactor) / 2
      );

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && !this.finished && this.player) {
        this.player.x = Phaser.Math.Clamp(
          pointer.x,
          this.player.displayWidth / 2,
          this.scale.width - this.player.displayWidth / 2
        );
      }
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.finished && this.player) this.player.x = pointer.x;
    });

    this.player = player;
    return player;
  }

  /** Decoratieve, niet-bestuurbare avatar (tik-spellen). */
  protected createDecorAvatar(x: number, y: number, heightRatio = 0.18) {
    const { height } = this.scale;
    this.glow = this.add.image(x, y + 10, "glow").setScale(0.9).setDepth(4);
    const avatar = this.add.sprite(x, y, "avatar").setDepth(5).setTint(0xffe8cc);
    const targetHeight = Math.min(height * heightRatio, 190);
    avatar.setScale(targetHeight / avatar.height);
    this.playWalkAnim(avatar);
    // Zacht wiegen zodat de avatar "meeviert".
    this.tweens.add({
      targets: avatar,
      angle: { from: -4, to: 4 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    return avatar;
  }

  /** Start de 2-frame loopanimatie als het kostuum die heeft. */
  protected playWalkAnim(sprite: Phaser.GameObjects.Sprite) {
    if (this.anims.exists("avatar-walk")) {
      sprite.play("avatar-walk");
    }
  }

  private createHud() {
    const { width, height } = this.scale;

    // Score linksboven en klok rechtsboven, elk op een donkere pil zodat de
    // cijfers op elke achtergrond (zon, vlaggetjes) perfect leesbaar zijn.
    this.scorePill = this.add.graphics().setDepth(9);
    this.timerPill = this.add.graphics().setDepth(9);

    this.scoreText = this.add
      .text(26, 20, `🎁 ${this.score}`, hudStyle())
      .setOrigin(0, 0)
      .setDepth(10)
      .setResolution(2);

    this.timerText = this.add
      .text(width - 26, 20, `⏱ ${this.remaining}`, hudStyle())
      .setOrigin(1, 0)
      .setDepth(10)
      .setResolution(2);

    this.redrawHudPills();

    const instr = this.add
      .text(width / 2, height - 22, this.instruction(), {
        fontFamily: "system-ui, sans-serif",
        fontSize: "15px",
        fontStyle: "800",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: width - 48 },
      })
      .setOrigin(0.5, 1)
      .setDepth(10)
      .setResolution(2);
    const ip = this.add.graphics().setDepth(9);
    drawPillBehind(ip, instr, 14, 8, 0.55);
  }

  /** Tekent de donkere pillen strak achter de (veranderende) HUD-teksten. */
  private redrawHudPills() {
    drawPillBehind(this.scorePill, this.scoreText, 14, 8, 0.7);
    drawPillBehind(this.timerPill, this.timerText, 14, 8, 0.7);
  }

  private startTimer() {
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      repeat: this.remaining - 1,
      callback: () => {
        this.remaining = Math.max(0, this.remaining - 1);
        this.timerText.setText(`⏱ ${this.remaining}`);
        if (this.remaining <= 5) this.timerText.setColor("#ffd97a");
        this.redrawHudPills();
      },
    });
    this.endTimer = this.time.delayedCall(GAME_DURATION_MS, () =>
      this.finishGame()
    );
  }

  protected finishGame() {
    if (this.finished) return;
    this.finished = true;
    this.countdownTimer.remove();
    this.endTimer.remove();
    this.onFinishGame();

    if (this.player && this.glow) {
      this.tweens.add({
        targets: [this.player, this.glow],
        y: "-=30",
        duration: 400,
        ease: "Back.easeOut",
      });
    }

    this.time.delayedCall(400, () => {
      this.scene.launch("End");
      const onFinish = this.registry.get("onFinish") as (() => void) | undefined;
      onFinish?.();
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    this.scoreText?.setPosition(26, 20);
    this.timerText?.setPosition(gameSize.width - 26, 20);
    if (this.scoreText && this.timerText) this.redrawHudPills();
  }
}

function hudStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: "system-ui, sans-serif",
    fontSize: "24px",
    fontStyle: "900",
    color: "#ffffff",
  };
}

/** Donkere afgeronde pil strak achter een tekst-object. */
function drawPillBehind(
  g: Phaser.GameObjects.Graphics,
  text: Phaser.GameObjects.Text,
  padX: number,
  padY: number,
  alpha: number
) {
  const b = text.getBounds();
  g.clear();
  g.fillStyle(0x1a0f30, alpha);
  g.fillRoundedRect(
    b.x - padX,
    b.y - padY,
    b.width + padX * 2,
    b.height + padY * 2,
    (b.height + padY * 2) / 2
  );
}
