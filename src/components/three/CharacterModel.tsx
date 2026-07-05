import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface CharacterModelProps {
  url: string;
  speaking?: number;
  targetPosition?: [number, number, number];
  targetScale?: number;
  emotion?: "base" | "feliz" | "enojado" | "triste";
  speakAnimation?: "jaw" | "brows";
}

function normalizeModel(scene: THREE.Object3D) {
  const clone = scene.clone(true);

  clone.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const box = new THREE.Box3().setFromObject(clone);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2.4 / maxDim;

  clone.position.x -= center.x;
  clone.position.y -= center.y + size.y * 0.28;
  clone.position.z -= center.z;
  clone.scale.setScalar(scale);

  return clone;
}

function findMorphMesh(root: THREE.Object3D): THREE.Mesh | null {
  let found: THREE.Mesh | null = null;
  root.traverse((child) => {
    if (!found && child instanceof THREE.Mesh && child.morphTargetInfluences?.length) {
      found = child;
    }
  });
  return found;
}

export function CharacterModel({
  url,
  speaking = 0,
  targetPosition = [0, 0, 0],
  targetScale = 1,
  emotion = "base",
  speakAnimation = "brows",
}: CharacterModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);
  const { pointer } = useThree();

  const { model, morphMesh, jawIdx, browsIdx } = useMemo(() => {
    const m = normalizeModel(scene);
    const mesh = findMorphMesh(m);
    const dict = mesh?.morphTargetDictionary ?? {};
    const jawIdx   = dict["jawOpen"]  ?? dict["jaw_open"]  ?? dict["Jaw"]     ?? -1;
    const browsIdx = dict["browsUp"]  ?? dict["brow_up"]   ?? dict["BrowsUp"] ?? -1;

    console.log("[CharacterModel] GLB cargado:", url);
    console.log("[CharacterModel] Mesh con morph targets:", mesh?.name ?? "ninguno");
    console.log("[CharacterModel] morphTargetDictionary:", dict);
    console.log("[CharacterModel] jawIdx:", jawIdx, "| browsIdx:", browsIdx);

    return { model: m, morphMesh: mesh, jawIdx, browsIdx };
  }, [scene, url]);

  useFrame((state) => {
    if (!group.current) return;

    const t = state.clock.elapsedTime;
    const g = group.current;

    const targetY = pointer.x * 0.45;
    const targetX = -pointer.y * 0.25;

    let emotionTiltX = 0;
    let emotionTiltZ = 0;

    if (emotion === "feliz") {
      emotionTiltX = -0.06;
      emotionTiltZ = Math.sin(t * 2) * 0.02;
    } else if (emotion === "enojado") {
      emotionTiltX = 0.08;
      emotionTiltZ = 0.04;
    } else if (emotion === "triste") {
      emotionTiltX = 0.1;
      emotionTiltZ = -0.03;
    }

    const isTalking = speaking > 0.02;
    const speakNod   = isTalking ? Math.sin(t * 14) * 0.018 * speaking : 0;
    const speakTiltZ = isTalking ? Math.sin(t * 11 + 1) * 0.012 * speaking : 0;
    const idleBreath = Math.sin(t * 1.4) * 0.03;

    g.rotation.y += (targetY - g.rotation.y) * 0.06;
    g.rotation.x += (targetX + emotionTiltX + speakNod - g.rotation.x) * 0.12;
    g.rotation.z += (emotionTiltZ + speakTiltZ + Math.sin(t * 0.9) * 0.012 - g.rotation.z) * 0.10;

    g.position.x += (targetPosition[0] - g.position.x) * 0.08;
    g.position.y += (targetPosition[1] + idleBreath - g.position.y) * 0.08;
    g.position.z += (targetPosition[2] - g.position.z) * 0.08;

    g.scale.setScalar(targetScale);

    if (morphMesh?.morphTargetInfluences) {
      const infl = morphMesh.morphTargetInfluences;

      if (jawIdx >= 0) {
        const jawTarget = speakAnimation === "jaw" && isTalking
          ? Math.min(1, speaking * 1.3 + Math.abs(Math.sin(t * 16)) * 0.4 * speaking)
          : 0;
        infl[jawIdx] += (jawTarget - infl[jawIdx]) * 0.3;
      }

      if (browsIdx >= 0) {
        const browsBase =
          emotion === "feliz"   ? 0.9 :
          emotion === "enojado" ? 0.0 :
          emotion === "triste"  ? 0.5 :
          0.2;
        const browsTarget = speakAnimation === "brows" && isTalking
          ? Math.min(1, browsBase + Math.abs(Math.sin(t * 10)) * 0.55 * speaking)
          : browsBase;
        infl[browsIdx] += (browsTarget - infl[browsIdx]) * 0.06;
      }
    } else if (isTalking && !g.userData._noMorphWarned) {
      console.warn("[CharacterModel] ⚠️ Sin morph targets — solo animación procedural activa.");
      g.userData._noMorphWarned = true;
    }
  });

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
}

export function preloadCharacterModel(url: string) {
  useGLTF.preload(url);
}
