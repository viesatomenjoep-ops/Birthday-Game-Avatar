/**
 * Stuurt een portretfoto naar remove.bg en geeft een transparante PNG terug.
 * Zonder REMOVE_BG_API_KEY (lokale dev) wordt de originele foto teruggegeven,
 * zodat de flow end-to-end testbaar blijft.
 */
export async function removeBackground(file: File): Promise<Buffer> {
  const apiKey = process.env.REMOVE_BG_API_KEY;

  if (!apiKey) {
    console.warn(
      "REMOVE_BG_API_KEY ontbreekt — originele foto wordt gebruikt (dev-fallback)."
    );
    return Buffer.from(await file.arrayBuffer());
  }

  const form = new FormData();
  form.append("image_file", file);
  form.append("size", "auto");
  form.append("format", "png");
  // Portret-modus: remove.bg focust op het gezicht/persoon.
  form.append("type", "person");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Achtergrond verwijderen mislukt (${response.status}): ${detail.slice(0, 300)}`
    );
  }

  return Buffer.from(await response.arrayBuffer());
}
