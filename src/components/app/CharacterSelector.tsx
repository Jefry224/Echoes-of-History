import { useState, useEffect } from "react";
import { CHARACTERS } from "@/lib/characters";
import type { Character } from "@/lib/characters";
import { HeadScene } from "@/components/three/HeadScene";
import { ArrowLeft, ShieldCheck, HelpCircle, PhoneCall, Trash2, Swords } from "lucide-react";

interface CharacterSelectorProps {
  onBack: () => void;
  onStart: (char: Character, mode: "casual" | "mission", missionText?: string) => void;
  onStartDebate?: (char1: Character, char2: Character, topic: string) => void;
}

const MISSION_OBJECTIVES: Record<string, string[]> = {
  einstein: [
    "Convéncelo de la viabilidad de la energía nuclear pacífica frente a sus dudas éticas.",
    "Debate sobre el determinismo cuántico ('Dios no juega a los dados').",
    "Persuádelo de apoyar la carrera espacial temprana."
  ],
  cleopatra: [
    "Convéncela de aliarse con tu reino en lugar de Roma usando argumentos económicos.",
    "Negocia un tratado comercial para el trigo egipcio sin ceder soberanía.",
    "Disuádela de su relación política con Marco Antonio."
  ],
  cesar: [
    "Convéncelo de no cruzar el Rubicón y respetar la autoridad del Senado.",
    "Persuádelo para que acepte una monarquía constitucional.",
    "Adviértele de los idus de marzo con argumentos lógicos."
  ],
  napoleon: [
    "Convéncelo de no invadir Rusia en invierno usando argumentos logísticos.",
    "Sugiere una alianza estratégica con Inglaterra en lugar del bloqueo continental.",
    "Debate la implementación de su Código Civil en las colonias."
  ],
  jesus: [
    "Dialoga y convéncelo de integrar sus enseñanzas en la Alejandría helenística en vez de Judea.",
    "Debate sobre el papel de la riqueza material en una sociedad justa.",
    "Analiza la ética de la no violencia frente a la opresión romana."
  ],
  davinci: [
    "Convéncelo de patentar sus diseños militares y venderlos para financiar su ornitóptero.",
    "Persuádelo de terminar la Mona Lisa en lugar de iniciar nuevos proyectos.",
    "Debate sobre si el arte debe imitar a la naturaleza o superarla."
  ],
  curie: [
    "Convéncela de usar sus descubrimientos radiactivos en medicina de combate en el frente.",
    "Persuádela de patentar el proceso de aislamiento del radio por seguridad.",
    "Debate los peligros de la radiación y la necesidad de protección."
  ],
  shakespeare: [
    "Convéncelo de escribir una tragedia basada en el descubrimiento de América.",
    "Persuádelo para que cambie el final de Romeo y Julieta a uno feliz.",
    "Debate sobre la representación de la realeza en sus obras históricas."
  ],
  tesla: [
    "Convéncelo de asociarse con banqueros tradicionales para financiar Wardenclyffe.",
    "Persuádelo de priorizar inventos comerciales a corto plazo.",
    "Debate la superioridad de la corriente alterna frente a la directa."
  ],
  "michael-jackson": [
    "Convéncelo de hacer una colaboración con un artista clásico para fusionar géneros.",
    "Debate el impacto cultural del videoclip Thriller en la historia del entretenimiento.",
    "Persuádelo de donar los derechos de sus canciones a causas humanitarias."
  ],
  "linus-torvalds": [
    "Convéncelo de que una licencia más permisiva que la GPL aceleraría la adopción de Linux.",
    "Debate si el software propietario puede coexistir con el open source sin dañarlo.",
    "Persuádelo de priorizar la experiencia de usuario sobre la eficiencia del kernel."
  ],
  "adolf-hitler": [
    "Usa argumentos históricos y éticos para convencerlo de detener el programa de rearmamento.",
    "Debate las consecuencias económicas del Tratado de Versalles y propón alternativas diplomáticas.",
    "Adviértele con argumentos geopolíticos de las consecuencias de una guerra en dos frentes."
  ],
};

