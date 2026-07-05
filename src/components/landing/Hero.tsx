import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import MagicRings from "@/components/MagicRings";

interface HeroProps {
  onEnterMuseum: () => void;
}

const HISTORICAL_NAMES = ["Albert Einstein", "Cleopatra VII", "Julio César", "Napoleón Bonaparte", "Jesús de Nazaret"];

export function Hero({ onEnterMuseum }: HeroProps) {
  const [typedText, setTypedText] = useState("");
  const [nameIdx, setNameIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter effect loop
  useEffect(() => {
    let timer: number;
    const currentName = HISTORICAL_NAMES[nameIdx];
    const fullText = `Entrevista a ${currentName}`;

    if (isDeleting) {
      // Erase character
      timer = window.setTimeout(() => {
        setTypedText((prev) => prev.slice(0, -1));
      }, 35);
    } else {
      // Type character
      timer = window.setTimeout(() => {
        setTypedText(fullText.slice(0, typedText.length + 1));
      }, 70);
    }

    // Switch states based on progress
    if (!isDeleting && typedText === fullText) {
      // Fully typed, pause then start deleting
      timer = window.setTimeout(() => setIsDeleting(true), 1500);
    } else if (isDeleting && typedText === "") {
      // Fully erased, swap name and start typing
      setIsDeleting(false);
      setNameIdx((prev) => (prev + 1) % HISTORICAL_NAMES.length);
    }

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, nameIdx]);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 bg-transparent text-white">

      {/* 
        Full-screen background Magic Rings portal (Dark theme)
        - CRITICAL: Changed to pointer-events-none so it DOES NOT block mouse scrolling or clicks,
          enabling Einstein's scroll-docking animation to trigger perfectly!
      */}
      <div className="absolute inset-0 w-full h-full -z-10 opacity-60 pointer-events-none">
        <MagicRings
          color="#ffffff"
          colorTwo="#cccccc"
          ringCount={8}
          speed={0.6}
          attenuation={9}
          lineThickness={1.6}
          baseRadius={0.18}
          radiusStep={0.09}
          scaleRate={0.09}
          opacity={0.35}
          followMouse={false}
          mouseInfluence={0.1}
          hoverScale={1.05}
          clickBurst={false}
        />
      </div>

      {/* Drifting blurry blobs (Glowing white lights for dark theme contrast) */}
      <div className="bg-blob w-[450px] h-[450px] bg-white/5 top-1/4 left-1/4 animate-pulse" style={{ filter: "blur(130px)" }} />
      <div className="bg-blob w-80 h-80 bg-white/5 top-10 right-10" style={{ animationDelay: "-3s" }} />
      <div className="bg-blob w-96 h-96 bg-white/5 bottom-10 left-10" style={{ animationDelay: "-6s" }} />

      {/* Large central background radial light glow matching the conversation view styling */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl animate-pulse"
        style={{
          background: "radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 45%, transparent 70%)",
          animationDuration: "10s"
        }}
      />

      {/* Hero Content Wrapper - high z-index (z-30) to remain fully clickable */}
      <div className="relative z-30 max-w-4xl flex flex-col items-center text-center pointer-events-auto">

        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/80 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-neutral-200 backdrop-blur">
          <span className="size-2 rounded-full bg-white animate-pulse" />
          Portal de Inmersión Histórica
        </p>

        {/* Massive Neon Gradient Title (Dark Theme) */}
        <h1 className="text-balance font-sans text-6xl font-black leading-[1.0] tracking-tight md:text-8xl uppercase text-white">
          Echoes of <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-300 to-neutral-500">History</span>
        </h1>

        {/* Dynamic Typewriter Subtitle */}
        <p className="mt-6 text-xl md:text-2xl font-mono text-neutral-200 min-h-[2.5rem]">
          {typedText}
          <span className="animate-pulse font-bold">|</span>
        </p>

        <p className="mt-3 max-w-xl text-pretty text-sm md:text-base leading-relaxed text-neutral-400 font-sans">
          Cruza el portal y dialoga directamente con los protagonistas del pasado y personajes históricos en llamadas tridimensionales e interactivas.
        </p>
      </div>

      {/* 
        EXPANDED CENTERPIECE SPACER:
        - Reserved for Einstein's 3D head model
      */}
      <div className="relative my-8 h-80 w-80 md:h-[380px] md:w-[380px] flex items-center justify-center z-10 pointer-events-none">
        {/* Soft center glow backplate */}
        <div className="absolute inset-4 bg-gradient-to-b from-white/5 to-transparent rounded-full blur-xl animate-pulse pointer-events-none" />
      </div>

      {/* Action Buttons Wrapper - high z-index (z-30) to ensure clicks pass cleanly */}
      <div className="relative z-30 flex flex-col items-center gap-4 sm:flex-row pointer-events-auto">
        <button
          onClick={onEnterMuseum}
          className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-white text-black hover:bg-black hover:text-white border border-white px-10 text-lg font-black transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-white/5"
        >
          Llamar al Pasado 📞
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1.5" />
        </button>
        <a
          href="#como-funciona"
          className="inline-flex h-14 items-center justify-center rounded-full border border-neutral-800 bg-black/30 px-6 text-sm text-neutral-400 hover:text-white hover:border-white transition-all font-mono"
        >
          Cómo funciona
        </a>
      </div>

      <p className="relative z-30 mt-4 text-xs text-neutral-400 font-mono">
        Sigue a Albert por la pantalla: te irá dando indicaciones.
      </p>
    </section>
  );
}
