/**
 * Lichtgewicht geluidseffecten via WebAudio — geen audiobestanden nodig,
 * dus geen extra laadtijd in mobiele browsers. Vervang desgewenst door
 * echte samples via Phaser's audio loader.
 */

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(frequency: number, start: number, duration: number, volume = 0.2) {
  const audio = getContext();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, audio.currentTime + start);
  gain.gain.linearRampToValueAtTime(volume, audio.currentTime + start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + start + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(audio.currentTime + start);
  osc.stop(audio.currentTime + start + duration + 0.05);
}

/** Vrolijke "ding" bij het vangen van een cadeautje. */
export function playCatchSound() {
  tone(880, 0, 0.12, 0.18);
  tone(1318.5, 0.06, 0.18, 0.15);
}

/** Korte fanfare voor het eindscherm. */
export function playWinFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => tone(n, i * 0.12, 0.25, 0.2));
  tone(1318.5, notes.length * 0.12, 0.5, 0.22);
}
