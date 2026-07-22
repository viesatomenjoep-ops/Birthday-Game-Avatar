"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// 3D is zwaar en client-only: dynamisch laden zonder SSR.
const World3D = dynamic(() => import("@/components/world/World3D"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-[#bfe3ff] text-lg font-extrabold text-slate-700">
      De 3D-wereld wordt geladen…
    </div>
  ),
});

function WorldInner() {
  const sp = useSearchParams();
  const avatar = sp.get("avatar") || undefined;
  const name = sp.get("name") || "Vieve";
  return <World3D avatarUrl={avatar} childName={name} />;
}

export default function WorldPage() {
  return (
    <Suspense fallback={null}>
      <WorldInner />
    </Suspense>
  );
}
