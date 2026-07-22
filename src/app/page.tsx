import { Gamepad2, ShieldCheck, Timer, Wand2 } from "lucide-react";
import CreateGameForm from "@/components/CreateGameForm";

export default function CreateGamePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-10 sm:py-14">
      {/* Hero */}
      <header className="animate-fade-up text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-600 to-sun-500 text-white shadow-xl shadow-brand-500/30">
          <Gamepad2 className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
          Maak een{" "}
          <span className="bg-gradient-to-r from-brand-600 to-sun-500 bg-clip-text text-transparent">
            persoonlijke verjaardagsgame
          </span>{" "}
          in 1 minuut
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-slate-600">
          Upload een foto van je kind, vul de feestgegevens in en deel een unieke
          speelbare uitnodiging via WhatsApp. 🎁
        </p>
      </header>

      {/* USP's */}
      <ul className="mt-8 grid animate-fade-up grid-cols-3 gap-2 text-center [animation-delay:100ms]">
        {[
          { icon: Wand2, label: "AI maakt de avatar" },
          { icon: Timer, label: "Klaar in 1 minuut" },
          { icon: ShieldCheck, label: "Veilig & privé" },
        ].map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="rounded-2xl bg-white/70 px-2 py-3 shadow-sm ring-1 ring-slate-100"
          >
            <Icon className="mx-auto mb-1 h-5 w-5 text-brand-500" />
            <span className="text-xs font-bold text-slate-600">{label}</span>
          </li>
        ))}
      </ul>

      {/* Formulier */}
      <section className="mt-8 animate-fade-up rounded-3xl bg-white/80 p-6 shadow-xl shadow-brand-500/5 ring-1 ring-slate-100 backdrop-blur [animation-delay:200ms] sm:p-8">
        <CreateGameForm />
      </section>

      <footer className="mt-10 text-center text-xs text-slate-400">
        Foto&apos;s worden alleen gebruikt om de game-avatar te maken.
      </footer>
    </main>
  );
}
