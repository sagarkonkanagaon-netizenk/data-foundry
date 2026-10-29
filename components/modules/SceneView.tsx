"use client";

import { PerspectiveCamera, View } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { SCENES, type SceneName } from "./scenes";

function Aim() {
  useFrame(({ camera }) => camera.lookAt(0, 0.1, 0));
  return null;
}

/** One capsule's window into the shared modules canvas. */
export default function SceneView({ scene }: { scene: SceneName }) {
  const Scene = SCENES[scene];
  return (
    <View className="absolute inset-0">
      <PerspectiveCamera makeDefault position={[0, 1.1, 6.2]} fov={32} />
      <Aim />
      <Scene />
    </View>
  );
}
