/**
 * Configuratie die vanuit Next.js (Supabase-record) in de game wordt geïnjecteerd.
 */
export type GameConfig = {
  avatarUrl: string;
  childName: string;
  age: number;
  /** Bijv. "14 augustus" — al geformatteerd voor de eindtekst. */
  dateLabel: string;
};

/** Score die nodig is om het eindscherm te bereiken. */
export const TARGET_SCORE = 5;
