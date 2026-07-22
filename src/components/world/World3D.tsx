"use client";

import {
  Component,
  ReactNode,
  Suspense,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { input, bindKeyboard, setJoystick } from "./input";
import { ProcHuman } from "./ProcHuman";
import { RpmAvatar } from "./RpmAvatar";

const WORLD_RADIUS = 26;
const SPEED = 4.2;

type GiftDef = { id: number; x: number; z: number; color: string };

// ---------- foutafvang: valt terug op het ingebouwde poppetje ----------
class AvatarBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// ---------- decor ----------
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 1, 8]} />
        <meshStandardMaterial color="#7a5230" />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[0.9, 1.6, 10]} />
        <meshStandardMaterial color="#4caf50" />
      </mesh>
      <mesh position={[0, 2.3, 0]} castShadow>
        <coneGeometry args={[0.66, 1.2, 10]} />
        <meshStandardMaterial color="#5cba5c" />
      </mesh>
    </group>
  );
}

function Balloon({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(s.clock.elapsedTime + position[0]) * 0.3;
  });
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.5, 20, 20]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.9, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1.2, 4]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function Gift({ def }: { def: GiftDef }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 1.5;
  });
  return (
    <group ref={ref} position={[def.x, 0.4, def.z]}>
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial color={def.color} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.72, 0.16, 0.72]} />
        <meshStandardMaterial color="#ffe08a" />
      </mesh>
      <mesh>
        <boxGeometry args={[0.16, 0.72, 0.72]} />
        <meshStandardMaterial color="#ffe08a" />
      </mesh>
    </group>
  );
}

// ---------- speler + camera + verzamelen ----------
function Player({
  avatarUrl,
  gifts,
  onCollect,
  onMovingChange,
}: {
  avatarUrl?: string;
  gifts: GiftDef[];
  onCollect: (id: number) => void;
  onMovingChange: (m: boolean) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const facing = useRef(0);
  const wasMoving = useRef(false);
  const [moving, setMoving] = useState(false);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const dtc = Math.min(dt, 0.05);

    const ix = input.x;
    const iz = input.z;
    const mag = Math.hypot(ix, iz);
    const isMoving = mag > 0.12;

    if (isMoving) {
      // Voortbewegen in de invoerrichting (joystick omhoog = weg van camera).
      g.position.x += ix * SPEED * dtc;
      g.position.z += iz * SPEED * dtc;
      // Binnen de wereld houden.
      const d = Math.hypot(g.position.x, g.position.z);
      if (d > WORLD_RADIUS) {
        g.position.x = (g.position.x / d) * WORLD_RADIUS;
        g.position.z = (g.position.z / d) * WORLD_RADIUS;
      }
      // Naar de looprichting draaien (soepel).
      facing.current = Math.atan2(ix, iz);
    }
    const cur = g.rotation.y;
    let diff = facing.current - cur;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    g.rotation.y = cur + diff * Math.min(1, dtc * 10);

    if (isMoving !== wasMoving.current) {
      wasMoving.current = isMoving;
      setMoving(isMoving);
      onMovingChange(isMoving);
    }

    // Volg-camera achter de speler.
    const back = 6.5;
    const camTarget = new THREE.Vector3(
      g.position.x - Math.sin(g.rotation.y) * back,
      g.position.y + 4.2,
      g.position.z - Math.cos(g.rotation.y) * back
    );
    camera.position.lerp(camTarget, Math.min(1, dtc * 4));
    camera.lookAt(g.position.x, g.position.y + 1.4, g.position.z);

    // Cadeautjes verzamelen bij nabijheid.
    for (const gift of gifts) {
      const dx = gift.x - g.position.x;
      const dz = gift.z - g.position.z;
      if (dx * dx + dz * dz < 1.4) onCollect(gift.id);
    }
  });

  return (
    <group ref={group}>
      {avatarUrl ? (
        <AvatarBoundary fallback={<ProcHuman walking={moving} />}>
          <Suspense fallback={<ProcHuman walking={moving} />}>
            <RpmAvatar url={avatarUrl} walking={moving} />
          </Suspense>
        </AvatarBoundary>
      ) : (
        <ProcHuman walking={moving} />
      )}
    </group>
  );
}

