import { CHARACTERS } from "@/lib/characters";
import type { Character } from "@/lib/characters";
import { HeadScene } from "@/components/three/HeadScene";
import { ArrowRight } from "lucide-react";


interface CharacterPreviewProps {
  onEnterMuseum: () => void;
}

const MARQUEE_ROWS = [
  { characters: CHARACTERS.slice(0, 5), direction: "left" as const, duration: "34s" },
  { characters: CHARACTERS.slice(5, 9), direction: "right" as const, duration: "28s" },
  { characters: CHARACTERS.slice(9), direction: "left" as const, duration: "30s" },
];

function CharacterMarqueeCard({ character }: { character: Character }) {
  return (
    <article
      aria-label={character.name}
      className="group/card relative overflow-hidden flex-none w-56 min-h-[112px] rounded-3xl border border-neutral-800 bg-neutral-950/40 text-left backdrop-blur transition-all duration-300 hover:border-white/30 hover:bg-neutral-900/10 hover:shadow-2xl hover:shadow-white/5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[52%] overflow-hidden opacity-25 transition-opacity duration-300 group-hover/card:opacity-70"
        style={{
          maskImage: "linear-gradient(to right, black 55%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, black 55%, transparent 100%)",
        }}
      >
        {character.previewUrl ? (
          <img
            src={character.previewUrl}
            alt={character.name}
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        ) : (
          <div className="absolute inset-y-0 left-[-18%] w-[140%]">
            <HeadScene
              appearance={character.appearance}
              className="h-full w-full"
              cameraZ={3.6}
              quality="low"
              float={false}
              targetPosition={[0.35, -0.05, 0]}
              targetScale={1.05}
            />
          </div>
        )}
        <div
          className="absolute inset-0 mix-blend-soft-light opacity-40"
          style={{ background: `linear-gradient(135deg, ${character.appearance.accent}55, transparent 70%)` }}
        />
      </div>

      <div className="relative z-10 flex flex-col justify-center min-h-[112px] pl-[46%] pr-4 py-4">
        <h3 className="text-sm font-bold uppercase tracking-tight leading-tight text-white">
          {character.name}
        </h3>
        <p className="mt-1 text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider">
          {character.title}
        </p>
      </div>
    </article>
  );
}

export function CharacterPreview({ onEnterMuseum }: CharacterPreviewProps) {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24 z-30 overflow-hidden">

      <div className="bg-blob w-72 h-72 bg-white/5 bottom-10 left-10" style={{ animationDelay: "-3s" }} />

      <div className="relative mx-auto max-w-2xl text-center z-10">
        <span className="text-neutral-400 font-mono text-xs uppercase tracking-widest block mb-2 font-bold">
          [ 03 / TEMPORAL NODES INDEX ]
        </span>
        <h2 className="text-balance text-4xl font-black uppercase tracking-tight md:text-5xl text-white">
          Quiénes te esperan
        </h2>
        <p className="mt-4 text-pretty text-base md:text-lg leading-relaxed text-neutral-400">
          {CHARACTERS.length} figuras históricas, {CHARACTERS.length} voces y universos de conocimiento listos para tu curiosidad.
        </p>
      </div>

      <div className="relative mt-14 flex flex-col gap-5 z-10">
        {MARQUEE_ROWS.map((row, rowIdx) => {
          const track = [...row.characters, ...row.characters];
          const animation = row.direction === "left" ? "marquee-left" : "marquee-right";

          return (
            <div
              key={rowIdx}
              className="relative overflow-hidden rounded-2xl"
              style={{
                maskImage: "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
              }}
            >
              <div
                className="flex gap-4 w-max hover:[animation-play-state:paused]"
                style={{ animation: `${animation} ${row.duration} linear infinite` }}
              >
                {track.map((character, idx) => (
                  <CharacterMarqueeCard key={`${character.id}-${idx}`} character={character} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative mt-12 flex justify-center z-10">
        <button
          onClick={onEnterMuseum}
          className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white text-black hover:bg-transparent hover:text-white border border-white px-8 text-base font-extrabold transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-white/5"
        >
          Entrar al museo
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
}
