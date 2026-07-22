"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Cake,
  CalendarDays,
  Clock,
  Gamepad2,
  Loader2,
  PartyPopper,
  User,
  Wand2,
  PenLine,
} from "lucide-react";
import PhotoDropzone from "./PhotoDropzone";
import { COSTUMES } from "@/game/types";

type FieldErrors = Record<string, string>;

export default function CreateGameForm() {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [costume, setCostume] = useState("none");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const formData = new FormData(event.currentTarget);
    if (!photo) {
      setErrors({ photo: "Upload een portretfoto om de avatar te maken." });
      return;
    }
    formData.set("photo", photo);
    formData.set("costume", costume);

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/create-game", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        setErrors(data.errors ?? { form: "Er ging iets mis. Probeer het opnieuw." });
        return;
      }

      router.push(`/success/${data.slug}`);
    } catch {
      setErrors({ form: "Netwerkfout — controleer je verbinding en probeer opnieuw." });
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-2xl border-2 bg-white/80 px-4 py-3 pl-11 text-base font-semibold text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400
     ${hasError ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-brand-500"}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Naam */}
      <div>
        <label htmlFor="childName" className="mb-1.5 block text-sm font-bold text-slate-700">
          Naam van het kind
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-400" />
          <input
            id="childName"
            name="childName"
            type="text"
            maxLength={40}
            placeholder="Bijv. Vieve"
            required
            className={inputClass(!!errors.childName)}
          />
        </div>
        {errors.childName && (
          <p className="mt-1 text-sm font-semibold text-red-600">{errors.childName}</p>
        )}
      </div>

      {/* Leeftijd */}
      <div>
        <label htmlFor="age" className="mb-1.5 block text-sm font-bold text-slate-700">
          Leeftijd die het kind wordt
        </label>
        <div className="relative">
          <Cake className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-400" />
          <input
            id="age"
            name="age"
            type="number"
            min={1}
            max={18}
            placeholder="Bijv. 5"
            required
            className={inputClass(!!errors.age)}
          />
        </div>
        {errors.age && <p className="mt-1 text-sm font-semibold text-red-600">{errors.age}</p>}
      </div>

      {/* Datum + tijd naast elkaar op grotere schermen */}
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
        <div>
          <label htmlFor="partyDate" className="mb-1.5 block text-sm font-bold text-slate-700">
            Feestdatum
          </label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-400" />
            <input
              id="partyDate"
              name="partyDate"
              type="date"
              required
              className={inputClass(!!errors.partyDate)}
            />
          </div>
          {errors.partyDate && (
            <p className="mt-1 text-sm font-semibold text-red-600">{errors.partyDate}</p>
          )}
        </div>
        <div>
          <label htmlFor="partyTime" className="mb-1.5 block text-sm font-bold text-slate-700">
            Tijd
          </label>
          <div className="relative">
            <Clock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-400" />
            <input
              id="partyTime"
              name="partyTime"
              type="time"
              required
              className={inputClass(!!errors.partyTime)}
            />
          </div>
          {errors.partyTime && (
            <p className="mt-1 text-sm font-semibold text-red-600">{errors.partyTime}</p>
          )}
        </div>
      </div>

      {/* Foto-upload */}
      <div>
        <label className="mb-1.5 block text-sm font-bold text-slate-700">
          Portretfoto voor de avatar
        </label>
        <PhotoDropzone onFileSelected={setPhoto} error={errors.photo} />
      </div>

      {/* Kostuum */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <Wand2 className="h-4 w-4 text-brand-500" />
          Kies een kostuum (pixel-art poppetje)
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {COSTUMES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCostume(c.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition active:scale-95 ${
                costume === c.id
                  ? "border-brand-500 bg-brand-50"
                  : "border-slate-200 bg-white hover:border-brand-300"
              }`}
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-xs font-bold text-slate-600">{c.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Het hoofd van het kind komt op een kostuumlijf. Kies &quot;Geen&quot; voor
          alleen de foto.
        </p>
      </div>

      {/* Eigen uitnodigingstekst */}
      <div className="space-y-3 rounded-2xl bg-brand-50/50 p-4">
        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <PenLine className="h-4 w-4 text-brand-500" />
          Eigen uitnodigingstekst{" "}
          <span className="font-normal text-slate-400">(optioneel)</span>
        </p>

        <div>
          <label htmlFor="greeting" className="mb-1 block text-xs font-bold text-slate-600">
            Uitnodigingszin
          </label>
          <input
            id="greeting"
            name="greeting"
            type="text"
            maxLength={80}
            placeholder="Kom jij ook naar mijn kinderfeestje?"
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label htmlFor="whenText" className="mb-1 block text-xs font-bold text-slate-600">
            Wanneer? <span className="font-normal text-slate-400">(1 regel per zin)</span>
          </label>
          <textarea
            id="whenText"
            name="whenText"
            rows={2}
            placeholder={"Woensdag 2 september\nNa school gaan we samen naar Kids Wonderland!"}
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label htmlFor="timeText" className="mb-1 block text-xs font-bold text-slate-600">
            Hoe laat?
          </label>
          <textarea
            id="timeText"
            name="timeText"
            rows={2}
            placeholder={"Het feestje is om 17.00 uur afgelopen.\nDaarna eten we frietjes!"}
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label htmlFor="pickupText" className="mb-1 block text-xs font-bold text-slate-600">
            Ophalen?
          </label>
          <textarea
            id="pickupText"
            name="pickupText"
            rows={2}
            placeholder="Mama's of papa's mogen jou om 17.00 uur ophalen."
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label htmlFor="slogan" className="mb-1 block text-xs font-bold text-slate-600">
            Slogan
          </label>
          <input
            id="slogan"
            name="slogan"
            type="text"
            maxLength={60}
            placeholder="We hebben er zin in!"
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {errors.form && (
        <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
          {errors.form}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-4 text-lg font-extrabold text-white shadow-xl shadow-brand-500/25 transition hover:from-brand-500 hover:to-brand-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            De avatar wordt gemaakt…
          </>
        ) : (
          <>
            <Gamepad2 className="h-5 w-5 transition group-hover:rotate-12" />
            Maak de verjaardagsgame
            <PartyPopper className="h-5 w-5" />
          </>
        )}
      </button>

      {isSubmitting && (
        <p className="text-center text-sm text-slate-500">
          Even geduld — de AI snijdt de foto uit en bouwt de game. Dit duurt zo&apos;n
          10 tot 20 seconden.
        </p>
      )}
    </form>
  );
}
