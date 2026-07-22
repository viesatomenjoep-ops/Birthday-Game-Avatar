/**
 * Bouwt een pixel-art "poppetje": het uitgeknipte (achtergrondloze) hoofd van
 * het kind, gepixeld, bovenop een pixel-art kostuumlijf (prinses/clown/piraat).
 *
 * Alles gebeurt op een klein canvas met imageSmoothing uit, zodat het een
 * echte pixel-art look krijgt. Het canvas wordt in Phaser als texture gebruikt.
 */

const W = 120;
const H = 180;

// Hoofd-vak boven op het lijf (groter = gezicht duidelijker zichtbaar).
const HEAD = { x: 26, y: 4, w: 68, h: 68 };

type Ctx = CanvasRenderingContext2D;
type Source = HTMLImageElement | HTMLCanvasElement;

/**
 * `phase` (0 of 1) is het loopframe: benen/armen wisselen van stand, zodat
 * Phaser er een bewegend poppetje van kan maken (2-frame walk-animatie).
 */
export function buildCostumeCanvas(
  photo: Source,
  costumeId: string,
  phase = 0
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  const costume = COSTUME_DRAWERS[costumeId];

  costume?.behindHead?.(ctx, phase);
  costume?.body?.(ctx, phase);
  drawPixelatedHead(ctx, photo);
  costume?.overHead?.(ctx, phase);

  return canvas;
}

/** Heeft dit kostuum animatieframes? */
export function isAnimatable(costumeId: string): boolean {
  return costumeId in COSTUME_DRAWERS;
}

/** Knipt het hoofd strak uit de foto en tekent het gepixeld op het lijf. */
function drawPixelatedHead(ctx: Ctx, photo: Source) {
  const pw = "naturalWidth" in photo ? photo.naturalWidth || photo.width : photo.width;
  const ph = "naturalHeight" in photo ? photo.naturalHeight || photo.height : photo.height;

  let sx: number;
  let sy: number;
  let size: number;

  // Baseer de uitsnede op waar het kind écht staat (de niet-transparante
  // pixels van de uitgeknipte foto), zodat de transparante randen niet
  // meetellen en het gezicht het vak vult.
  const bounds = findOpaqueBounds(photo, pw, ph);
  if (bounds && bounds.w > 8 && bounds.h > 8) {
    // Hoofd zit bovenaan: strak vierkant rond het bovenste deel van de persoon.
    size = Math.min(bounds.w * 0.86, bounds.h * 0.62);
    const cx = bounds.x + bounds.w / 2;
    sx = cx - size / 2;
    sy = bounds.y + bounds.h * 0.02;
  } else {
    // Fallback (geen transparantie): midden-boven van de foto.
    size = Math.min(pw, ph * 0.58);
    sx = (pw - size) / 2;
    sy = ph * 0.02;
  }

  // Binnen de fotogrenzen houden.
  sx = Math.max(0, Math.min(sx, pw - size));
  sy = Math.max(0, Math.min(sy, ph - size));

  // Downscale naar een pixelraster en weer omhoog = pixel-art gezicht.
  const grid = 40;
  const small = document.createElement("canvas");
  small.width = grid;
  small.height = grid;
  const sctx = small.getContext("2d")!;
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(photo, sx, sy, size, size, 0, 0, grid, grid);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, grid, grid, HEAD.x, HEAD.y, HEAD.w, HEAD.h);
}

/** Bounding box van de niet-transparante pixels (op een verkleinde kopie). */
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

    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    let found = false;
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
    // Als vrijwel de hele foto opaak is, is er geen zinvolle bounding box.
    if ((maxX - minX + 1) / w > 0.97 && (maxY - minY + 1) / h > 0.97) return null;

    const inv = 1 / scale;
    return {
      x: minX * inv,
      y: minY * inv,
      w: (maxX - minX + 1) * inv,
      h: (maxY - minY + 1) * inv,
    };
  } catch {
    // Getainte canvas (CORS) o.i.d. — val terug op de vaste uitsnede.
    return null;
  }
}

