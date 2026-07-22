import Phaser from "phaser";

/**
 * Realistische, vloeiend bewegende avatar ("paper-doll rig"):
 * - Het échte gezicht van het kind (scherp, niet gepixeld) uit de uitgeknipte foto.
 * - Een soepel getekend lichaam uit losse delen (romp, armen, benen, cape) met
 *   zachte gradients en schaduw.
 * - Elk deel scharniert om schouder/heup en beweegt met sinus-rotaties op 60fps
 *   — een doorlopende, natuurlijke loopbeweging.
 */

type Source = HTMLImageElement | HTMLCanvasElement;
type Ctx = CanvasRenderingContext2D;

export const RIG_NATURAL_HEIGHT = 284;
export const RIG_NATURAL_WIDTH = 130;

type Palette = {
  top: string;
  bottom: string;
  sleeve: string;
  hand: string;
  leg: string;
  boot: string;
  emblem?: "star" | "bolt" | "dots";
  cape?: string;
  skirt?: boolean;
  accessory?: "tiara" | "headband" | "crown" | "partyhat" | "piratehat";
};

const PALETTES: Record<string, Palette> = {
  none: {
    top: "#4dabf7", bottom: "#2b6fc4", sleeve: "#4dabf7",
    hand: "#f2c9a0", leg: "#35507a", boot: "#f5f0e6",
  },
  heldin: {
    top: "#f8d254", bottom: "#c9920e", sleeve: "#e3b32b",
    hand: "#f2c9a0", leg: "#d9a825", boot: "#f6c445",
    emblem: "star", cape: "#d62828", accessory: "tiara",
  },
  held: {
    top: "#e9c23e", bottom: "#a87908", sleeve: "#c99b16",
    hand: "#f2c9a0", leg: "#8a6508", boot: "#e3b32b",
    emblem: "bolt", cape: "#1d3557", accessory: "headband",
  },
  prinses: {
    top: "#ff9ec4", bottom: "#ff77ad", sleeve: "#ffd9ec",
    hand: "#f2c9a0", leg: "#ffffff", boot: "#ff9ec4",
    skirt: true, accessory: "crown",
  },
  clown: {
    top: "#2e86de", bottom: "#1b5fae", sleeve: "#2e86de",
    hand: "#ffffff", leg: "#2e86de", boot: "#e63946",
    emblem: "dots", accessory: "partyhat",
  },
  piraat: {
    top: "#f5f0e6", bottom: "#7a1f1f", sleeve: "#7a1f1f",
    hand: "#f2c9a0", leg: "#3a2a1a", boot: "#1a120b",
    accessory: "piratehat",
  },
};

/** Bouwt alle rig-textures voor het gekozen kostuum. */
export function buildRigTextures(
  scene: Phaser.Scene,
  photo: Source,
  costumeId: string
) {
  const pal = PALETTES[costumeId] ?? PALETTES.none;

  const add = (key: string, canvas: HTMLCanvasElement) => {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, canvas);
  };

  add("rig-head", drawHead(photo, pal));
  add("rig-torso", drawTorso(pal));
  add("rig-arm", drawArm(pal));
  add("rig-leg", drawLeg(pal));
  if (pal.cape) add("rig-cape", drawCape(pal.cape));
  else if (scene.textures.exists("rig-cape")) scene.textures.remove("rig-cape");

  // Onzichtbare hitbox-texture voor de physics.
  if (!scene.textures.exists("hitbox")) {
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 32;
    scene.textures.addCanvas("hitbox", c);
  }
}

// ---------- tekenen van de delen (glad, met gradients) ----------

function makeCanvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return [c, ctx];
}

function capsule(ctx: Ctx, x: number, y: number, w: number, h: number, top: string, bottom: string) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, w / 2);
  ctx.fill();
}

/** Scherp, realistisch hoofd uit de foto, met accessoire erboven. */
function drawHead(photo: Source, pal: Palette): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(190, 230);
  const headArea = { x: 10, y: 46, size: 170 };

  const pw = "naturalWidth" in photo ? photo.naturalWidth || photo.width : photo.width;
  const ph = "naturalHeight" in photo ? photo.naturalHeight || photo.height : photo.height;

  let sx: number, sy: number, size: number;
  const b = findOpaqueBounds(photo, pw, ph);
  if (b && b.w > 8 && b.h > 8) {
    size = Math.min(b.w * 0.9, b.h * 0.6);
    sx = b.x + b.w / 2 - size / 2;
    sy = b.y + b.h * 0.01;
  } else {
    size = Math.min(pw, ph * 0.55);
    sx = (pw - size) / 2;
    sy = ph * 0.02;
  }
  sx = Math.max(0, Math.min(sx, pw - size));
  sy = Math.max(0, Math.min(sy, ph - size));

  ctx.drawImage(photo, sx, sy, size, size, headArea.x, headArea.y, headArea.size, headArea.size);

  // Onderrand zacht laten uitlopen richting de romp.
  const fade = ctx.createLinearGradient(0, headArea.y + headArea.size * 0.82, 0, headArea.y + headArea.size);
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(1, "rgba(0,0,0,1)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = fade;
  ctx.fillRect(0, headArea.y + headArea.size * 0.82, c.width, headArea.size * 0.18 + 1);
  ctx.globalCompositeOperation = "source-over";

  drawAccessory(ctx, pal.accessory, c.width / 2, headArea.y + 12);
  return c;
}

