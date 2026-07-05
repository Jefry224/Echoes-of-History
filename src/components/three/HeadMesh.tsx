import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { CharacterAppearance } from "@/lib/characters";

interface HeadMeshProps {
  appearance: CharacterAppearance;
  speaking?: number;
  liveliness?: number;
  targetPosition?: [number, number, number];
  targetScale?: number;
  emotion?: "base" | "feliz" | "enojado" | "triste";
  speakAnimation?: "jaw" | "brows";
}

function HairTuft({
  position,
  rotation,
  scale,
  color,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow>
      <coneGeometry args={[0.18, 0.6, 6]} />
      <meshStandardMaterial color={color} roughness={0.9} flatShading />
    </mesh>
  );
}

function WildHair({ color }: { color: string }) {
  const tufts = useMemo(() => {
    const arr: { p: [number, number, number]; r: [number, number, number]; s: [number, number, number] }[] = [];
    const count = 22;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const ring = 0.85 + Math.random() * 0.15;
      const y = 0.55 + Math.random() * 0.35;
      arr.push({
        p: [Math.cos(a) * ring * 0.9, y, Math.sin(a) * ring * 0.7],
        r: [Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9 + (Math.random() - 0.5)],
        s: [1, 1 + Math.random() * 0.8, 1],
      });
    }
    return arr;
  }, [color]);
  return (
    <group>
      {tufts.map((t, i) => (
        <HairTuft key={i} position={t.p} rotation={t.r} scale={t.s} color={color} />
      ))}
      <mesh position={[0, 0.55, -0.15]}>
        <sphereGeometry args={[0.92, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
    </group>
  );
}

function Hair({ style, color }: { style: CharacterAppearance["hairStyle"]; color: string }) {
  const mat = <meshStandardMaterial color={color} roughness={0.85} flatShading />;

  if (style === "bald") return null;
  if (style === "wild") return <WildHair color={color} />;

  if (style === "bun") {
    return (
      <group>
        <mesh position={[0, 0.5, -0.1]}>
          <sphereGeometry args={[0.95, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          {mat}
        </mesh>
        <mesh position={[0, 0.95, -0.25]}>
          <sphereGeometry args={[0.32, 16, 16]} />
          {mat}
        </mesh>
      </group>
    );
  }

  if (style === "swept") {
    return (
      <group>
        <mesh position={[0, 0.52, -0.05]} rotation={[0, 0, -0.15]}>
          <sphereGeometry args={[0.94, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          {mat}
        </mesh>
        <mesh position={[0.35, 0.75, 0.5]} rotation={[0.3, 0, -0.6]}>
          <boxGeometry args={[0.9, 0.25, 0.7]} />
          {mat}
        </mesh>
      </group>
    );
  }

  if (style === "long") {
    return (
      <group>
        <mesh position={[0, 0.5, -0.1]}>
          <sphereGeometry args={[0.96, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          {mat}
        </mesh>
        <mesh position={[0.72, -0.2, -0.1]} rotation={[0, 0, 0.1]}>
          <capsuleGeometry args={[0.28, 1.1, 8, 16]} />
          {mat}
        </mesh>
        <mesh position={[-0.72, -0.2, -0.1]} rotation={[0, 0, -0.1]}>
          <capsuleGeometry args={[0.28, 1.1, 8, 16]} />
          {mat}
        </mesh>
      </group>
    );
  }

  return (
    <mesh position={[0, 0.5, -0.1]}>
      <sphereGeometry args={[0.98, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
      {mat}
    </mesh>
  );
}

export function HeadMesh({
  appearance,
  speaking = 0,
  liveliness = 1,
  targetPosition = [0, 0, 0],
  targetScale = 1.1,
  emotion = "base",
  speakAnimation = "brows",
}: HeadMeshProps) {
  const group = useRef<THREE.Group>(null);
  const leftEye = useRef<THREE.Group>(null);
  const rightEye = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Mesh>(null);
  const leftBrow = useRef<THREE.Mesh>(null);
  const rightBrow = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      const targetY = pointer.x * 0.5;
      const targetX = -pointer.y * 0.3;
      group.current.rotation.y += (targetY - group.current.rotation.y) * 0.06;
      group.current.rotation.x += (targetX - group.current.rotation.x) * 0.06;
      
      // Interpolate position
      group.current.position.x += (targetPosition[0] - group.current.position.x) * 0.08;
      group.current.position.y += (targetPosition[1] + Math.sin(t * 1.4) * 0.04 * liveliness - group.current.position.y) * 0.08;
      group.current.position.z += (targetPosition[2] - group.current.position.z) * 0.08;

      // Interpolate scale
      const currentScaleX = group.current.scale.x;
      const diffScale = (targetScale - currentScaleX) * 0.08;
      group.current.scale.set(
        group.current.scale.x + diffScale,
        group.current.scale.y + diffScale,
        group.current.scale.z + diffScale
      );

      group.current.rotation.z = Math.sin(t * 0.9) * 0.02 * liveliness;
    }
    const ex = pointer.x * 0.06;
    const ey = pointer.y * 0.05;
    if (leftEye.current) leftEye.current.position.set(-0.28 + ex, 0.12 + ey, 0.82);
    if (rightEye.current) rightEye.current.position.set(0.28 + ex, 0.12 + ey, 0.82);
    if (jaw.current) {
      const openTarget = speakAnimation === "jaw"
        ? 0.05 + speaking * 0.32 + (speaking > 0.02 ? Math.sin(t * 22) * 0.06 * speaking : 0)
        : 0.05;
      const s = jaw.current.scale;
      s.y += (Math.max(0.08, openTarget) - s.y) * 0.4;
    }
    if (leftBrow.current && rightBrow.current) {
      const isTalking = speaking > 0.02;
      const browYTarget = eyebrowY + (speakAnimation === "brows" && isTalking
        ? Math.abs(Math.sin(t * 10)) * 0.12 * speaking
        : 0);
      leftBrow.current.position.y += (browYTarget - leftBrow.current.position.y) * 0.8;
      rightBrow.current.position.y += (browYTarget - rightBrow.current.position.y) * 0.8;
    }
  });

  const skinMat = useMemo(
    () => <meshStandardMaterial color={appearance.skin} roughness={0.75} />,
    [appearance.skin]
  );

  // Dynamic eyebrow and eye styling based on emotion
  const { leftEyebrowRotation, rightEyebrowRotation, eyebrowY, eyeScale } = useMemo(() => {
    let leftEyebrowRotation: [number, number, number] = [0, 0, 0.1];
    let rightEyebrowRotation: [number, number, number] = [0, 0, -0.1];
    let eyebrowY = 0.36;
    let eyeScale: [number, number, number] = [1, 1.15, 0.6];

    if (emotion === "feliz") {
      leftEyebrowRotation = [0, 0, 0.25];
      rightEyebrowRotation = [0, 0, -0.25];
      eyebrowY = 0.41;
      eyeScale = [1.05, 1.25, 0.6];
    } else if (emotion === "enojado") {
      leftEyebrowRotation = [0.15, 0, -0.18];
      rightEyebrowRotation = [0.15, 0, 0.18];
      eyebrowY = 0.28;
      eyeScale = [1, 0.85, 0.6]; // squint
    } else if (emotion === "triste") {
      leftEyebrowRotation = [0, 0, -0.16];
      rightEyebrowRotation = [0, 0, 0.16];
      eyebrowY = 0.39;
      eyeScale = [1, 1.05, 0.6];
    }

    return { leftEyebrowRotation, rightEyebrowRotation, eyebrowY, eyeScale };
  }, [emotion]);

  return (
    <group ref={group} scale={1.1}>
      {/* Craneo */}
      <mesh castShadow scale={[1, 1.08, 0.95]}>
        <sphereGeometry args={[0.95, 48, 48]} />
        {skinMat}
      </mesh>

      {/* Orejas */}
      <mesh position={[-0.92, 0, 0]} scale={[0.5, 0.7, 0.5]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        {skinMat}
      </mesh>
      <mesh position={[0.92, 0, 0]} scale={[0.5, 0.7, 0.5]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        {skinMat}
      </mesh>

      {/* Nariz */}
      <mesh position={[0, -0.05, 0.92]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.16, 0.4, 12]} />
        {skinMat}
      </mesh>

      {/* Ojos */}
      <group ref={leftEye} position={[-0.28, 0.12, 0.82]}>
        <mesh scale={eyeScale}>
          <sphereGeometry args={[0.19, 20, 20]} />
          <meshStandardMaterial color="#f7f3ea" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.12]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color={appearance.eyeColor} roughness={0.3} />
        </mesh>
        <mesh position={[0.02, 0.02, 0.19]}>
          <sphereGeometry args={[0.03, 10, 10]} />
          <meshStandardMaterial color="#000" />
        </mesh>
      </group>
      <group ref={rightEye} position={[0.28, 0.12, 0.82]}>
        <mesh scale={eyeScale}>
          <sphereGeometry args={[0.19, 20, 20]} />
          <meshStandardMaterial color="#f7f3ea" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.12]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color={appearance.eyeColor} roughness={0.3} />
        </mesh>
        <mesh position={[-0.02, 0.02, 0.19]}>
          <sphereGeometry args={[0.03, 10, 10]} />
          <meshStandardMaterial color="#000" />
        </mesh>
      </group>

      {/* Cejas */}
      <mesh ref={leftBrow} position={[-0.28, eyebrowY, 0.86]} rotation={leftEyebrowRotation}>
        <boxGeometry args={[0.28, 0.05, 0.08]} />
        <meshStandardMaterial color={appearance.hair} roughness={0.9} />
      </mesh>
      <mesh ref={rightBrow} position={[0.28, eyebrowY, 0.86]} rotation={rightEyebrowRotation}>
        <boxGeometry args={[0.28, 0.05, 0.08]} />
        <meshStandardMaterial color={appearance.hair} roughness={0.9} />
      </mesh>

      {/* Boca */}
      <mesh ref={jaw} position={[0, -0.42, 0.84]} scale={[1, 0.12, 1]}>
        <boxGeometry args={[0.34, 0.5, 0.12]} />
        <meshStandardMaterial color="#5a2a24" roughness={0.6} />
      </mesh>

      {/* Bigote */}
      {appearance.mustache && (
        <group position={[0, -0.24, 0.86]}>
          <mesh position={[-0.16, 0, 0]} rotation={[0, 0, -0.3]}>
            <capsuleGeometry args={[0.07, 0.28, 6, 12]} />
            <meshStandardMaterial color={appearance.hair} roughness={0.95} flatShading />
          </mesh>
          <mesh position={[0.16, 0, 0]} rotation={[0, 0, 0.3]}>
            <capsuleGeometry args={[0.07, 0.28, 6, 12]} />
            <meshStandardMaterial color={appearance.hair} roughness={0.95} flatShading />
          </mesh>
        </group>
      )}

      {/* Barba */}
      {appearance.beard && (
        <mesh position={[0, -0.6, 0.5]} scale={[0.9, 1, 0.7]}>
          <sphereGeometry args={[0.55, 20, 20, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.5]} />
          <meshStandardMaterial color={appearance.hair} roughness={0.95} flatShading />
        </mesh>
      )}

      {/* Gafas */}
      {appearance.glasses && (
        <group position={[0, 0.12, 0.92]}>
          <mesh position={[-0.28, 0, 0]}>
            <torusGeometry args={[0.22, 0.03, 12, 24]} />
            <meshStandardMaterial color="#2a2018" metalness={0.4} roughness={0.4} />
          </mesh>
          <mesh position={[0.28, 0, 0]}>
            <torusGeometry args={[0.22, 0.03, 12, 24]} />
            <meshStandardMaterial color="#2a2018" metalness={0.4} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.16, 0.03, 0.03]} />
            <meshStandardMaterial color="#2a2018" metalness={0.4} roughness={0.4} />
          </mesh>
        </group>
      )}

      {/* Ropa */}
      <mesh position={[0, -1.05, 0]}>
        <cylinderGeometry args={[0.35, 0.55, 0.5, 24]} />
        {skinMat}
      </mesh>
      <mesh position={[0, -1.45, 0]}>
        <cylinderGeometry args={[0.75, 0.95, 0.5, 24]} />
        <meshStandardMaterial color={appearance.accent} roughness={0.7} />
      </mesh>

      <Hair style={appearance.hairStyle} color={appearance.hair} />
    </group>
  );
}
