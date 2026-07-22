# Birthday Game Avatar

SaaS: ouder uploadt portretfoto → remove.bg snijdt achtergrond weg → Cloudinary host de transparante PNG → Supabase bewaart het game-record → deelbare Phaser-game op `/game/[slug]`.

## Stack & conventies

- Next.js 14 App Router, TypeScript strict, Tailwind. Alias `@/*` → `src/*`.
- UI-taal is **Nederlands**; iconen via lucide-react.
- Supabase: `createServiceClient()` (service role, alleen server) vs `createAnonClient()` (publieke reads). RLS: alleen SELECT voor anon — inserts lopen uitsluitend via `/api/create-game`.
- Phaser wordt uitsluitend client-side geladen via dynamic import in `GameCanvas.tsx` (SSR breekt anders). Game-config gaat via `game.registry.set("gameConfig", ...)` naar de scenes.
- Game-textures worden programmatisch gegenereerd in `PreloadScene` — geen binaire assets in de repo. Geluid via WebAudio in `src/game/audio.ts`.
- Zonder `REMOVE_BG_API_KEY` valt de pipeline terug op de originele foto (bewust, voor lokaal testen).

## Commands

- `npm run dev` / `npm run build`
- Database-schema: `supabase/schema.sql` (handmatig uitvoeren in Supabase SQL Editor).
