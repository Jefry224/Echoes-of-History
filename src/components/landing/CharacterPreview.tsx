import { CHARACTERS } from "@/lib/characters";
import { ArrowRight } from "lucide-react";

interface CharacterPreviewProps {
  onEnterMuseum: () => void;
}

export function CharacterPreview({ onEnterMuseum }: CharacterPreviewProps) {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-24 bg-black z-30">
      
      {/* Background blob (Sleek white light) */}
      <div className="bg-blob w-72 h-72 bg-white/5 bottom-10 left-10" style={{ animationDelay: "-3s" }} />

      <div className="mx-auto max-w-2xl text-center z-10">
        <span className="text-neutral-400 font-mono text-xs uppercase tracking-widest block mb-2 font-bold">
          [ 03 / TEMPORAL NODES INDEX ]
        </span>
        <h2 className="text-balance text-4xl font-black uppercase tracking-tight md:text-5xl text-white">
          Quiénes te esperan
        </h2>
        <p className="mt-4 text-pretty text-base md:text-lg leading-relaxed text-neutral-400">
          Seis figuras históricas, seis voces, seis universos de conocimiento listos para tu curiosidad.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-3 z-10 relative">
        {CHARACTERS.map((c) => (
          <div
            key={c.id}
            className="rounded-3xl border border-neutral-800 bg-neutral-950/40 p-6 text-center backdrop-blur transition-all duration-300 hover:border-white/30 hover:bg-neutral-900/10 hover:shadow-2xl hover:shadow-white/5"
          >
            <div
              className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full text-2xl font-mono font-black border-2 shadow-lg"
              style={{ borderColor: c.appearance.accent, backgroundColor: "#111111", color: "#ffffff" }}
            >
              {c.name.charAt(0)}
            </div>
            <h3 className="text-lg font-bold uppercase tracking-tight leading-tight text-white">{c.name}</h3>
            <p className="mt-1 text-xs font-mono text-neutral-400 uppercase font-bold tracking-wider">{c.title}</p>
            <p className="mt-1 text-xs text-neutral-500 font-mono">{c.era}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex justify-center z-10 relative">
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