function drawAccessory(ctx: Ctx, kind: Palette["accessory"], cx: number, topY: number) {
  if (!kind) return;
  ctx.lineJoin = "round";
  switch (kind) {
    case "tiara": {
      ctx.fillStyle = "#f6c445";
      ctx.beginPath();
      ctx.roundRect(cx - 52, topY - 6, 104, 12, 6);
      ctx.fill();
      star(ctx, cx, topY - 14, 12, "#fff3b0");
      break;
    }
    case "headband": {
      ctx.fillStyle = "#f6c445";
      ctx.beginPath();
      ctx.roundRect(cx - 54, topY - 4, 108, 11, 6);
      ctx.fill();
      break;
    }
    case "crown": {
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.moveTo(cx - 44, topY + 4);
      ctx.lineTo(cx - 44, topY - 26);
      ctx.lineTo(cx - 22, topY - 8);
      ctx.lineTo(cx, topY - 32);
      ctx.lineTo(cx + 22, topY - 8);
      ctx.lineTo(cx + 44, topY - 26);
      ctx.lineTo(cx + 44, topY + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ff5d8f";
      ctx.beginPath();
      ctx.arc(cx, topY - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "partyhat": {
      ctx.fillStyle = "#e63946";
      ctx.beginPath();
      ctx.moveTo(cx - 24, topY + 2);
      ctx.lineTo(cx, topY - 40);
      ctx.lineTo(cx + 24, topY + 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(cx, topY - 40, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "piratehat": {
      ctx.fillStyle = "#1a120b";
      ctx.beginPath();
      ctx.ellipse(cx, topY + 2, 62, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, topY - 12, 40, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Doodshoofdje
      ctx.fillStyle = "#f5f0e6";
      ctx.beginPath();
      ctx.arc(cx, topY - 14, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}

function star(ctx: Ctx, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawTorso(pal: Palette): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(pal.skirt ? 150 : 100, 116);
  const w = c.width;

  if (pal.skirt) {
    // Lijfje + wijd uitlopende jurk
    const g = ctx.createLinearGradient(0, 0, 0, 116);
    g.addColorStop(0, pal.top);
    g.addColorStop(1, pal.bottom);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 32, 4);
    ctx.lineTo(w / 2 + 32, 4);
    ctx.lineTo(w / 2 + 70, 112);
    ctx.quadraticCurveTo(w / 2, 122, w / 2 - 70, 112);
    ctx.closePath();
    ctx.fill();
    // Glitters
    star(ctx, w / 2 - 26, 70, 6, "#fff3b0");
    star(ctx, w / 2 + 20, 92, 5, "#fff3b0");
    star(ctx, w / 2 + 4, 48, 4, "#ffffff");
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, 116);
    g.addColorStop(0, pal.top);
    g.addColorStop(1, pal.bottom);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(10, 2, 80, 112, 22);
    ctx.fill();
    // Glansstrook links
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.roundRect(16, 8, 16, 96, 10);
    ctx.fill();
  }

  // Embleem
  if (pal.emblem === "star") star(ctx, c.width / 2, 42, 16, "#fffbe6");
  if (pal.emblem === "bolt") {
    ctx.fillStyle = "#fffbe6";
    ctx.beginPath();
    ctx.moveTo(c.width / 2 + 8, 22);
    ctx.lineTo(c.width / 2 - 8, 50);
    ctx.lineTo(c.width / 2, 50);
    ctx.lineTo(c.width / 2 - 6, 72);
    ctx.lineTo(c.width / 2 + 12, 44);
    ctx.lineTo(c.width / 2 + 2, 44);
    ctx.closePath();
    ctx.fill();
  }
  if (pal.emblem === "dots") {
    const colors = ["#ff5d8f", "#ffd166", "#90be6d", "#ffffff"];
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(30 + (i % 2) * 40, 30 + Math.floor(i / 2) * 30, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return c;
}

function drawArm(pal: Palette): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(30, 92);
  capsule(ctx, 3, 2, 24, 72, pal.sleeve, shade(pal.sleeve, -18));
  // Hand
  ctx.fillStyle = pal.hand;
  ctx.beginPath();
  ctx.arc(15, 78, 11, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

function drawLeg(pal: Palette): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(34, 108);
  capsule(ctx, 4, 2, 26, 84, pal.leg, shade(pal.leg, -16));
  // Schoen/laars
  ctx.fillStyle = pal.boot;
  ctx.beginPath();
  ctx.roundRect(0, 82, 34, 22, 10);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.roundRect(4, 86, 12, 6, 3);
  ctx.fill();
  return c;
}

function drawCape(color: string): HTMLCanvasElement {
  const [c, ctx] = makeCanvas(110, 140);
  const g = ctx.createLinearGradient(0, 0, 0, 140);
  g.addColorStop(0, color);
  g.addColorStop(1, shade(color, -25));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(25, 2);
  ctx.lineTo(85, 2);
  ctx.quadraticCurveTo(108, 80, 96, 132);
  ctx.quadraticCurveTo(55, 142, 14, 132);
  ctx.quadraticCurveTo(2, 80, 25, 2);
  ctx.closePath();
  ctx.fill();
  return c;
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function findOpaqueBounds(
  photo: Source,
  pw: number,
  ph: number
): { x: number; y: number; w: number; h: number } | null {
  try {
    const scale = Math.min(1, 220 / Math.max(pw, ph));
    const w = Math.max(1, Math.round(pw * scale));
    const h = Math.max(1, Math.round(ph * scale));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const cx = c.getContext("2d")!;
    cx.drawImage(photo, 0, 0, w, h);
    const data = cx.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 24) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (!found) return null;
    if ((maxX - minX + 1) / w > 0.97 && (maxY - minY + 1) / h > 0.97) return null;
    const inv = 1 / scale;
    return { x: minX * inv, y: minY * inv, w: (maxX - minX + 1) * inv, h: (maxY - minY + 1) * inv };
  } catch {
    return null;
  }
}

// ---------- de rig zelf ----------

export class AvatarRig extends Phaser.GameObjects.Container {
  private headImg: Phaser.GameObjects.Image;
  private frontArm: Phaser.GameObjects.Image;
  private backArm: Phaser.GameObjects.Image;
  private frontLeg: Phaser.GameObjects.Image;
  private backLeg: Phaser.GameObjects.Image;
  private cape?: Phaser.GameObjects.Image;

  /** 1 = volle loopbeweging, ~0.4 = rustig deinen (decor), 0 = stil. */
  walkSpeed = 1;
  /** Verticale "bob" van de loopcyclus (natural units). */
  private bob = 0;
  /** Afstand van container-origin (schouderlijn) tot het visuele midden. */
  readonly centerOffset = 40;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    if (scene.textures.exists("rig-cape")) {
      this.cape = scene.add.image(0, -6, "rig-cape").setOrigin(0.5, 0.03);
      this.add(this.cape);
    }

    this.backArm = scene.add.image(-36, 2, "rig-arm").setOrigin(0.5, 0.07);
    this.backLeg = scene.add.image(-16, 88, "rig-leg").setOrigin(0.5, 0.06);
    this.frontLeg = scene.add.image(16, 88, "rig-leg").setOrigin(0.5, 0.06);
    const torso = scene.add.image(0, -6, "rig-torso").setOrigin(0.5, 0);
    this.frontArm = scene.add.image(36, 2, "rig-arm").setOrigin(0.5, 0.07);
    this.headImg = scene.add.image(0, 16, "rig-head").setOrigin(0.5, 1).setScale(0.62);

    this.add([this.backArm, this.backLeg, this.frontLeg, torso, this.frontArm, this.headImg]);
    scene.add.existing(this);
  }

  /** Roep elk frame aan: vloeiende loop-/deinbeweging. */
  tick(time: number) {
    const speed = this.walkSpeed;
    const t = (time / 150) * Math.max(speed, 0.001);
    const s = Math.sin(t) * speed;

    this.frontArm.rotation = 0.55 * s;
    this.backArm.rotation = -0.55 * s;
    this.frontLeg.rotation = -0.45 * s;
    this.backLeg.rotation = 0.45 * s;
    this.headImg.rotation = 0.05 * Math.sin(t * 0.9);
    if (this.cape) this.cape.rotation = 0.1 * Math.sin(t * 0.8) + 0.04;

    this.bob = -Math.abs(Math.cos(t)) * 4 * speed;
  }

  /** Positioneer de rig zó dat zijn visuele midden op (cx, cy) ligt. */
  syncToCenter(cx: number, cy: number) {
    this.setPosition(cx, cy - this.centerOffset * this.scaleY + this.bob * this.scaleY);
  }
}
