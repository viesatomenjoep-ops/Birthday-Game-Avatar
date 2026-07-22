import Link from "next/link";
import { Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
      <Ghost className="h-14 w-14 text-brand-300" />
      <h1 className="text-2xl font-black text-slate-900">
        Deze game bestaat niet (meer)
      </h1>
      <p className="max-w-sm text-slate-600">
        Controleer of de link klopt, of maak zelf in één minuut een nieuwe
        verjaardagsgame.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-3 font-extrabold text-white shadow-lg shadow-brand-500/25 transition hover:from-brand-500 hover:to-brand-400"
      >
        Maak een nieuwe game
      </Link>
    </main>
  );
}