function Scene({
  avatarUrl,
  gifts,
  onCollect,
  onMovingChange,
}: {
  avatarUrl?: string;
  gifts: GiftDef[];
  onCollect: (id: number) => void;
  onMovingChange: (m: boolean) => void;
}) {
  const trees = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const r = 14 + (i % 3) * 3;
        return [Math.cos(a) * r, 0, Math.sin(a) * r] as [number, number, number];
      }),
    []
  );
  const balloons = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        const r = 8 + (i % 2) * 4;
        const colors = ["#ff6b6b", "#ffd166", "#4dabf7", "#b197fc", "#69db7c"];
        return {
          position: [Math.cos(a) * r, 3 + (i % 3), Math.sin(a) * r] as [number, number, number],
          color: colors[i % colors.length],
        };
      }),
    []
  );

  return (
    <>
      <color attach="background" args={["#8ec9ff"]} />
      <fog attach="fog" args={["#a9d6ff", 26, 60]} />
      <Sky sunPosition={[12, 8, 10]} turbidity={3} rayleigh={0.7} distance={450} />
      <hemisphereLight args={["#cfeaff", "#6a8f4a", 0.9]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[8, 14, 6]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />

      {/* Grasveld */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[WORLD_RADIUS + 4, 48]} />
        <meshStandardMaterial color="#7cc36a" />
      </mesh>
      {/* Pad-cirkel */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[9.4, 10.6, 48]} />
        <meshStandardMaterial color="#e6c88a" />
      </mesh>

      {trees.map((p, i) => (
        <Tree key={i} position={p} />
      ))}
      {balloons.map((b, i) => (
        <Balloon key={i} position={b.position} color={b.color} />
      ))}
      {gifts.map((g) => (
        <Gift key={g.id} def={g} />
      ))}

      <Player
        avatarUrl={avatarUrl}
        gifts={gifts}
        onCollect={onCollect}
        onMovingChange={onMovingChange}
      />
    </>
  );
}

// ---------- touch-joystick ----------
function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  function move(clientX: number, clientY: number) {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const max = r.width / 2;
    const len = Math.hypot(dx, dy);
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    setKnob({ x: dx, y: dy });
    setJoystick(dx / max, dy / max); // joystick omhoog (dy<0) = vooruit (z<0)
  }
  function end() {
    setKnob({ x: 0, y: 0 });
    setJoystick(0, 0);
  }

  return (
    <div
      ref={base}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        move(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => e.buttons && move(e.clientX, e.clientY)}
      onPointerUp={end}
      onPointerCancel={end}
      className="absolute bottom-8 left-8 z-20 h-32 w-32 touch-none rounded-full border-2 border-white/40 bg-black/25 backdrop-blur-sm"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-14 w-14 rounded-full bg-white/80 shadow-lg"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}

export default function World3D({
  avatarUrl,
  childName,
}: {
  avatarUrl?: string;
  childName: string;
}) {
  const initialGifts = useMemo<GiftDef[]>(() => {
    const colors = ["#e74c3c", "#3498db", "#9b59b6", "#e67e22", "#16a085"];
    return Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 + 0.7;
      const r = 5 + (i % 3) * 4;
      return { id: i, x: Math.cos(a) * r, z: Math.sin(a) * r, color: colors[i % colors.length] };
    });
  }, []);

  const [gifts, setGifts] = useState(initialGifts);
  const [score, setScore] = useState(0);
  const [, setMoving] = useState(false);

  function collect(id: number) {
    setGifts((prev) => {
      if (!prev.some((g) => g.id === id)) return prev;
      setScore((s) => s + 1);
      return prev.filter((g) => g.id !== id);
    });
  }

  return (
    <div className="fixed inset-0 z-10 bg-[#bfe3ff]">
      <Canvas
        shadows
        dpr={[1, 1.6]}
        camera={{ position: [0, 5, 8], fov: 55 }}
        onCreated={() => bindKeyboard()}
      >
        <Suspense fallback={null}>
          <Scene
            avatarUrl={avatarUrl}
            gifts={gifts}
            onCollect={collect}
            onMovingChange={setMoving}
          />
        </Suspense>
      </Canvas>

      {/* HUD */}
      <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-black/40 px-5 py-2 text-lg font-black text-white backdrop-blur-sm">
        🎁 {score} / {initialGifts.length}
      </div>
      <div className="absolute right-4 top-4 z-20 rounded-full bg-black/40 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm">
        {childName}&apos;s wereld
      </div>
      {score >= initialGifts.length && (
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white/95 px-8 py-6 text-center shadow-2xl">
          <p className="text-2xl font-black text-brand-600">Alle cadeautjes gevonden! 🎉</p>
          <p className="mt-1 text-slate-600">Goed gedaan, {childName}!</p>
        </div>
      )}

      <Joystick />

      <div className="absolute bottom-8 right-8 z-20 max-w-[42%] rounded-2xl bg-black/35 px-3 py-2 text-right text-xs font-semibold text-white/90 backdrop-blur-sm">
        Sleep de joystick om {childName} te laten lopen. (Op de computer: WASD /
        pijltjes.)
      </div>
    </div>
  );
}
