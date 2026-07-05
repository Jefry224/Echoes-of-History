import { useState, useEffect } from "react";
import { 
  Sparkles, 
  GraduationCap, 
  Cpu, 
  Mic, 
  FileJson, 
  Volume2, 
  Play, 
  Mail, 
  ChevronRight 
} from "lucide-react";

// Slide 2 Glassmorphism Cards data
const OBJECTIVES = [
  {
    icon: GraduationCap,
    title: "1. Aprendizaje Inmersivo",
    body: "Sáltate los libros. Entrevista a los protagonistas de la historia cara a cara sin interfaces de chat de texto aburridas.",
  },
  {
    icon: Sparkles,
    title: "2. Examen de Certificación",
    body: "Enfréntate a 'Misiones Históricas'. Debate, convence a los líderes y gana diplomas firmados digitalmente por ellos.",
  },
  {
    icon: Cpu,
    title: "3. Retención a Largo Plazo",
    body: "Conecta la inmersión con tu flujo de estudio. Exporta tus charlas directamente a tarjetas de memoria para Obsidian o Anki.",
  },
];

// Slide 3 Flowchart nodes
const PIPELINE_NODES = [
  { label: "Voz Usuario (VAD)", desc: "Web Audio analiza tu voz", icon: Mic },
  { label: "OpenAI Codex", desc: "Razonamiento histórico", icon: FileJson },
  { label: "ElevenLabs (Stream)", desc: "Voz sintética ultra-realista", icon: Volume2 },
  { label: "Método Marioneta", desc: "Video gesticulado a 60fps", icon: Play },
  { label: "n8n (Flashcards)", desc: "Automatización y exportación", icon: Mail },
];

export function HowItWorks() {
  const [activeNode, setActiveNode] = useState(0);

  // Auto cycling flow node highlight to show active data pipeline flow
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNode((n) => (n + 1) % PIPELINE_NODES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div id="como-funciona" className="w-full bg-transparent z-30 relative select-none text-white">
      
      {/* 
        SLIDE 2: Propósito Educativo Avanzado (Objetivos)
      */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest block mb-2 font-bold">
            [ SLIDE 02 / METAS PEDAGÓGICAS ]
          </span>
          <h2 className="text-balance text-4xl font-black uppercase tracking-tight md:text-5xl text-white">
            Propósito Educativo Avanzado
          </h2>
          <p className="mt-4 text-pretty text-sm md:text-base leading-relaxed text-neutral-400 font-sans">
            Una plataforma diseñada para redefinir el aprendizaje inmersivo y la retención del conocimiento mediante gamificación activa.
          </p>
        </div>

        {/* 3 Grid Glassmorphism Cards (Dark themed) */}
        <div className="grid gap-6 md:grid-cols-3">
          {OBJECTIVES.map((o) => (
            <div
              key={o.title}
              className="glass-panel group relative rounded-3xl p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-white/10"
            >
              <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-black/60 text-white">
                <o.icon className="size-6" />
              </div>
              <h3 className="mb-3 text-lg font-bold uppercase tracking-tight text-white">{o.title}</h3>
              <p className="text-xs leading-relaxed text-neutral-400 font-sans">{o.body}</p>
              
              {/* Bottom decorative bar */}
              <div className="absolute bottom-0 left-8 right-8 h-[2px] rounded-full bg-white/10 group-hover:bg-white/30 transition-colors" />
            </div>
          ))}
        </div>
      </section>

      {/* 
        SLIDE 3: Arquitectura e Integración de Patrocinadores (El Pipeline)
      */}
      <section className="mx-auto max-w-6xl px-6 py-24 border-t border-white/10">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest block mb-2 font-bold">
            [ SLIDE 03 / PIPELINE DE INTEGRACIÓN ]
          </span>
          <h2 className="text-balance text-4xl font-black uppercase tracking-tight md:text-5xl text-white">
            Arquitectura del Flujo de Datos
          </h2>
          <p className="mt-4 text-pretty text-sm md:text-base leading-relaxed text-neutral-400 font-sans">
            Todo el recorrido tecnológico de tu voz, desde la detección de actividad hasta la automatización final.
          </p>
        </div>

        {/* Interactive Flow Diagram (Dark themed) */}
        <div className="overflow-x-auto pb-2 -mx-2 px-2">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-3 lg:gap-2 p-6 md:p-8 rounded-3xl border border-white/10 bg-black/50 backdrop-blur z-10 relative w-full lg:w-max lg:max-w-full lg:mx-auto">
          {PIPELINE_NODES.map((node, i) => {
            const isActive = activeNode === i;
            const Icon = node.icon;
            
            return (
              <div key={i} className="flex flex-col lg:flex-row items-center w-full lg:w-auto shrink-0">
                {/* Node Box */}
                <div 
                  className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-500 w-full sm:max-w-xs lg:w-36 xl:w-40 shrink-0 ${
                    isActive 
                      ? "border-white bg-white text-black shadow-lg shadow-white/20 lg:scale-105" 
                      : "border-white/10 bg-black/60 text-white"
                  }`}
                >
                  <div className={`mb-3 flex size-10 items-center justify-center rounded-xl border ${isActive ? "border-black/10 bg-black/5 text-black" : "border-white/10 bg-white/5 text-neutral-200"}`}>
                    <Icon className="size-5" />
                  </div>
                  <h4 className="text-xs font-bold font-mono tracking-tight uppercase leading-snug">{node.label}</h4>
                  <p className={`mt-1 text-[9px] leading-normal font-sans ${isActive ? "text-neutral-700" : "text-neutral-400"}`}>{node.desc}</p>
                </div>

                {/* Connecting arrow (hidden on last node) */}
                {i < PIPELINE_NODES.length - 1 && (
                  <div className="flex items-center justify-center py-3 lg:py-0 lg:px-1.5 text-neutral-600 shrink-0">
                    <ChevronRight className="size-4 rotate-90 lg:rotate-0 transition-colors duration-500" style={{ color: isActive ? "#ffffff" : "inherit" }} />
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      </section>

    </div>
  );
}
