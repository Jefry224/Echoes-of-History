import { useEffect } from "react";
import type { Character } from "@/lib/characters";
import { HeadScene } from "@/components/three/HeadScene";
import { preloadCharacterModel } from "@/components/three/CharacterModel";

interface VideoPuppetProps {
  character: Character;
  isSpeaking: boolean;
  speakingLevel: number;
  emotion?: "base" | "feliz" | "enojado" | "triste";
  fillHeight?: boolean;
}

export function VideoPuppet({ character, isSpeaking, speakingLevel, emotion = "base", fillHeight = false }: VideoPuppetProps) {
  const hasModel = !!character.modelUrl;

  useEffect(() => {
    if (hasModel) {
      preloadCharacterModel(character.modelUrl!);
      console.log("[VideoPuppet] Preloading GLB model:", character.modelUrl);
    } else {
      console.log("[VideoPuppet] Sin GLB — usando HeadMesh procedural para:", character.id);
    }
  }, [character.modelUrl, hasModel, character.id]);

  return (
    <div className="relative w-full h-full bg-neutral-950 flex items-center justify-center overflow-hidden">

      {/* Video fallback — solo se muestra si el personaje NO tiene modelo GLB */}
      {!hasModel && (
        <>
          <video
            src={`/assets/videos/${character.id}_escuchando.mp4`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-0 -z-20"
            style={{ opacity: isSpeaking ? 0 : 1 }}
            loop muted playsInline autoPlay
          />
          <video
            src={`/assets/videos/${character.id}_hablando.mp4`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-0 -z-20"
            style={{ opacity: isSpeaking ? 1 : 0 }}
            loop muted playsInline autoPlay
          />
        </>
      )}

      {/* Modelo 3D — GLB con morph targets si disponible, HeadMesh procedural si no */}
      <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center">
        <HeadScene
          appearance={character.appearance}
          modelUrl={character.modelUrl}
          speaking={speakingLevel}
          className={fillHeight ? "w-full h-full" : "w-full h-full max-h-[72%]"}
          float
          cameraZ={character.modelUrl ? 5.5 : 4.8}
          emotion={emotion}
        />
      </div>

    </div>
  );
}
