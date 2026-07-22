import { customAlphabet } from "nanoid";

// Geen verwarrende tekens (0/O, 1/l/I) — de slug komt in een deelbare URL.
const nanoid = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 10);

export function generateSlug(): string {
  return nanoid();
}
