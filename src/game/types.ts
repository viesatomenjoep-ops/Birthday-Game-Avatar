/**
 * Eén sectie van de uitnodiging (Wanneer? / Hoe laat? / Ophalen?).
 */
export type InvitationSection = {
  label: string;
  lines: string[];
};

/**
 * Configuratie die vanuit Next.js (Supabase-record) in de game wordt geïnjecteerd.
 */
export type GameConfig = {
  avatarUrl: string;
  childName: string;
  age: number;
  /** Bijv. "woensdag 2 september" — al geformatteerd. */
  dateLabel: string;
  /** Bijv. "Kom jij ook naar mijn kinderfeestje?" */
  greeting?: string;
  /** Volledige uitnodiging in secties, getoond op het eindscherm. */
  sections?: InvitationSection[];
  /** Vrolijke afsluiter, bijv. "We hebben er zin in!". */
  slogan?: string;
};

/** Speelduur voordat de uitnodiging verschijnt (milliseconden). */
export const GAME_DURATION_MS = 25000;
