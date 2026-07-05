import type { Character } from "@/lib/characters";
import { HeadScene } from "@/components/three/HeadScene";

interface VideoPuppetProps {
  character: Character;
  isSpeaking: boolean;
  speakingLevel: number;
  emotion?: "base" | "feliz" | "enojado" | "triste";
}

export function VideoPuppet({ character, isSpeaking, speakingLevel, emotion = "base" }: VideoPuppetProps) {
  return (
    <div className="relative w-full h-full bg-neutral-950 flex items-center justify-center overflow-hidden">
      
      {/* 
        3D INTERACTIVE MODEL LAYER:
        - Primary visual asset rendering the real-time lip-synced and interactive 3D head scene!
      */}
      <div className="absolute inset-0 w-full h-full z-10">
        <HeadScene
          appearance={character.appearance}
          speaking={speakingLevel}
          className="h-full w-full"
          float
          cameraZ={4.8}
          emotion={emotion}
        />
      </div>

      {/* Real-time speech ripple rings overlay */}
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="absolute size-44 rounded-full border border-white/10 animate-ping" />
          <div className="absolute size-52 rounded-full border border-white/5 animate-pulse" />
        </div>
      )}

    </div>
  );
}
