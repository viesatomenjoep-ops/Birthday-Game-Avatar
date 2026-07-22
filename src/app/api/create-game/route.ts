import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { uploadAvatar } from "@/lib/cloudinary";
import { removeBackground } from "@/lib/remove-bg";
import { generateSlug } from "@/lib/slug";

export const runtime = "nodejs";
export const maxDuration = 60; // remove.bg + Cloudinary kunnen samen ~10-20s duren

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

type FieldErrors = Record<string, string>;

function validateFields(formData: FormData): {
  errors: FieldErrors;
  values: { childName: string; age: number; partyDate: string; partyTime: string };
} {
  const errors: FieldErrors = {};
  const childName = String(formData.get("childName") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const partyDate = String(formData.get("partyDate") ?? "").trim();
  const partyTime = String(formData.get("partyTime") ?? "").trim();

  if (!childName || childName.length > 40) {
    errors.childName = "Vul een naam in (max. 40 tekens).";
  }
  const age = Number(ageRaw);
  if (!Number.isInteger(age) || age < 1 || age > 18) {
    errors.age = "Vul een leeftijd tussen 1 en 18 in.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(partyDate)) {
    errors.partyDate = "Kies een geldige datum.";
  }
  if (!/^\d{2}:\d{2}$/.test(partyTime)) {
    errors.partyTime = "Kies een geldige tijd.";
  }

  return { errors, values: { childName, age, partyDate, partyTime } };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // 1. Formulierdata valideren
    const { errors, values } = validateFields(formData);

    // 2. Foto valideren
    const photo = formData.get("photo");
    if (!(photo instanceof File) || photo.size === 0) {
      errors.photo = "Upload een portretfoto.";
    } else if (photo.size > MAX_FILE_SIZE) {
      errors.photo = "De foto is te groot (max. 8MB).";
    } else if (!ALLOWED_TYPES.includes(photo.type)) {
      errors.photo = "Gebruik een JPG-, PNG-, WebP- of HEIC-bestand.";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const slug = generateSlug();

    // 3. Achtergrond wegsnijden (remove.bg)
    let transparentPng: Buffer;
    try {
      transparentPng = await removeBackground(photo as File);
    } catch (error) {
      console.error("Background removal error:", error);
      return NextResponse.json(
        {
          ok: false,
          errors: {
            photo:
              "De AI-uitsnijding is niet gelukt. Probeer een foto waarop het gezicht duidelijk zichtbaar is.",
          },
        },
        { status: 502 }
      );
    }

    // 4. Transparante PNG naar Cloudinary (on-the-fly optimalisatie)
    let avatarUrl: string;
    try {
      avatarUrl = await uploadAvatar(transparentPng, slug);
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return NextResponse.json(
        {
          ok: false,
          errors: { photo: "Het uploaden van de avatar is mislukt. Probeer het opnieuw." },
        },
        { status: 502 }
      );
    }

    // 5. Record aanmaken in Supabase
    const supabase = createServiceClient();
    const { error: dbError } = await supabase.from("games").insert({
      slug,
      child_name: values.childName,
      age: values.age,
      party_date: values.partyDate,
      party_time: values.partyTime,
      avatar_url: avatarUrl,
    });

    if (dbError) {
      console.error("Supabase insert error:", dbError.message);
      return NextResponse.json(
        {
          ok: false,
          errors: { form: "De game kon niet worden opgeslagen. Probeer het opnieuw." },
        },
        { status: 500 }
      );
    }

    // 6. Slug terug naar de frontend
    return NextResponse.json({ ok: true, slug }, { status: 201 });
  } catch (error) {
    console.error("Unexpected create-game error:", error);
    return NextResponse.json(
      { ok: false, errors: { form: "Er ging onverwacht iets mis. Probeer het opnieuw." } },
      { status: 500 }
    );
  }
}
