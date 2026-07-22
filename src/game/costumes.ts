/**
 * Bouwt een pixel-art "poppetje": het uitgeknipte (achtergrondloze) hoofd van
 * het kind, gepixeld, bovenop een pixel-art kostuumlijf (prinses/clown/piraat).
 *
 * Alles gebeurt op een klein canvas met imageSmoothing uit, zodat het een
 * echte pixel-art look krijgt. Het canvas wordt in Phaser als texture gebruikt.
 */

const W = 120;
const H = 180;

// Hoofd-vak boven op het lijf.
const HEAD = { x: 34, y: 6, w: 52, h: 52 };

type Ctx = CanvasRenderingContext2D;
type Source = HTMLImageElement | HTMLCanvasElement;

export function buildCostumeCanvas(
  photo: Source,
  costumeId: string
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  const costume = COSTUME_DRAWERS[costumeId];

  costume?.behindHead?.(ctx);
  costume?.body?.(ctx);
  drawPixelatedHead(ctx, photo);
  costume?.overHead?.(ctx);

  return canvas;
}

/** Knipt het hoofd uit de foto (boven-midden) en tekent het gepixeld. */
function drawPixelatedHead(ctx: Ctx, photo: Source) {
  const pw = "naturalWidth" in photo ? photo.naturalWidth || photo.width : photo.width;
  const ph = "naturalHeight" in photo ? photo.naturalHeight || photo.height : photo.height;

  // Vierkante uitsnede rond het gezicht: midden-boven van de portretfoto.
  const size = Math.min(pw, ph * 0.62);
  const sx = (pw - size) / 2;
  const sy = ph * 0.02;

  // Downscale naar een pixelraster en weer omhoog = pixel-art gezicht.
  const grid = 30;
  const small = document.createElement("canvas");
  small.width = grid;
  small.height = grid;
  const sctx = small.getContext("2d")!;
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(photo, sx, sy, size, size, 0, 0, grid, grid);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, grid, grid, HEAD.x, HEAD.y, HEAD.w, HEAD.h);
}

