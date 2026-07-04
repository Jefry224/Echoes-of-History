import type { Character } from "@/lib/characters";
import { HeadScene } from "@/components/three/HeadScene";

interface VideoPuppetProps {
  character: Character;
  isSpeaking: boolean;
  speakingLevel: number;
}

export function VideoPuppet({ character, isSpeaking, speakingLevel }: VideoPuppetProps) {
  // Video paths based on character id
  const listeningVideoSrc = `/assets/videos/${character.id}_escuchando.mp4`;
  const speakingVideoSrc = `/assets/videos/${character.id}_hablando.mp4`;

  return (
    <div className="relative w-full h-full bg-neutral-950 flex items-center justify-center overflow-hidden">
      
      {/* 
        MÉTODO MARIONETA (Puppet Method):
        - Video A (escuchando.mp4): loops mouth closed. Opacity = 1 when quiet.
        - Video B (hablando.mp4): loops mouth moving. Opacity = 1 when speaking.
        - Instant 0ms opacity switch controlled by isSpeaking.
      */}
      <video
        src={listeningVideoSrc}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-0 -z-20"
        style={{ opacity: isSpeaking ? 0 : 1 }}
        loop
        muted
        playsInline
        autoPlay
      />
      
      <video
        src={speakingVideoSrc}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-0 -z-20"
        style={{ opacity: isSpeaking ? 1 : 0 }}
        loop
        muted
        playsInline
        autoPlay
      />

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