// --- pixel-helper ---
function px(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

const NECK_Y = HEAD.y + HEAD.h - 4; // ~54

type Drawer = {
  behindHead?: (ctx: Ctx, phase: number) => void;
  body?: (ctx: Ctx, phase: number) => void;
  overHead?: (ctx: Ctx, phase: number) => void;
};

const COSTUME_DRAWERS: Record<string, Drawer> = {
  prinses: {
    body(ctx, phase) {
      const sway = phase ? 3 : -3; // jurk wiegt zachtjes heen en weer
      // Armen
      px(ctx, 26, NECK_Y + 8 + (phase ? 2 : 0), 12, 34, "#ffd9b3");
      px(ctx, 82, NECK_Y + 8 + (phase ? 0 : 2), 12, 34, "#ffd9b3");
      // Lijfje
      px(ctx, 44, NECK_Y, 32, 26, "#ff9ec4");
      px(ctx, 44, NECK_Y, 32, 6, "#ffffff");
      // Wijd uitlopende jurk (pixel-trap) met sway in de onderste rijen
      for (let i = 0; i < 6; i++) {
        const w = 34 + i * 10;
        const shift = i >= 3 ? sway * ((i - 2) / 3) : 0;
        px(ctx, W / 2 - w / 2 + shift, NECK_Y + 26 + i * 12, w, 13, "#ff77ad");
      }
      // Glitters
      px(ctx, 52, NECK_Y + 40, 4, 4, "#fff3b0");
      px(ctx, 66, NECK_Y + 58, 4, 4, "#fff3b0");
      px(ctx, 44 + sway, NECK_Y + 72, 4, 4, "#fff3b0");
    },
    overHead(ctx) {
      // Kroon (breed over het hele hoofd)
      px(ctx, HEAD.x + 8, HEAD.y - 10, 52, 8, "#ffd166");
      px(ctx, HEAD.x + 8, HEAD.y - 18, 7, 10, "#ffd166");
      px(ctx, HEAD.x + 30, HEAD.y - 21, 7, 13, "#ffd166");
      px(ctx, HEAD.x + 53, HEAD.y - 18, 7, 10, "#ffd166");
      px(ctx, HEAD.x + 31, HEAD.y - 16, 5, 5, "#ff5d8f");
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
    body(ctx, phase) {
      const la = phase ? 4 : 0; // linkerarm/been omhoog in frame 1
      const ra = phase ? 0 : 4;
      // Armen (wisselen per loopframe)
      px(ctx, 24, NECK_Y + 10 - la, 12, 34, "#2e86de");
      px(ctx, 84, NECK_Y + 10 - ra, 12, 34, "#2e86de");
      px(ctx, 24, NECK_Y + 40 - la, 12, 8, "#ffffff"); // handschoen
      px(ctx, 84, NECK_Y + 40 - ra, 12, 8, "#ffffff");
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
      // Benen + grote schoenen (loopstand wisselt)
      px(ctx, 44, NECK_Y + 66 - la, 14, 36, "#2e86de");
      px(ctx, 62, NECK_Y + 66 - ra, 14, 36, "#2e86de");
      px(ctx, 38, NECK_Y + 98 - la, 22, 10, "#e63946");
      px(ctx, 60, NECK_Y + 98 - ra, 22, 10, "#e63946");
    },
    overHead(ctx) {
      // Klein puntmutsje (gecentreerd op het hoofd)
      px(ctx, HEAD.x + 26, HEAD.y - 12, 16, 8, "#e63946");
      px(ctx, HEAD.x + 31, HEAD.y - 18, 6, 8, "#e63946");
      px(ctx, HEAD.x + 32, HEAD.y - 20, 4, 4, "#ffd166");
    },
  },

  piraat: {
    body(ctx, phase) {
      const la = phase ? 4 : 0;
      const ra = phase ? 0 : 4;
      // Armen
      px(ctx, 26, NECK_Y + 8 - la, 12, 34, "#6b3f2b");
      px(ctx, 82, NECK_Y + 8 - ra, 12, 34, "#6b3f2b");
      // Wit hemd
      px(ctx, 44, NECK_Y, 32, 30, "#f5f0e6");
      // Jas
      px(ctx, 40, NECK_Y + 6, 10, 56, "#7a1f1f");
      px(ctx, 70, NECK_Y + 6, 10, 56, "#7a1f1f");
      // Riem + gesp
      px(ctx, 40, NECK_Y + 34, 40, 8, "#3a2a1a");
      px(ctx, 56, NECK_Y + 34, 8, 8, "#ffd166");
      // Benen + laarzen (loopstand wisselt)
      px(ctx, 46, NECK_Y + 62 - la, 12, 34, "#3a2a1a");
      px(ctx, 62, NECK_Y + 62 - ra, 12, 34, "#3a2a1a");
      px(ctx, 42, NECK_Y + 90 - la, 18, 10, "#1a120b");
      px(ctx, 60, NECK_Y + 90 - ra, 18, 10, "#1a120b");
    },
    overHead(ctx) {
      // Piratenhoed (breder dan het hoofd)
      px(ctx, HEAD.x - 4, HEAD.y - 8, 76, 10, "#1a120b");
      px(ctx, HEAD.x + 12, HEAD.y - 16, 44, 10, "#1a120b");
      // Doodshoofd
      px(ctx, HEAD.x + 30, HEAD.y - 14, 8, 6, "#f5f0e6");
      px(ctx, HEAD.x + 31, HEAD.y - 8, 6, 3, "#f5f0e6");
    },
  },

  // Originele gouden superheldin (goud harnas + rode cape + ster) — eigen
  // ontwerp, géén bestaand merkpersonage.
  heldin: {
    behindHead(ctx, phase) {
      // Rode cape die zachtjes wappert
      const flare = phase ? 8 : 2;
      px(ctx, 30 - flare, NECK_Y - 2, 12 + flare, 92, "#c1121f");
      px(ctx, 78, NECK_Y - 2, 12 + flare, 92, "#c1121f");
      px(ctx, 34, NECK_Y - 4, 52, 90, "#e5383b");
      // Lang donker haar naast het hoofd
      px(ctx, HEAD.x - 10, HEAD.y + 8, 12, 44, "#3a2a1a");
      px(ctx, HEAD.x + HEAD.w - 2, HEAD.y + 8, 12, 44, "#3a2a1a");
    },
    body(ctx, phase) {
      const la = phase ? 4 : 0;
      const ra = phase ? 0 : 4;
      // Armen: goud met polsbanden
      px(ctx, 26, NECK_Y + 6 - la, 12, 34, "#d4a017");
      px(ctx, 82, NECK_Y + 6 - ra, 12, 34, "#d4a017");
      px(ctx, 26, NECK_Y + 32 - la, 12, 8, "#f6c445");
      px(ctx, 82, NECK_Y + 32 - ra, 12, 8, "#f6c445");
      // Gouden harnas-torso met glans
      px(ctx, 42, NECK_Y, 36, 40, "#d4a017");
      px(ctx, 44, NECK_Y + 2, 10, 30, "#f6c445"); // glansstrook
      // Ster-embleem op de borst
      px(ctx, 56, NECK_Y + 10, 8, 8, "#fff3b0");
      px(ctx, 58, NECK_Y + 6, 4, 4, "#fff3b0");
      px(ctx, 52, NECK_Y + 14, 4, 4, "#fff3b0");
      px(ctx, 64, NECK_Y + 14, 4, 4, "#fff3b0");
      // Rode gordel
      px(ctx, 42, NECK_Y + 40, 36, 8, "#c1121f");
      px(ctx, 56, NECK_Y + 40, 8, 8, "#f6c445");
      // Benen: goud, loopstand wisselt
      px(ctx, 46, NECK_Y + 48 - la, 12, 40, "#d4a017");
      px(ctx, 62, NECK_Y + 48 - ra, 12, 40, "#d4a017");
      // Gouden laarzen
      px(ctx, 42, NECK_Y + 84 - la, 18, 12, "#f6c445");
      px(ctx, 60, NECK_Y + 84 - ra, 18, 12, "#f6c445");
    },
    overHead(ctx) {
      // Gouden tiara met ster
      px(ctx, HEAD.x + 6, HEAD.y - 8, 56, 8, "#f6c445");
      px(ctx, HEAD.x + 30, HEAD.y - 14, 8, 8, "#fff3b0");
    },
  },

  // Mannelijke gouden actieheld — bredere schouders, blauwe cape.
  held: {
    behindHead(ctx, phase) {
      const flare = phase ? 8 : 2;
      px(ctx, 26 - flare, NECK_Y - 2, 14 + flare, 90, "#1d3557");
      px(ctx, 80, NECK_Y - 2, 14 + flare, 90, "#1d3557");
      px(ctx, 32, NECK_Y - 4, 56, 88, "#2b4d7e");
    },
    body(ctx, phase) {
      const la = phase ? 4 : 0;
      const ra = phase ? 0 : 4;
      // Brede schouderplaten
      px(ctx, 30, NECK_Y - 2, 20, 12, "#f6c445");
      px(ctx, 70, NECK_Y - 2, 20, 12, "#f6c445");
      // Armen: goud met vuisten
      px(ctx, 24, NECK_Y + 8 - la, 14, 34, "#d4a017");
      px(ctx, 82, NECK_Y + 8 - ra, 14, 34, "#d4a017");
      px(ctx, 24, NECK_Y + 38 - la, 14, 8, "#b8860b");
      px(ctx, 82, NECK_Y + 38 - ra, 14, 8, "#b8860b");
      // Gouden harnas-torso (breder)
      px(ctx, 40, NECK_Y, 40, 42, "#d4a017");
      px(ctx, 42, NECK_Y + 2, 10, 32, "#f6c445");
      // Bliksem-embleem
      px(ctx, 58, NECK_Y + 6, 6, 10, "#fff3b0");
      px(ctx, 54, NECK_Y + 14, 6, 10, "#fff3b0");
      px(ctx, 60, NECK_Y + 22, 6, 10, "#fff3b0");
      // Donkere gordel
      px(ctx, 40, NECK_Y + 42, 40, 8, "#1d3557");
      px(ctx, 56, NECK_Y + 42, 8, 8, "#f6c445");
      // Benen: donkergoud, loopstand wisselt
      px(ctx, 44, NECK_Y + 50 - la, 14, 38, "#b8860b");
      px(ctx, 62, NECK_Y + 50 - ra, 14, 38, "#b8860b");
      // Laarzen
      px(ctx, 40, NECK_Y + 84 - la, 20, 12, "#f6c445");
      px(ctx, 60, NECK_Y + 84 - ra, 20, 12, "#f6c445");
    },
    overHead(ctx) {
      // Gouden hoofdband
      px(ctx, HEAD.x + 4, HEAD.y - 6, 60, 7, "#f6c445");
    },
  },
};

export { W as COSTUME_W, H as COSTUME_H };