// --- pixel-helper ---
function px(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

const NECK_Y = HEAD.y + HEAD.h - 4; // ~54

type Drawer = {
  behindHead?: (ctx: Ctx) => void;
  body?: (ctx: Ctx) => void;
  overHead?: (ctx: Ctx) => void;
};

const COSTUME_DRAWERS: Record<string, Drawer> = {
  prinses: {
    body(ctx) {
      // Armen
      px(ctx, 26, NECK_Y + 8, 12, 34, "#ffd9b3");
      px(ctx, 82, NECK_Y + 8, 12, 34, "#ffd9b3");
      // Lijfje
      px(ctx, 44, NECK_Y, 32, 26, "#ff9ec4");
      px(ctx, 44, NECK_Y, 32, 6, "#ffffff");
      // Wijd uitlopende jurk (pixel-trap)
      for (let i = 0; i < 6; i++) {
        const w = 34 + i * 10;
        px(ctx, W / 2 - w / 2, NECK_Y + 26 + i * 12, w, 13, "#ff77ad");
      }
      // Glitters
      px(ctx, 52, NECK_Y + 40, 4, 4, "#fff3b0");
      px(ctx, 66, NECK_Y + 58, 4, 4, "#fff3b0");
      px(ctx, 44, NECK_Y + 72, 4, 4, "#fff3b0");
    },
    overHead(ctx) {
      // Kroon
      px(ctx, HEAD.x + 6, HEAD.y - 10, 40, 8, "#ffd166");
      px(ctx, HEAD.x + 6, HEAD.y - 18, 6, 10, "#ffd166");
      px(ctx, HEAD.x + 23, HEAD.y - 20, 6, 12, "#ffd166");
      px(ctx, HEAD.x + 40, HEAD.y - 18, 6, 10, "#ffd166");
      px(ctx, HEAD.x + 24, HEAD.y - 16, 4, 4, "#ff5d8f");
    },
  },

  clown: {
    behindHead(ctx) {
      // Oranje pruik-plukken naast het hoofd
      px(ctx, HEAD.x - 14, HEAD.y + 10, 16, 22, "#ff7b29");
      px(ctx, HEAD.x + HEAD.w - 2, HEAD.y + 10, 16, 22, "#ff7b29");
      px(ctx, HEAD.x - 8, HEAD.y + 4, 12, 14, "#ff9c4a");
      px(ctx, HEAD.x + HEAD.w - 4, HEAD.y + 4, 12, 14, "#ff9c4a");
    },
    body(ctx) {
      // Armen
      px(ctx, 24, NECK_Y + 10, 12, 34, "#2e86de");
      px(ctx, 84, NECK_Y + 10, 12, 34, "#2e86de");
      px(ctx, 24, NECK_Y + 40, 12, 8, "#ffffff"); // handschoen
      px(ctx, 84, NECK_Y + 40, 12, 8, "#ffffff");
      // Ruchekraag
      for (let i = 0; i < 6; i++) {
        px(ctx, 38 + i * 8, NECK_Y - 2, 8, 8, i % 2 ? "#ffd166" : "#ff5d8f");
      }
      // Jumpsuit
      px(ctx, 40, NECK_Y + 6, 40, 60, "#2e86de");
      // Stippen
      const dots = ["#ff5d8f", "#ffd166", "#90be6d"];
      for (let i = 0; i < 6; i++) {
        px(ctx, 46 + (i % 3) * 12, NECK_Y + 14 + Math.floor(i / 3) * 22, 8, 8, dots[i % 3]);
      }
      // Benen + grote schoenen
      px(ctx, 44, NECK_Y + 66, 14, 36, "#2e86de");
      px(ctx, 62, NECK_Y + 66, 14, 36, "#2e86de");
      px(ctx, 38, NECK_Y + 98, 22, 10, "#e63946");
      px(ctx, 60, NECK_Y + 98, 22, 10, "#e63946");
    },
    overHead(ctx) {
      // Klein puntmutsje
      px(ctx, HEAD.x + 18, HEAD.y - 12, 16, 8, "#e63946");
      px(ctx, HEAD.x + 23, HEAD.y - 18, 6, 8, "#e63946");
      px(ctx, HEAD.x + 24, HEAD.y - 20, 4, 4, "#ffd166");
    },
  },

  piraat: {
    body(ctx) {
      // Armen
      px(ctx, 26, NECK_Y + 8, 12, 34, "#6b3f2b");
      px(ctx, 82, NECK_Y + 8, 12, 34, "#6b3f2b");
      // Wit hemd
      px(ctx, 44, NECK_Y, 32, 30, "#f5f0e6");
      // Jas
      px(ctx, 40, NECK_Y + 6, 10, 56, "#7a1f1f");
      px(ctx, 70, NECK_Y + 6, 10, 56, "#7a1f1f");
      // Riem + gesp
      px(ctx, 40, NECK_Y + 34, 40, 8, "#3a2a1a");
      px(ctx, 56, NECK_Y + 34, 8, 8, "#ffd166");
      // Benen + laarzen
      px(ctx, 46, NECK_Y + 62, 12, 34, "#3a2a1a");
      px(ctx, 62, NECK_Y + 62, 12, 34, "#3a2a1a");
      px(ctx, 42, NECK_Y + 90, 18, 10, "#1a120b");
      px(ctx, 60, NECK_Y + 90, 18, 10, "#1a120b");
    },
    overHead(ctx) {
      // Piratenhoed
      px(ctx, HEAD.x - 6, HEAD.y - 8, 64, 10, "#1a120b");
      px(ctx, HEAD.x + 6, HEAD.y - 16, 40, 10, "#1a120b");
      // Doodshoofd
      px(ctx, HEAD.x + 22, HEAD.y - 14, 8, 6, "#f5f0e6");
      px(ctx, HEAD.x + 23, HEAD.y - 8, 6, 3, "#f5f0e6");
    },
  },
};

export { W as COSTUME_W, H as COSTUME_H };
