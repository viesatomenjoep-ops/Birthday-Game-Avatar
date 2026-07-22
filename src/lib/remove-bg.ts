/**
 * Snijdt de achtergrond van een portretfoto weg en geeft een transparante PNG.
 *
 * Prioriteit:
 *  1. Pixelcut  (PIXELCUT_API_KEY)  — aanbevolen, scherpe randen/haren
 *  2. remove.bg (REMOVE_BG_API_KEY) — alternatief
 *  3. Geen key  → originele foto (dev-fallback, geen uitsnijding)
 */
export async function removeBackground(file: File): Promise<Buffer> {
  const pixelcutKey = process.env.PIXELCUT_API_KEY;
  const removeBgKey = process.env.REMOVE_BG_API_KEY;

  if (pixelcutKey) {
    return removeWithPixelcut(file, pixelcutKey);
  }
  if (removeBgKey) {
    return removeWithRemoveBg(file, removeBgKey);
  }

  console.warn(
    "Geen background-removal key (PIXELCUT_API_KEY/REMOVE_BG_API_KEY) — originele foto wordt gebruikt."
  );
  return Buffer.from(await file.arrayBuffer());
}

/** Pixelcut Background Removal API — https://www.pixelcut.ai/api/background-remover */
async function removeWithPixelcut(file: File, apiKey: string): Promise<Buffer> {
  const form = new FormData();
  form.append("image", file);
  form.append("format", "png");

  const response = await fetch(
    "https://api.developer.pixelcut.ai/v1/remove-background",
    {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        // Binair PNG terugkrijgen i.p.v. een JSON result_url.
        Accept: "image/*",
      },
      body: form,
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Pixelcut achtergrond verwijderen mislukt (${response.status}): ${detail.slice(0, 300)}`
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

/** remove.bg API — https://www.remove.bg/api */
async function removeWithRemoveBg(file: File, apiKey: string): Promise<Buffer> {
  const form = new FormData();
  form.append("image_file", file);
  form.append("size", "auto");
  form.append("format", "png");
  form.append("type", "person");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `remove.bg achtergrond verwijderen mislukt (${response.status}): ${detail.slice(0, 300)}`
    );
  }

  return Buffer.from(await response.arrayBuffer());
}
