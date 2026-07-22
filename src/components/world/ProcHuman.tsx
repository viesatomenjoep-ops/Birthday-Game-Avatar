"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Ingebouwd low-poly 3D-poppetje met een echte loopcyclus (armen/benen
 * scharnieren). Werkt altijd — dient als vangnet als de Ready Player Me-avatar
 * niet laadt. `walking` bepaalt of de loopanimatie speelt.
 */
export function ProcHuman({
  walking,
  skin = "#f2c9a0",
  outfit = "#e5383b",
  pants = "#1d3557",
}: {
  walking: boolean;
  skin?: string;
  outfit?: string;
  pants?: string;
}) {
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const phase = useRef(0);

  useFrame((_, dt) => {
    const target = walking ? 9 : 0;
    phase.current += dt * target;
    const s = walking ? Math.sin(phase.current) * 0.6 : 0;
    if (legL.current) legL.current.rotation.x = s;
    if (legR.current) legR.current.rotation.x = -s;
    if (armL.current) armL.current.rotation.x = -s * 0.8;
    if (armR.current) armR.current.rotation.x = s * 0.8;
  });

  return (
    <group>
      {/* Torso */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.5, 6, 12]} />
        <meshStandardMaterial color={outfit} />
      </mesh>
      {/* Hoofd */}
      <mesh position={[0, 1.62, 0]} castShadow>
        <sphereGeometry args={[0.26, 24, 24]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      {/* Armen */}
      <group ref={armL} position={[-0.34, 1.32, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.4, 4, 8]} />
          <meshStandardMaterial color={outfit} />
        </mesh>
      </group>
      <group ref={armR} position={[0.34, 1.32, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.4, 4, 8]} />
          <meshStandardMaterial color={outfit} />
        </mesh>
      </group>
      {/* Benen */}
      <group ref={legL} position={[-0.14, 0.78, 0]}>
        <mesh position={[0, -0.34, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.44, 4, 8]} />
          <meshStandardMaterial color={pants} />
        </mesh>
      </group>
      <group ref={legR} position={[0.14, 0.78, 0]}>
        <mesh position={[0, -0.34, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.44, 4, 8]} />
          <meshStandardMaterial color={pants} />
        </mesh>
      </group>
    </group>
  );
}
