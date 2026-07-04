import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Float } from "@react-three/drei";
import { HeadMesh } from "./HeadMesh";
import type { CharacterAppearance } from "@/lib/characters";

interface HeadSceneProps {
  appearance: CharacterAppearance;
  speaking?: number;
  className?: string;
  float?: boolean;
  cameraZ?: number;
  quality?: "high" | "low";
  frameloop?: "always" | "demand";
  targetPosition?: [number, number, number];
  targetScale?: number;
  emotion?: "base" | "feliz" | "enojado" | "triste";
}

export function HeadScene({
  appearance,
  speaking = 0,
  className,
  float = true,
  cameraZ = 4.2,
  quality = "high",
  frameloop = "always",
  targetPosition = [0, 0, 0],
  targetScale = 1.1,
  emotion = "base",
}: HeadSceneProps) {
  const high = quality === "high";

  // Dynamic light color based on emotion
  const spotLightColor = (() => {
    if (emotion === "feliz") return "#fff2cc"; // warm golden yellow
    if (emotion === "enojado") return "#ffcccc"; // intense red-white
    if (emotion === "triste") return "#ccd9ff"; // cool blue-white
    return "#ffd9a0"; // base warm peach
  })();

  return (
    <div className={className}>
      <Canvas
        shadows={high}
        frameloop={frameloop}
        dpr={high ? [1, 1.75] : 1}
        camera={{ position: [0, 0, cameraZ], fov: 40 }}
        gl={{ antialias: high, alpha: true, powerPreference: "low-power" }}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.75} />
          <spotLight
            position={[4, 6, 5]}
            angle={0.4}
            penumbra={0.8}
            intensity={2.4}
            color={spotLightColor}
            castShadow={high}
          />
          <pointLight position={[-4, 1, 3]} intensity={0.9} color="#c97a3a" />
          <pointLight position={[0, -2, 4]} intensity={0.45} color="#6a8ac9" />
          <pointLight position={[0, 3, -4]} intensity={0.5} color="#ffe8c4" />

          {float ? (
            <Float speed={2} rotationIntensity={0.25} floatIntensity={0.6}>
              <HeadMesh appearance={appearance} speaking={speaking} emotion={emotion} targetPosition={targetPosition} targetScale={targetScale} />
            </Float>
          ) : (
            <HeadMesh appearance={appearance} speaking={speaking} emotion={emotion} targetPosition={targetPosition} targetScale={targetScale} />
          )}

          {high && (
            <ContactShadows position={[0, -1.9, 0]} opacity={0.4} scale={6} blur={2.5} far={3} color="#000000" />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
