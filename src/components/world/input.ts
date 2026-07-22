/**
 * Gedeelde invoer-state voor de 3D-wereld: een genormaliseerde bewegingsvector
 * (x, z) uit joystick (touch) of WASD/pijltjes (desktop). Module-level zodat de
 * render-loop en de UI dezelfde bron delen zonder re-renders.
 */
export const input = { x: 0, z: 0 };

const keys: Record<string, boolean> = {};

function recompute() {
  let x = 0;
  let z = 0;
  if (keys["w"] || keys["arrowup"]) z -= 1;
  if (keys["s"] || keys["arrowdown"]) z += 1;
  if (keys["a"] || keys["arrowleft"]) x -= 1;
  if (keys["d"] || keys["arrowright"]) x += 1;
  const len = Math.hypot(x, z);
  if (len > 0) {
    input.x = x / len;
    input.z = z / len;
  } else {
    input.x = 0;
    input.z = 0;
  }
}

let bound = false;
export function bindKeyboard() {
  if (bound || typeof window === "undefined") return () => {};
  bound = true;
  const down = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = true;
    recompute();
  };
  const up = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = false;
    recompute();
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    bound = false;
  };
}

/** Joystick zet de vector direct (waarden tussen -1 en 1). */
export function setJoystick(x: number, z: number) {
  input.x = x;
  input.z = z;
}
