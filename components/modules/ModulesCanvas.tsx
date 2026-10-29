"use client";

import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";

/**
 * A single fixed, transparent canvas that every capsule's <View> draws into, so seven
 * scenes cost one WebGL context. Views scissor to their capsule and skip rendering
 * while off screen.
 */
export default function ModulesCanvas() {
  return (
    <Canvas
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 20 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
    >
      <View.Port />
    </Canvas>
  );
}
