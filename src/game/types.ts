/**
 * Configuratie die vanuit Next.js (Supabase-record) in de game wordt geïnjecteerd.
 */
export type GameConfig = {
  avatarUrl: string;
  childName: string;
  age: number;
  /** Bijv. "woensdag 2 september" — al geformatteerd voor de eindtekst. */
  dateLabel: string;
  /** Optionele extra feestdetails (uit de uitnodiging), getoond op het eindscherm. */
  location?: string;
  /** Losse regels, bijv. tijden en ophaalinfo. */
  details?: string[];
  /** Vrolijke afsluiter, bijv. "We hebben er zin in!". */
  slogan?: string;
};

/** Score die nodig is om het eindscherm te bereiken. */
export const TARGET_SCORE = 5;
