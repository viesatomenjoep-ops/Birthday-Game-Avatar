import Phaser from "phaser";
import type { GameConfig } from "../types";

/**
 * Laadt de dynamische avatar (Cloudinary) en genereert alle overige textures
 * programmatisch — geen externe assets, dus vrijwel geen laadtijd op mobiel.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  preload() {
    const config = this.registry.get("gameConfig") as GameConfig;

    // Dynamische avatar via externe Cloudinary/Supabase URL (CORS-safe).
    this.load.crossOrigin = "anonymous";
    this.load.image("avatar", config.avatarUrl);

    // Als de avatar niet laadt (bijv. offline), gebruiken we een fallback.
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      if (file.key === "avatar") {
        this.registry.set("avatarFailed", true);
      }
    });
  }

  create() {
    this.generateGiftTextures();
    this.generateSparkTexture();
    this.generateConfettiTextures();
    this.generateGlowTexture();
    if (this.registry.get("avatarFailed")) {
      this.generateFallbackAvatar();
    }
    this.scene.start("Game");
  }

  /** Drie cadeau-varianten met lint, strik en golden-hour glans. */
  private generateGiftTextures() {
    const variants = [
      { box: 0xe74c3c, ribbon: 0xf9e79f },
      { box: 0x3498db, ribbon: 0xf5b7b1 },
      { box: 0x9b59b6, ribbon: 0xa9dfbf },
    ];

    variants.forEach((variant, index) => {
      const size = 72;
      const g = this.make.graphics({ x: 0, y: 0 }, false);

      // Doos met subtiele schaduwkant voor diepte
      g.fillStyle(variant.box, 1);
      g.fillRoundedRect(4, 18, size - 8, size - 22, 8);
      g.fillStyle(0x000000, 0.15);
      g.fillRoundedRect(size / 2, 18, size / 2 - 4, size - 22, {
        tl: 0, tr: 8, bl: 0, br: 8,
      });

      // Warme glans linksboven (golden hour belichting)
      g.fillStyle(0xffffff, 0.25);
      g.fillRoundedRect(8, 22, 18, 10, 5);

      // Verticaal lint
      g.fillStyle(variant.ribbon, 1);
      g.fillRect(size / 2 - 6, 18, 12, size - 22);

      // Deksel
      g.fillStyle(variant.box, 1);
      g.fillRoundedRect(0, 12, size, 14, 6);
      g.fillStyle(0xffffff, 0.2);
      g.fillRoundedRect(0, 12, size, 5, 4);
      g.fillStyle(variant.ribbon, 1);
      g.fillRect(size / 2 - 7, 12, 14, 14);

      // Strik
      g.fillStyle(variant.ribbon, 1);
      g.fillEllipse(size / 2 - 10, 8, 16, 11);
      g.fillEllipse(size / 2 + 10, 8, 16, 11);
      g.fillCircle(size / 2, 9, 5);

      g.generateTexture(`gift-${index}`, size, size);
      g.destroy();
    });
  }

  /** Glitter/vonk-particle voor het vangeffect. */
  private generateSparkTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xfff3b0, 1);
    // Vierpuntige ster
    g.fillPoints(
      [
        new Phaser.Geom.Point(8, 0),
        new Phaser.Geom.Point(10, 6),
        new Phaser.Geom.Point(16, 8),
        new Phaser.Geom.Point(10, 10),
        new Phaser.Geom.Point(8, 16),
        new Phaser.Geom.Point(6, 10),
        new Phaser.Geom.Point(0, 8),
        new Phaser.Geom.Point(6, 6),
      ],
      true
    );
    g.generateTexture("spark", 16, 16);
    g.destroy();
  }

  /** Rechthoekige confettisnippers in feestkleuren. */
  private generateConfettiTextures() {
    const colors = [0xf94144, 0xf3722c, 0xf9c74f, 0x90be6d, 0x577590, 0xe879f9];
    colors.forEach((color, index) => {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(color, 1);
      g.fillRect(0, 0, 10, 14);
      g.generateTexture(`confetti-${index}`, 10, 14);
      g.destroy();
    });
  }

  /** Zachte warme gloed die achter de avatar hangt (integratie met belichting). */
  private generateGlowTexture() {
    const size = 256;
    const canvas = this.textures.createCanvas("glow", size, size);
    if (!canvas) return;
    const context = canvas.getContext();
    const gradient = context.createRadialGradient(
      size / 2, size / 2, 10,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, "rgba(255, 200, 120, 0.55)");
    gradient.addColorStop(0.6, "rgba(255, 160, 80, 0.18)");
    gradient.addColorStop(1, "rgba(255, 160, 80, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    canvas.refresh();
  }

  /** Vrolijke fallback-avatar als de externe afbeelding niet laadt. */
  private generateFallbackAvatar() {
    const size = 128;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffd166, 1);
    g.fillCircle(size / 2, size / 2, size / 2 - 4);
    g.fillStyle(0x2d1b4e, 1);
    g.fillCircle(size / 2 - 20, size / 2 - 10, 7);
    g.fillCircle(size / 2 + 20, size / 2 - 10, 7);
    g.lineStyle(6, 0x2d1b4e, 1);
    g.beginPath();
    g.arc(size / 2, size / 2 + 8, 26, 0.15 * Math.PI, 0.85 * Math.PI);
    g.strokePath();
    g.generateTexture("avatar", size, size);
    g.destroy();
  }
}
