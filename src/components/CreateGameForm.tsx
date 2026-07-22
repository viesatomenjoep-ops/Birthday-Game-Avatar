"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Cake,
  CalendarDays,
  Clock,
  Loader2,
  PartyPopper,
  Sparkles,
  User,
} from "lucide-react";
import PhotoDropzone from "./PhotoDropzone";

type FieldErrors = Record<string, string>;

export default function CreateGameForm() {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
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
            placeholder="Bijv. Vive"
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
            <Sparkles className="h-5 w-5 transition group-hover:rotate-12" />
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
