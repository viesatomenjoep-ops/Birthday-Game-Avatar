import Phaser from "phaser";
import type { GameConfig } from "../types";
import { buildRigTextures } from "../realisticAvatar";

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

    // Dynamische foto via externe Cloudinary/Supabase URL (CORS-safe). Het
    // uitgeknipte hoofd hieruit gaat straks op het kostuumlijf.
    this.load.crossOrigin = "anonymous";
    this.load.image("avatarPhoto", config.avatarUrl);

    // Als de foto niet laadt (bijv. offline), gebruiken we een fallback.
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      if (file.key === "avatarPhoto") {
        this.registry.set("avatarFailed", true);
      }
    });
  }

  create() {
    this.generateGiftTextures();
    this.generateSparkTexture();
    this.generateConfettiTextures();
    this.generateGlowTexture();
    this.generateBalloonTextures();
    this.generateStarTexture();
    this.generateCandleTextures();
    this.generateFlameTexture();
    this.generateObstacleTexture();
    this.generateCandyTexture();
    this.buildAvatar();
    // De React-laag bepaalt via het menu welk spel start; hier tonen we het
    // rustige Idle-decor als achtergrond voor dat menu.
    this.scene.start("Idle");
  }

  /**
   * Bouwt de realistische rig-textures: het scherpe gezicht uit de foto plus
   * de losse lichaamsdelen (romp, armen, benen, cape) van het gekozen kostuum.
   */
  private buildAvatar() {
    const config = this.registry.get("gameConfig") as GameConfig;
    const costume = config.costume ?? "none";
    const failed = Boolean(this.registry.get("avatarFailed"));

    let photo: HTMLImageElement | HTMLCanvasElement;
    if (failed || !this.textures.exists("avatarPhoto")) {
      const face = document.createElement("canvas");
      face.width = 128;
      face.height = 128;
      drawFallbackFace(face.getContext("2d")!, 128);
      photo = face;
    } else {
      photo = this.textures.get("avatarPhoto").getSourceImage() as
        | HTMLImageElement
        | HTMLCanvasElement;
    }

    buildRigTextures(this, photo, costume);
  }

  /** Ballonnen in vier feestkleuren met knoopje. */
  private generateBalloonTextures() {
    const colors = [0xf94144, 0xf3722c, 0x577590, 0x43aa8b];
    colors.forEach((color, index) => {
      const w = 64;
      const h = 86;
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(color, 1);
      g.fillEllipse(w / 2, h / 2 - 8, w - 8, h - 22);
      // Glans
      g.fillStyle(0xffffff, 0.3);
      g.fillEllipse(w / 2 - 10, h / 2 - 20, 12, 20);
      // Knoopje
      g.fillStyle(color, 1);
      g.fillTriangle(w / 2 - 6, h - 22, w / 2 + 6, h - 22, w / 2, h - 12);
      g.generateTexture(`balloon-${index}`, w, h);
      g.destroy();
    });
  }

  /** Grote gele vijfpuntige ster. */
  private generateStarTexture() {
    const size = 56;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const cx = size / 2;
    const cy = size / 2;
    const spikes = 5;
    const outer = size / 2 - 3;
    const inner = outer * 0.45;
    const points: Phaser.Geom.Point[] = [];
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      points.push(new Phaser.Geom.Point(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
    g.fillStyle(0xffd166, 1);
    g.fillPoints(points, true);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(cx - 6, cy - 6, 5);
    g.generateTexture("star", size, size);
    g.destroy();
  }

  /** Kaars (stokje met streepjes) — de vlam is een aparte sprite. */
  private generateCandleTextures() {
    const w = 16;
    const h = 44;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xfff0f5, 1);
    g.fillRoundedRect(2, 6, w - 4, h - 6, 4);
    g.fillStyle(0xff6fb5, 1);
    g.fillRect(2, 14, w - 4, 5);
    g.fillRect(2, 26, w - 4, 5);
    g.fillStyle(0x2d1b4e, 1);
    g.fillRect(w / 2 - 1, 0, 2, 8); // lont
    g.generateTexture("candle", w, h);
    g.destroy();
  }

  /** Vlammetje boven een kaars. */
  private generateFlameTexture() {
    const w = 18;
    const h = 26;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xff8c42, 1);
    g.fillEllipse(w / 2, h / 2 + 3, w - 2, h - 4);
    g.fillStyle(0xffd166, 1);
    g.fillEllipse(w / 2, h / 2 + 6, w - 8, h - 12);
    g.generateTexture("flame", w, h);
    g.destroy();
  }

  /** Hindernis voor het ren-spel (vrolijke paaltjes). */
  private generateObstacleTexture() {
    const w = 46;
    const h = 60;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x9b59b6, 1);
    g.fillRoundedRect(0, 0, w, h, 8);
    g.fillStyle(0xffffff, 0.85);
    for (let i = 0; i < 3; i++) {
      g.fillTriangle(4, 12 + i * 18, w - 4, 4 + i * 18, w - 4, 22 + i * 18);
    }
    g.generateTexture("obstacle", w, h);
    g.destroy();
  }

  /** Snoepje voor het ren-spel. */
  private generateCandyTexture() {
    const size = 36;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xff6fb5, 1);
    g.fillCircle(size / 2, size / 2, size / 2 - 8);
    // Wikkels
    g.fillTriangle(2, size / 2 - 8, 12, size / 2, 2, size / 2 + 8);
    g.fillTriangle(size - 2, size / 2 - 8, size - 12, size / 2, size - 2, size / 2 + 8);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(size / 2 - 4, size / 2 - 4, 4);
    g.generateTexture("candy", size, size);
    g.destroy();
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

}

/** Vrolijk smiley-gezicht op een canvas, als de externe foto niet laadt. */
function drawFallbackFace(ctx: CanvasRenderingContext2D, size: number) {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2d1b4e";
  ctx.beginPath();
  ctx.arc(size / 2 - 20, size / 2 - 10, 7, 0, Math.PI * 2);
  ctx.arc(size / 2 + 20, size / 2 - 10, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2d1b4e";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2 + 8, 26, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}
