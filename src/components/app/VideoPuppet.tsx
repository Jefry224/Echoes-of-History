import type { Character } from "@/lib/characters";
import { HeadScene } from "@/components/three/HeadScene";

interface VideoPuppetProps {
  character: Character;
  isSpeaking: boolean;
  speakingLevel: number;
  emotion?: "base" | "feliz" | "enojado" | "triste";
  fillHeight?: boolean;
}

export function VideoPuppet({ character, speakingLevel, emotion = "base", fillHeight = false }: VideoPuppetProps) {
  return (
    <div className="relative w-full h-full bg-neutral-950 flex items-center justify-center overflow-hidden">
      
      {/* 
        3D INTERACTIVE MODEL LAYER:
        - Primary visual asset rendering the real-time lip-synced and interactive 3D head scene!
      */}
      <div className="absolute inset-0 w-full h-full z-10">
        <HeadScene
          appearance={character.appearance}
          modelUrl={character.modelUrl}
          speaking={speakingLevel}
          className={fillHeight ? "w-full h-full" : "w-full h-full max-h-[72%]"}
          float
          cameraZ={character.modelUrl ? 5.5 : 4.8}
          emotion={emotion}
          speakAnimation={character.id === "einstein" ? "jaw" : "brows"}
        />
      </div>

    </div>
  );
}
