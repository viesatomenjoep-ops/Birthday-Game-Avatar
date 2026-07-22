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

/** Eén speelbaar spel in het keuzemenu. */
export type GameMeta = {
  id: string;
  /** Phaser scene-key. */
  sceneKey: string;
  title: string;
  emoji: string;
  /** Korte omschrijving onder de titel in het menu. */
  hint: string;
};

/** Alle spellen die het kind in de browser kan kiezen. */
export const GAMES: GameMeta[] = [
  { id: "gifts", sceneKey: "GiftCatch", title: "Cadeautjes vangen", emoji: "🎁", hint: "Sleep en vang" },
  { id: "balloons", sceneKey: "BalloonPop", title: "Ballonnen knallen", emoji: "🎈", hint: "Tik ze weg" },
  { id: "candles", sceneKey: "CandleBlow", title: "Kaarsjes uitblazen", emoji: "🎂", hint: "Tik ze uit" },
  { id: "run", sceneKey: "CandyRun", title: "Snoep rennen", emoji: "🍬", hint: "Tik om te springen" },
  { id: "stars", sceneKey: "StarCatch", title: "Sterren vangen", emoji: "⭐", hint: "Tik de sterren" },
];
