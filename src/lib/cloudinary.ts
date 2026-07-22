import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is niet geconfigureerd (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET)."
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
}

/**
 * Upload een (transparante) PNG-buffer naar Cloudinary en geef een URL terug
 * die on-the-fly geoptimaliseerd wordt (f_auto/q_auto) voor mobiele browsers.
 */
export async function uploadAvatar(
  buffer: Buffer,
  slug: string
): Promise<string> {
  ensureConfigured();

  const result = await new Promise<{ public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "birthday-avatars",
        public_id: slug,
        resource_type: "image",
        format: "png",
        overwrite: true,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error("Cloudinary upload gaf geen resultaat."));
        } else {
          resolve(uploadResult);
        }
      }
    );
    stream.end(buffer);
  });

  // f_auto/q_auto: Cloudinary kiest zelf het lichtste formaat per browser.
  return cloudinary.url(result.public_id, {
    transformation: [
      { width: 512, crop: "limit" },
      { fetch_format: "auto", quality: "auto" },
    ],
    secure: true,
  });
}
