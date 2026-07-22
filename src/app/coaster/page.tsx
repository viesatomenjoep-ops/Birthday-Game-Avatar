"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const Coaster3D = dynamic(() => import("@/components/world/Coaster3D"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-[#8ec9ff] text-lg font-extrabold text-slate-700">
      De achtbaan wordt gebouwd…
    </div>
  ),
});

function CoasterInner() {
  const sp = useSearchParams();
  const avatar = sp.get("avatar") || undefined;
  const name = sp.get("name") || "Vieve";
  return <Coaster3D avatarUrl={avatar} childName={name} />;
}

export default function CoasterPage() {
  return (
    <Suspense fallback={null}>
      <CoasterInner />
    </Suspense>
  );
}
