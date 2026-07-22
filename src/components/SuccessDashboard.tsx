"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Gamepad2,
  PartyPopper,
} from "lucide-react";
import type { GameRecord } from "@/lib/supabase";

function WhatsAppIcon({ className }: { className?: string }) {
  // Lucide heeft geen WhatsApp-logo; inline SVG in dezelfde stijl.
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export default function SuccessDashboard({ game }: { game: GameRecord }) {
  const [copied, setCopied] = useState(false);

  // Server en eerste client-render moeten identiek zijn (anders hydration
  // mismatch). We starten met de env-URL (of leeg) en vullen na mount de
  // echte window.origin aan als er geen NEXT_PUBLIC_APP_URL is ingesteld.
  const [baseUrl, setBaseUrl] = useState(process.env.NEXT_PUBLIC_APP_URL ?? "");
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      setBaseUrl(window.location.origin);
    }
  }, []);
  const gameUrl = `${baseUrl}/game/${game.slug}`;

  const partyDate = new Date(`${game.party_date}T${game.party_time}`);
  const dateLabel = partyDate.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback voor oudere in-app browsers
      window.prompt("Kopieer de link:", gameUrl);
    }
  }

  const whatsappText = encodeURIComponent(
    `🎉 ${game.child_name} wordt ${game.age} jaar! Speel de uitnodiging: ${gameUrl}`
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center px-5 py-10 sm:py-14">
      <div className="w-full animate-pop-in rounded-3xl bg-white/80 p-6 text-center shadow-xl shadow-brand-500/5 ring-1 ring-slate-100 backdrop-blur sm:p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shadow-xl shadow-emerald-500/30">
          <PartyPopper className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
          De game van {game.child_name} staat live! 🎉
        </h1>
        <p className="mt-2 text-slate-600">
          {game.child_name} wordt {game.age} jaar op {dateLabel} om{" "}
          {game.party_time.slice(0, 5)} uur. Deel de speelbare uitnodiging hieronder.
        </p>

        {/* Avatar preview */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={game.avatar_url}
          alt={`Avatar van ${game.child_name}`}
          className="mx-auto mt-6 h-32 w-32 rounded-3xl bg-gradient-to-br from-brand-100 to-amber-100 object-contain p-2 shadow-inner"
        />

        {/* Unieke URL */}
        <div className="mt-6 flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50 p-2 pl-4">
          <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-slate-700">
            {gameUrl}
          </span>
          <button
            onClick={copyUrl}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white transition active:scale-95 ${
              copied ? "bg-emerald-500" : "bg-slate-800 hover:bg-slate-700"
            }`}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Gekopieerd!" : "Kopieer"}
          </button>
        </div>

        {/* Deelknoppen */}
        <div className="mt-4 grid gap-3">
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-4 text-lg font-extrabold text-white shadow-xl shadow-emerald-500/25 transition hover:brightness-105 active:scale-[0.98]"
          >
            <WhatsAppIcon className="h-6 w-6" />
            Deel via WhatsApp
          </a>
          <a
            href={gameUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 active:scale-[0.98]"
          >
            <Gamepad2 className="h-5 w-5" />
            Speel de game zelf
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <a href="/" className="mt-8 text-sm font-semibold text-slate-400 hover:text-brand-600">
        ← Nog een game maken
      </a>
    </main>
  );
}
