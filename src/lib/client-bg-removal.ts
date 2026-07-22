/**
 * Verwijdert de achtergrond van een foto volledig GRATIS in de browser met
 * @imgly/background-removal (WASM + ONNX, geen API-key, geen serverkosten).
 * Geeft een transparante PNG terug, verkleind voor snelle upload.
 *
 * De library wordt op het moment van gebruik van een CDN geladen (niet
 * meegebundeld), zodat de zware WASM/ESM-assets de Next-build niet breken.
 */

const IMGLY_CDN = "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm";

type RemoveBg = (
  input: File | Blob | string,
  config?: {
    output?: { format?: string; quality?: number };
    progress?: (key: string, current: number, total: number) => void;
  }
) => Promise<Blob>;

let cached: RemoveBg | null = null;

async function loadRemover(): Promise<RemoveBg> {
  if (cached) return cached;
  const mod = (await import(/* webpackIgnore: true */ IMGLY_CDN)) as {
    removeBackground: RemoveBg;
  };
  cached = mod.removeBackground;
  return cached;
}

export async function removeBackgroundClient(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<File> {
  const removeBackground = await loadRemover();

  const blob = await removeBackground(file, {
    output: { format: "image/png", quality: 0.9 },
    progress: (_key, current, total) => {
      if (onProgress && total > 0) onProgress(current / total);
    },
  });

  const resized = await resizePng(blob, 768);
  return new File([resized], "avatar.png", { type: "image/png" });
}

/** Schaalt een (transparante) PNG-blob naar een maximale zijde, behoud verhouding. */
async function resizePng(blob: Blob, maxSize: number): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (out) => (out ? resolve(out) : reject(new Error("Canvas toBlob faalde"))),
      "image/png"
    );
  });
}
