import { useState } from "react";
import { HeadScene } from "@/components/three/HeadScene";
import { CHARACTERS } from "@/lib/characters";
import type { Character } from "@/lib/characters";
import { Conversation } from "./Conversation";
import { ArrowLeft } from "lucide-react";

interface GalleryProps {
  onBack: () => void;
}

export function Gallery({ onBack }: GalleryProps) {
  const [selected, setSelected] = useState<Character | null>(null);

  if (selected) {
    return <Conversation character={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden px-6 py-10 bg-black text-white select-none">
      
      {/* Background drifting blobs (Modern minimalist white glows) */}
      <div className="bg-blob w-96 h-96 bg-white/5 top-10 left-10" />
      <div className="bg-blob w-[450px] h-[450px] bg-white/5 bottom-10 right-10" style={{ animationDelay: "-6s" }} />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-20 cyber-grid" />

      <div className="mx-auto max-w-6xl">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition cursor-pointer font-mono"
        >
          <ArrowLeft className="size-4" />
          Volver al inicio
        </button>

        <div className="mx-auto mt-8 max-w-2xl text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-neutral-950/60 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-neutral-300 backdrop-blur">
            <span className="size-1.5 rounded-full bg-white animate-pulse" />
            Modo Prueba
          </p>
          <h1 className="text-balance text-4xl font-black uppercase tracking-tight md:text-5xl text-white">
            Toca una cabeza para conversar
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-neutral-400">
            Flotan en el vacío del tiempo. Elige una mente y háblale con tu voz.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CHARACTERS.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="group relative flex flex-col items-center rounded-3xl border border-neutral-800 bg-neutral-950/50 p-6 backdrop-blur transition-all duration-500 hover:border-white/35 hover:bg-neutral-900/10 cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-white/5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* 3D floating character head */}
              <div className="h-52 w-full">
                <HeadScene appearance={c.appearance} className="h-full w-full" cameraZ={4.2} />
              </div>
              <h2 className="mt-2 text-xl font-bold uppercase tracking-tight text-white">{c.name}</h2>
              <p className="text-xs font-mono text-neutral-400 uppercase font-bold tracking-wider">{c.title}</p>
              <p className="text-xs text-neutral-500 mt-0.5 font-mono">{c.era}</p>
              <span className="mt-4 rounded-full border border-white/20 px-6 py-1.5 text-xs font-mono font-bold text-neutral-300 transition-all group-hover:bg-white group-hover:text-black">
                Conversar
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