export function CharacterSelector({ onBack, onStart, onStartDebate }: CharacterSelectorProps) {
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [mode, setMode] = useState<"casual" | "mission" | "debate">("casual");
  const [selectedMissionIndex, setSelectedMissionIndex] = useState<number>(0);
  const [calling, setCalling] = useState(false);
  const [, forceUpdate] = useState(0);

  // Debate states
  const [selectedDebateChars, setSelectedDebateChars] = useState<Character[]>([]);
  const [debateTopic, setDebateTopic] = useState("");

  // After calling animation plays, transition to call
  useEffect(() => {
    if (!calling) return;
    if (mode === "debate" && selectedDebateChars.length !== 2) return;
    if (mode !== "debate" && !selectedChar) return;

    const t = setTimeout(() => {
      if (mode === "debate") {
        if (selectedDebateChars.length === 2 && debateTopic.trim() && onStartDebate) {
          onStartDebate(selectedDebateChars[0], selectedDebateChars[1], debateTopic.trim());
        }
      } else {
        if (selectedChar) {
          const activeMissions = MISSION_OBJECTIVES[selectedChar.id] || [];
          const missionText = mode === "mission" ? activeMissions[selectedMissionIndex] : undefined;
          onStart(selectedChar, mode, missionText);
        }
      }
    }, 2800);
    return () => clearTimeout(t);
  }, [calling, mode, selectedChar, selectedMissionIndex, selectedDebateChars, debateTopic, onStart, onStartDebate]);

  const handleConfirm = () => {
    if (mode === "debate") {
      if (selectedDebateChars.length === 2 && debateTopic.trim()) {
        setCalling(true);
      }
    } else {
      if (selectedChar) {
        setCalling(true);
      }
    }
  };

  const handleSelectChar = (c: Character) => {
    if (mode === "debate") {
      if (selectedDebateChars.some((char) => char.id === c.id)) {
        setSelectedDebateChars((prev) => prev.filter((char) => char.id !== c.id));
      } else {
        if (selectedDebateChars.length < 2) {
          setSelectedDebateChars((prev) => [...prev, c]);
        }
      }
    } else {
      setSelectedChar(c);
      setSelectedMissionIndex(0);
    }
  };

  const clearChatHistory = (e: React.MouseEvent, charId: string) => {
    e.stopPropagation();
    localStorage.removeItem(`echoes_chat_history_${charId}`);
    localStorage.removeItem(`echoes_reputation_${charId}`);
    forceUpdate((n) => n + 1);
  };

  const panelVisible = mode === "debate" ? selectedDebateChars.length > 0 : selectedChar !== null;
  const missions = selectedChar ? (MISSION_OBJECTIVES[selectedChar.id] || []) : [];

  return (
    <div className="min-h-screen text-white select-none">

      {/* === CALLING OVERLAY === */}
      {calling && (mode === "debate" ? selectedDebateChars.length === 2 : selectedChar !== null) && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute size-64 rounded-full border border-white/5 animate-ping" style={{ animationDuration: "1.5s" }} />
            <div className="absolute size-52 rounded-full border border-white/10 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="absolute size-40 rounded-full border border-white/15 animate-ping" style={{ animationDuration: "2.5s" }} />
            
            {mode === "debate" ? (
              <div className="flex gap-4 relative z-10">
                {selectedDebateChars.map((char) => (
                  <div
                    key={char.id}
                    className="relative flex size-20 items-center justify-center rounded-full border-2 bg-white/5 backdrop-blur-md shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                    style={{ borderColor: char.appearance.accent }}
                  >
                    <span className="text-xl font-black font-mono">{char.name.charAt(0)}</span>
                  </div>
                ))}
              </div>
            ) : (
              selectedChar && (
                <div
                  className="relative flex size-24 items-center justify-center rounded-full border-2 bg-white/5 backdrop-blur-md shadow-[0_0_60px_rgba(255,255,255,0.15)]"
                  style={{ borderColor: selectedChar.appearance.accent }}
                >
                  <PhoneCall className="size-10 text-white animate-pulse" />
                </div>
              )
            )}
          </div>
          <p className="text-neutral-400 text-xs font-mono uppercase tracking-widest mb-2">
            {mode === "debate" ? "Conectando debate" : "Conectando con"}
          </p>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white text-center px-6">
            {mode === "debate" 
              ? `${selectedDebateChars[0]?.name.split(" ")[0]} vs ${selectedDebateChars[1]?.name.split(" ")[0]}` 
              : selectedChar?.name
            }
          </h2>
          <p className="text-sm text-neutral-500 font-mono mt-1 text-center px-6">
            {mode === "debate" ? debateTopic : `${selectedChar?.title} — ${selectedChar?.era}`}
          </p>
          <div className="flex gap-2 mt-8">
            <span className="size-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="size-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="size-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}

      {/* === MAIN CONTENT === */}
      <div
        className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 transition-all duration-300"
        style={{ paddingBottom: panelVisible ? "clamp(220px, 38vh, 420px)" : "64px" }}
      >
        {/* Back */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition cursor-pointer mb-8"
        >
          <ArrowLeft className="size-4" />
          Volver a la Landing
        </button>

        {/* Title */}
        <div className="text-center mb-10">
          <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest block mb-2 font-bold animate-pulse">
            [ PANEL DE CONTROL TEMPORAL ]
          </span>
          <h1 className="text-balance text-4xl font-black uppercase tracking-tight md:text-5xl text-white">
            Elige a tu(s) personaje(s)
          </h1>
          <p className="mt-3 text-sm text-neutral-400 font-sans">
            Selecciona una figura histórica para configurar tu misión o debate.
          </p>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
          {CHARACTERS.map((c) => {
            const isSelected = mode === "debate"
              ? selectedDebateChars.some((char) => char.id === c.id)
              : selectedChar?.id === c.id;
            const debateIndex = selectedDebateChars.findIndex((char) => char.id === c.id);
            const hasHistory = typeof window !== "undefined" && !!localStorage.getItem(`echoes_chat_history_${c.id}`);
            return (
              <button
                key={c.id}
                onClick={() => handleSelectChar(c)}
                aria-pressed={isSelected}
                aria-label={`Seleccionar ${c.name}`}
                tabIndex={0}
                className={`relative overflow-hidden flex min-h-[112px] rounded-2xl border text-left transition-all duration-300 cursor-pointer group ${
                  isSelected
                    ? "border-white bg-white/8 shadow-md shadow-white/5"
                    : "border-neutral-800 bg-black/60 hover:border-neutral-600 hover:bg-neutral-900/50"
                }`}
              >
                {/* Avatar — half visible on the left */}
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-y-0 left-0 w-[52%] overflow-hidden transition-opacity duration-300 ${
                    isSelected ? "opacity-100" : "opacity-30 group-hover:opacity-65"
                  }`}
                  style={{
                    maskImage: "linear-gradient(to right, black 55%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to right, black 55%, transparent 100%)",
                  }}
                >
                  <div className="absolute inset-y-0 left-[-18%] w-[140%]">
                    <HeadScene
                      appearance={c.appearance}
                      className="h-full w-full"
                      cameraZ={3.6}
                      quality="low"
                      float={false}
                      targetPosition={[0.35, -0.05, 0]}
                      targetScale={1.05}
                    />
                  </div>
                  <div
                    className="absolute inset-0 mix-blend-soft-light opacity-40"
                    style={{ background: `linear-gradient(135deg, ${c.appearance.accent}55, transparent 70%)` }}
                  />
                </div>

                {/* Debate Index Badge */}
                {mode === "debate" && debateIndex !== -1 && (
                  <span className="absolute top-2 left-2 z-20 flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-black font-black">
                    {debateIndex + 1}
                  </span>
                )}

                {/* Clear chat button (only if there's history and not in debate mode) */}
                {hasHistory && mode !== "debate" && (
                  <button
                    onClick={(e) => clearChatHistory(e, c.id)}
                    title="Limpiar historial"
                    aria-label="Limpiar historial de chat"
                    tabIndex={0}
                    className="absolute top-2 right-2 z-20 flex size-6 items-center justify-center rounded-full bg-neutral-800 hover:bg-red-900/60 border border-neutral-700 hover:border-red-500 text-neutral-400 hover:text-red-400 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}

                <div className="relative z-10 flex flex-col items-start justify-center flex-1 min-w-0 pl-[46%] pr-4 py-4">
                  <h3 className="text-sm font-bold uppercase tracking-tight leading-tight text-white line-clamp-1 w-full">
                    {c.name}
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-400 mt-0.5 line-clamp-1">{c.title}</span>
                  <p className="text-[9px] font-mono text-neutral-600 mt-1">{c.era}</p>

                  {isSelected && mode !== "debate" && (
                    <span className="mt-2 text-[9px] font-mono uppercase tracking-wider text-white font-bold">
                      Seleccionado
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* === FLOATING BOTTOM PANEL === */}
      <div
        role="region"
        aria-label="Panel de configuración de misión"
        className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-400 ease-out ${
          panelVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Fade gradient above panel */}
        <div className="h-8 bg-linear-to-t from-black/80 to-transparent pointer-events-none" />

        <div className="bg-[#0c0c0e]/95 border-t border-neutral-800 backdrop-blur-xl shadow-[0_-20px_60px_rgba(0,0,0,0.8)] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-5 max-h-[min(72vh,680px)] overflow-y-auto">

            {mode === "debate" ? (
              selectedDebateChars.length > 0 && (
                <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-stretch lg:gap-6">
                  
                  {/* Left Column: Avatars/Versus */}
                  <div className="flex items-center gap-3 sm:gap-4 lg:shrink-0 lg:w-72">
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      {selectedDebateChars[0] && (
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="size-9 sm:size-10 rounded-full border-2 flex items-center justify-center text-xs sm:text-sm font-black font-mono text-white"
                            style={{ borderColor: selectedDebateChars[0].appearance.accent, background: `${selectedDebateChars[0].appearance.accent}22` }}
                          >
                            {selectedDebateChars[0].name.charAt(0)}
                          </div>
                          <span className="text-[8px] sm:text-[9px] font-mono text-neutral-400 uppercase tracking-widest max-w-[56px] sm:max-w-[64px] text-center truncate">
                            {selectedDebateChars[0].name.split(" ")[0]}
                          </span>
                        </div>
                      )}

                      {selectedDebateChars.length === 2 && (
                        <div className="flex flex-col items-center gap-1 px-1 sm:px-2">
                          <Swords className="size-4 sm:size-5 text-neutral-400 animate-pulse" />
                          <span className="text-[8px] sm:text-[9px] font-mono text-neutral-600 uppercase tracking-widest">vs</span>
                        </div>
                      )}

                      {selectedDebateChars[1] && (
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="size-9 sm:size-10 rounded-full border-2 flex items-center justify-center text-xs sm:text-sm font-black font-mono text-white"
                            style={{ borderColor: selectedDebateChars[1].appearance.accent, background: `${selectedDebateChars[1].appearance.accent}22` }}
                          >
                            {selectedDebateChars[1].name.charAt(0)}
                          </div>
                          <span className="text-[8px] sm:text-[9px] font-mono text-neutral-400 uppercase tracking-widest max-w-[56px] sm:max-w-[64px] text-center truncate">
                            {selectedDebateChars[1].name.split(" ")[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1 border-l border-neutral-800 pl-3 sm:pl-4">
                      <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-tight truncate">
                        {selectedDebateChars.length === 2
                          ? `${selectedDebateChars[0].name.split(" ")[0]} vs ${selectedDebateChars[1].name.split(" ")[0]}`
                          : "Selecciona otro personaje"
                        }
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-mono text-neutral-500 truncate mt-0.5">
                        Modo Debate Histórico
                      </span>
                    </div>

                    {selectedDebateChars.length === 2 && debateTopic.trim() && (
                      <button
                        onClick={handleConfirm}
                        disabled={calling}
                        aria-label="Iniciar debate"
                        className="lg:hidden flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-black hover:bg-neutral-200 border border-white transition-all duration-300 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                      >
                        <PhoneCall className="size-4" />
                      </button>
                    )}
                  </div>

                  <div className="hidden lg:block w-px bg-neutral-800 self-stretch" />

                  {/* Middle Column: Mode Selector + Topic input */}
                  <div className="flex flex-col gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 font-bold shrink-0">
                        Modo
                      </span>
                      <div className="flex gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800 w-full sm:w-auto">
                        <button
                          onClick={() => { setMode("casual"); setSelectedChar(selectedDebateChars[0] || null); }}
                          className="flex-1 sm:flex-none py-1.5 px-4 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-neutral-400 hover:text-white"
                        >
                          Libre
                        </button>
                        <button
                          onClick={() => { setMode("mission"); setSelectedChar(selectedDebateChars[0] || null); }}
                          className="flex-1 sm:flex-none py-1.5 px-4 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-neutral-400 hover:text-white"
                        >
                          Misión
                        </button>
                        <button
                          onClick={() => setMode("debate")}
                          className="flex-1 sm:flex-none py-1.5 px-4 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer bg-white text-black shadow-sm font-black"
                        >
                          Debate
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-0 w-full">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-3.5 text-white shrink-0" />
                        <span className="text-[9px] font-mono uppercase text-neutral-400 tracking-wider font-bold">
                          Tema del Debate
                        </span>
                      </div>
                      <textarea
                        value={debateTopic}
                        onChange={(e) => setDebateTopic(e.target.value)}
                        placeholder="Ej: ¿Es la tecnología un puente o una barrera para las relaciones humanas? ¿O qué opina César sobre las campañas de Napoleón?"
                        className="w-full h-16 p-2 rounded-xl text-xs bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 outline-none focus:border-neutral-700 transition resize-none font-sans leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="hidden lg:block w-px bg-neutral-800 self-stretch" />

                  {/* Right Column: Launcher CTA */}
                  <div className="hidden lg:flex items-center shrink-0">
                    <button
                      onClick={handleConfirm}
                      disabled={calling || selectedDebateChars.length < 2 || !debateTopic.trim()}
                      aria-label="Iniciar debate"
                      className="flex h-11 items-center gap-2 rounded-full bg-white text-black hover:bg-neutral-200 border border-white px-7 text-sm font-black uppercase tracking-wider transition-all duration-300 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg whitespace-nowrap"
                    >
                      <PhoneCall className="size-4" />
                      {calling ? "Conectando..." : "Iniciar Debate"}
                    </button>
                  </div>
                </div>
              )
            ) : (
              selectedChar && (
                <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-stretch lg:gap-6">
                  
                  {/* Left Column: Versus info */}
                  <div className="flex items-center gap-3 sm:gap-4 lg:shrink-0 lg:w-72">
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <div className="flex flex-col items-center gap-1">
                        <div className="size-9 sm:size-10 rounded-full border-2 border-neutral-600 flex items-center justify-center text-xs sm:text-sm font-black font-mono text-white bg-neutral-900">
                          TÚ
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Tú</span>
                      </div>

                      <div className="flex flex-col items-center gap-1 px-1 sm:px-2">
                        <Swords className="size-4 sm:size-5 text-neutral-400" />
                        <span className="text-[8px] sm:text-[9px] font-mono text-neutral-600 uppercase tracking-widest">vs</span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="size-9 sm:size-10 rounded-full border-2 flex items-center justify-center text-xs sm:text-sm font-black font-mono text-white"
                          style={{ borderColor: selectedChar.appearance.accent, background: `${selectedChar.appearance.accent}22` }}
                        >
                          {selectedChar.name.charAt(0)}
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-mono text-neutral-400 uppercase tracking-widest max-w-[56px] sm:max-w-[64px] text-center truncate">
                          {selectedChar.name.split(" ")[0]}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col min-w-0 flex-1 border-l border-neutral-800 pl-3 sm:pl-4">
                      <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-tight truncate">
                        {selectedChar.name}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-mono text-neutral-500 truncate mt-0.5">
                        {selectedChar.title}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-mono text-neutral-600 mt-0.5 hidden sm:block">
                        {selectedChar.era}
                      </span>
                    </div>

                    <button
                      onClick={handleConfirm}
                      disabled={calling}
                      aria-label={`Iniciar llamada con ${selectedChar.name}`}
                      className="lg:hidden flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-black hover:bg-neutral-200 border border-white transition-all duration-300 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                    >
                      <PhoneCall className="size-4" />
                    </button>
                  </div>

                  <div className="hidden lg:block w-px bg-neutral-800 self-stretch" />

                  {/* Middle Column: Mode Selector + Details */}
                  <div className="flex flex-col gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 font-bold shrink-0">
                        Modo
                      </span>
                      <div className="flex gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800 w-full sm:w-auto">
                        <button
                          onClick={() => setMode("casual")}
                          className={`flex-1 sm:flex-none py-1.5 px-4 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            mode === "casual" ? "bg-white text-black shadow-sm font-black" : "text-neutral-400 hover:text-white"
                          }`}
                        >
                          Libre
                        </button>
                        <button
                          onClick={() => setMode("mission")}
                          className={`flex-1 sm:flex-none py-1.5 px-4 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            mode === "mission" ? "bg-white text-black shadow-sm font-black" : "text-neutral-400 hover:text-white"
                          }`}
                        >
                          Misión
                        </button>
                        <button
                          onClick={() => { setMode("debate"); setSelectedDebateChars([selectedChar]); setSelectedChar(null); }}
                          className="flex-1 sm:flex-none py-1.5 px-4 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-neutral-400 hover:text-white"
                        >
                          Debate
                        </button>
                      </div>
                    </div>

                    {mode === "mission" ? (
                      <div className="flex flex-col gap-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-3.5 text-white shrink-0" />
                          <span className="text-[9px] font-mono uppercase text-neutral-400 tracking-wider font-bold">
                            Elige tu Misión
                          </span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory no-scrollbar sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0">
                          {missions.map((mission, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedMissionIndex(idx)}
                              className={`shrink-0 w-[min(82vw,240px)] sm:w-auto snap-start text-left p-2.5 rounded-xl text-[11px] leading-relaxed font-sans border transition-all cursor-pointer ${
                                selectedMissionIndex === idx
                                  ? "bg-neutral-900 border-white text-white font-medium"
                                  : "bg-transparent border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
                              }`}
                            >
                              {mission}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 min-w-0">
                        <HelpCircle className="size-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] sm:text-xs text-neutral-400 font-sans leading-relaxed">
                          Conversa abiertamente sobre las teorías, inventos o vida de{" "}
                          <span className="text-white font-semibold">{selectedChar.name}</span>{" "}
                          sin límites de tiempo ni presión.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="hidden lg:block w-px bg-neutral-800 self-stretch" />

                  {/* Right Column: Launcher CTA */}
                  <div className="hidden lg:flex items-center shrink-0">
                    <button
                      onClick={handleConfirm}
                      disabled={calling}
                      aria-label={`Iniciar llamada con ${selectedChar.name}`}
                      className="flex h-11 items-center gap-2 rounded-full bg-white text-black hover:bg-neutral-200 border border-white px-7 text-sm font-black uppercase tracking-wider transition-all duration-300 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-lg whitespace-nowrap"
                    >
                      <PhoneCall className="size-4" />
                      {calling ? "Conectando..." : `Llamar a ${selectedChar.name.split(" ")[0]}`}
                    </button>
                  </div>
                </div>
              )
            )}

          </div>
        </div>
      </div>

    </div>
  );
}
