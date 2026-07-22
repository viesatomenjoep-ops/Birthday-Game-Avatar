# 🎁 Birthday Game Avatar

Een SaaS-portaal waar een ouder in één minuut een **gepersonaliseerde verjaardagsgame** maakt: foto uploaden → AI snijdt de achtergrond weg → deelbare game-link via WhatsApp.

Gebouwd met de **Viesa Automations Stack**: Next.js 14 (App Router) · Tailwind CSS · Supabase · Cloudinary · Phaser 3 (WebGL) · Vercel.

## Hoe het werkt

1. **Create Game** (`/`) — formulier met naam, leeftijd, feestdatum en tijd + drag-and-drop zone voor een portretfoto.
2. **API** (`/api/create-game`) — stuurt de foto naar remove.bg, uploadt de transparante PNG naar Cloudinary (f_auto/q_auto-optimalisatie) en maakt een record met unieke slug aan in Supabase.
3. **Succes Dashboard** (`/success/[slug]`) — toont de unieke game-URL met kopieerknop en WhatsApp-deelknop.
4. **De game** (`/game/[slug]`) — Phaser 3 "Cadeautjes Vangen", fullscreen geoptimaliseerd voor de WhatsApp in-app browser. Bij 5 gevangen cadeautjes verschijnt de uitnodiging met confetti.

## Lokaal draaien

```bash
npm install
npm run dev
```

### Werkt direct zonder keys (lokale dev-modus)

De hele flow — foto uploaden → succes-dashboard → speelbare game — werkt
**zonder** dat je Supabase, Cloudinary of remove.bg hoeft in te stellen:

- Geen Cloudinary-keys → de avatar wordt lokaal opgeslagen in `public/avatars/`.
- Geen Supabase-keys → game-records gaan naar `.data/games.json`.
- Geen remove.bg-key → de originele foto wordt gebruikt (geen uitsnijding).

Zodra je de echte keys invult in `.env.local`, schakelt de app automatisch over
naar Cloudinary + Supabase. **Let op:** de lokale modus werkt alleen op je eigen
machine; op Vercel is het bestandssysteem read-only, dus daar zijn de cloud-keys
verplicht.

```bash
cp .env.example .env.local   # optioneel: vul je keys in voor productie-gedrag
```

### Environment variables

Zie [.env.example](.env.example). Je hebt nodig:

| Variabele | Waar te vinden |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | idem (server-only, nooit in de client!) |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | Cloudinary Dashboard |
| `REMOVE_BG_API_KEY` | remove.bg/api (zonder key: dev-fallback met originele foto) |
| `NEXT_PUBLIC_APP_URL` | je productie-URL, bijv. `https://jouwdomein.nl` |

### Database

Voer [supabase/schema.sql](supabase/schema.sql) uit in de Supabase SQL Editor. RLS staat aan: publiek mag alleen **lezen** (de deelbare link); schrijven kan uitsluitend via de service-role key in de API-route.

## Deploy naar Vercel

1. Push naar GitHub en importeer de repo in Vercel.
2. Zet alle env vars uit `.env.example` in Vercel → Project → Settings → Environment Variables.
3. Deploy. De API-route heeft `maxDuration = 60` voor de remove.bg + Cloudinary-keten (Pro-plan aanbevolen bij drukte).

## Projectstructuur

```
src/
├── app/
│   ├── page.tsx                  # Create Game landingspagina
│   ├── success/[slug]/page.tsx   # Succes Dashboard
│   ├── game/[slug]/page.tsx      # Game-pagina (injecteert config in Phaser)
│   └── api/create-game/route.ts  # Foto-pipeline + Supabase insert
├── components/                   # CreateGameForm, PhotoDropzone, SuccessDashboard, GameCanvas
├── game/                         # Phaser: createGame + Preload/Game/End scenes
└── lib/                          # supabase, cloudinary, remove-bg, slug
```
