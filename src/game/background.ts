import Phaser from "phaser";

/**
 * Gedeelde golden-hour pretpark-achtergrond: lucht met zonsondergang, zon,
 * reuzenrad-silhouet en feestvlaggetjes. Gebruikt door alle spel-scenes en het
 * menu, zodat alles als één geheel aanvoelt.
 */
export function drawFestivalBackground(scene: Phaser.Scene) {
  const { width, height } = scene.scale;

  // Lucht: verticale gradient van warm goud naar dieppaars.
  const sky = scene.add.graphics().setDepth(0);
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
  scene.add.image(width * 0.72, sunY, "glow").setScale(2.2).setDepth(1);
  const sun = scene.add.graphics().setDepth(1);
  sun.fillStyle(0xffd97a, 1);
  sun.fillCircle(width * 0.72, sunY, 42);

  // Reuzenrad-silhouet.
  const wheel = scene.add.graphics().setDepth(2);
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
  wheel.lineStyle(6, 0x1a0f30, 1);
  wheel.lineBetween(cx, cy, cx - radius * 0.7, height * 0.86);
  wheel.lineBetween(cx, cy, cx + radius * 0.7, height * 0.86);
  wheel.fillStyle(0x1a0f30, 1);
  wheel.fillRect(0, height * 0.85, width, height * 0.15);

  // Feestvlaggetjes bovenin.
  const flags = scene.add.graphics().setDepth(2);
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
