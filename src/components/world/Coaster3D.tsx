"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { ProcHuman } from "./ProcHuman";

const RAIL_GAP = 0.55;
const GRAVITY = 20;
const V_MIN = 6;

// ---------- de baan (gesloten curve met heuvels en duiken) ----------
function makeTrack() {
  const p = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const pts = [
    p(0, 1.2, -20),
    p(11, 9, -16),
    p(18, 14.5, -3),
    p(15, 5, 9),
    p(5, 1.4, 17),
    p(-7, 8, 15),
    p(-17, 6, 3),
    p(-14, 2, -8),
    p(-5, 6.5, -16),
    p(-1, 2.6, -20),
  ];
  const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5);
  const maxY = Math.max(...pts.map((v) => v.y)) + 1.5;
  return { curve, maxY };
}

function sideAt(curve: THREE.CatmullRomCurve3, u: number) {
  const t = curve.getTangentAt(u).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const s = new THREE.Vector3().crossVectors(t, up);
  if (s.lengthSq() < 1e-4) s.set(1, 0, 0);
  return s.normalize();
}

function Rails({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const { left, right, ties } = useMemo(() => {
    const N = 220;
    const L: THREE.Vector3[] = [];
    const R: THREE.Vector3[] = [];
    const T: { pos: THREE.Vector3; rotY: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const pt = curve.getPointAt(u);
      const s = sideAt(curve, u).multiplyScalar(RAIL_GAP);
      L.push(pt.clone().sub(s));
      R.push(pt.clone().add(s));
      if (i % 5 === 0) {
        const sd = sideAt(curve, u);
        T.push({ pos: pt.clone(), rotY: Math.atan2(sd.x, sd.z) });
      }
    }
    const tube = (points: THREE.Vector3[]) =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points, true),
        220,
        0.11,
        6,
        true
      );
    return { left: tube(L), right: tube(R), ties: T };
  }, [curve]);

  return (
    <group>
      <mesh geometry={left}>
        <meshStandardMaterial color="#c94b4b" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh geometry={right}>
        <meshStandardMaterial color="#c94b4b" metalness={0.3} roughness={0.5} />
      </mesh>
      {ties.map((t, i) => (
        <mesh key={i} position={t.pos} rotation={[0, t.rotY, 0]} castShadow>
          <boxGeometry args={[RAIL_GAP * 2 + 0.2, 0.09, 0.28]} />
          <meshStandardMaterial color="#6b4a2b" />
        </mesh>
      ))}
    </group>
  );
}

function Ride({
  curve,
  maxY,
  avatarUrl,
  onLap,
}: {
  curve: THREE.CatmullRomCurve3;
  maxY: number;
  avatarUrl?: string;
  onLap: () => void;
}) {
  const cart = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const length = useMemo(() => curve.getLength(), [curve]);
  const dist = useRef(0);
  const prevU = useRef(0);

  useFrame((_, dt) => {
    const g = cart.current;
    if (!g) return;
    const dtc = Math.min(dt, 0.04);

    // Snelheid uit "zwaartekracht": snel in de duik, langzaam op de top.
    const u0 = (dist.current % length) / length;
    const h = curve.getPointAt(u0).y;
    const v = Math.sqrt(Math.max(V_MIN * V_MIN, 2 * GRAVITY * (maxY - h)));
    dist.current += v * dtc;

    const u = (dist.current % length) / length;
    if (u < prevU.current) onLap();
    prevU.current = u;

    const pos = curve.getPointAt(u);
    const tan = curve.getTangentAt(u).normalize();

    g.position.copy(pos);
    g.lookAt(pos.clone().add(tan));

    // Meerijdende camera: iets achter en boven het karretje, kijkt vooruit.
    const camTarget = pos
      .clone()
      .sub(tan.clone().multiplyScalar(5.2))
      .add(new THREE.Vector3(0, 2.8, 0));
    camera.position.lerp(camTarget, Math.min(1, dtc * 5));
    camera.lookAt(pos.x + tan.x * 3, pos.y + 1 + tan.y * 3, pos.z + tan.z * 3);
  });

    return (
    <group ref={cart}>
      {/* Open karretje: bodem + lage zijwanden */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.9, 0.18, 1.3]} />
        <meshStandardMaterial color="#ff5d5d" metalness={0.2} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.28, -0.6]} castShadow>
        <boxGeometry args={[0.9, 0.55, 0.14]} />
        <meshStandardMaterial color="#e23b3b" />
      </mesh>
      {[-0.45, 0.45].map((x, i) => (
        <mesh key={i} position={[x, 0.24, 0]} castShadow>
          <boxGeometry args={[0.12, 0.34, 1.3]} />
          <meshStandardMaterial color="#e23b3b" />
        </mesh>
      ))}
      {/* Wieltjes */}
      {[
        [-0.46, -0.02, 0.42],
        [0.46, -0.02, 0.42],
        [-0.46, -0.02, -0.42],
        [0.46, -0.02, -0.42],
      ].map((w, i) => (
        <mesh key={i} position={w as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.1, 12]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
      {/* Inzittende avatar, verlaagd zodat hij ín het karretje zit */}
      <group position={[0, -0.32, 0.05]} scale={0.5}>
        <ProcHuman walking={false} outfit="#ffd166" pants="#3a6ea5" />
      </group>
    </group>
  );
}

function Scenery() {
  const trees = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r = 24 + (i % 3) * 3;
        return [Math.cos(a) * r, 0, Math.sin(a) * r] as [number, number, number];
      }),
    []
  );
  return (
    <>
      <color attach="background" args={["#8ec9ff"]} />
      <fog attach="fog" args={["#a9d6ff", 40, 90]} />
      <Sky sunPosition={[15, 10, 12]} turbidity={3} rayleigh={0.7} distance={450} />
      <hemisphereLight args={["#cfeaff", "#6a8f4a", 0.9]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 18, 8]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[40, 48]} />
        <meshStandardMaterial color="#7cc36a" />
      </mesh>
      {trees.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.22, 1, 8]} />
            <meshStandardMaterial color="#7a5230" />
          </mesh>
          <mesh position={[0, 1.6, 0]} castShadow>
            <coneGeometry args={[1, 2, 10]} />
            <meshStandardMaterial color="#4caf50" />
          </mesh>
        </group>
      ))}
    </>
  );
}

export default function Coaster3D({
  avatarUrl,
  childName,
}: {
  avatarUrl?: string;
  childName: string;
}) {
  const { curve, maxY } = useMemo(() => makeTrack(), []);
  const [laps, setLaps] = useState(0);

  return (
    <div className="fixed inset-0 z-10 bg-[#8ec9ff]">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 8, 14], fov: 60 }}>
        <Suspense fallback={null}>
          <Scenery />
          <Rails curve={curve} />
          <Ride
            curve={curve}
            maxY={maxY}
            avatarUrl={avatarUrl}
            onLap={() => setLaps((l) => l + 1)}
          />
        </Suspense>
      </Canvas>

      <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-black/40 px-5 py-2 text-lg font-black text-white backdrop-blur-sm">
        🎢 {childName}&apos;s achtbaan · rondje {laps}
      </div>
      <a
        href="/game/demo"
        className="absolute right-4 top-4 z-20 rounded-full bg-white/90 px-4 py-2 text-sm font-extrabold text-slate-700 shadow"
      >
        ← Terug
      </a>
      <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-2xl bg-black/35 px-4 py-2 text-center text-sm font-semibold text-white/90 backdrop-blur-sm">
        Hou je vast, {childName}! De achtbaan rijdt vanzelf. 🎉
      </div>
    </div>
  );
}
