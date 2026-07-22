"use client";

import { useEffect, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

// Ready Player Me animatie-bibliotheek (deelt hetzelfde skelet als RPM-avatars).
const IDLE_URL =
  "https://cdn.jsdelivr.net/gh/readyplayerme/animation-library@master/masculine/glb/idle/M_Standing_Idle_001.glb";
const WALK_URL =
  "https://cdn.jsdelivr.net/gh/readyplayerme/animation-library@master/masculine/glb/locomotion/M_Walk_001.glb";

/**
 * Ready Player Me-avatar (GLB) met idle/walk uit de RPM-animatiebibliotheek.
 * Als het GLB of de animaties niet laden, gooit Suspense/useGLTF een fout die
 * de ErrorBoundary in World3D opvangt → dan valt hij terug op ProcHuman.
 */
export function RpmAvatar({ url, walking }: { url: string; walking: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);
  const idleGltf = useGLTF(IDLE_URL);
  const walkGltf = useGLTF(WALK_URL);

  const idleClip = idleGltf.animations[0]?.clone();
  const walkClip = walkGltf.animations[0]?.clone();
  if (idleClip) idleClip.name = "idle";
  if (walkClip) walkClip.name = "walk";

  const clips = [idleClip, walkClip].filter(Boolean) as THREE.AnimationClip[];
  const { actions } = useAnimations(clips, group);

  useEffect(() => {
    scene.traverse((o) => {
      o.castShadow = true;
    });
  }, [scene]);

  useEffect(() => {
    const idle = actions["idle"];
    const walk = actions["walk"];
    const active = walking ? walk : idle;
    const other = walking ? idle : walk;
    other?.fadeOut(0.2);
    active?.reset().fadeIn(0.2).play();
  }, [walking, actions]);

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(IDLE_URL);
useGLTF.preload(WALK_URL);
