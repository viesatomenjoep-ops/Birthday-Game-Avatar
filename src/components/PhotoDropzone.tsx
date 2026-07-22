"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, ScanFace, X } from "lucide-react";

type Props = {
  onFileSelected: (file: File | null) => void;
  error?: string;
};

export default function PhotoDropzone({ onFileSelected, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File | null) => {
      if (preview) URL.revokeObjectURL(preview);
      if (file) {
        setPreview(URL.createObjectURL(file));
        setFileName(file.name);
      } else {
        setPreview(null);
        setFileName(null);
      }
      onFileSelected(file);
    },
    [onFileSelected, preview]
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload een portretfoto"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-6 text-center transition-all
          ${
            isDragging
              ? "border-brand-500 bg-brand-50 scale-[1.01]"
              : error
                ? "border-red-400 bg-red-50"
                : "border-brand-300 bg-white/70 hover:border-brand-400 hover:bg-brand-50/60"
          }`}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Voorbeeld van de geüploade foto"
              className="h-36 w-36 rounded-2xl object-cover shadow-lg"
            />
            <p className="max-w-full truncate text-sm font-semibold text-slate-700">
              {fileName}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute right-3 top-3 rounded-full bg-white p-1.5 text-slate-500 shadow-md transition hover:bg-red-50 hover:text-red-500"
              aria-label="Foto verwijderen"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-sun-500 text-white shadow-lg">
              <ImagePlus className="h-8 w-8" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">
                Sleep de portretfoto hierheen
              </p>
              <p className="text-sm text-slate-500">
                of <span className="font-semibold text-brand-600">klik om te kiezen</span>{" "}
                — JPG, PNG of WebP, max. 8MB
              </p>
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Micro-copy voor de AI-uitsnijding */}
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
        <ScanFace className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong>Tip voor het beste resultaat:</strong> kies een foto waarop het
          gezicht goed zichtbaar en scherp is, recht van voren. Onze AI snijdt het
          kind automatisch uit voor de game-avatar.
        </span>
      </p>

      {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}
