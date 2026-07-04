import { useState } from "react";
import { CHARACTERS } from "@/lib/characters";
import type { Character } from "@/lib/characters";
import { Play, ArrowLeft, ShieldCheck, HelpCircle } from "lucide-react";

interface CharacterSelectorProps {
  onBack: () => void;
  onStart: (char: Character, mode: "casual" | "mission", missionText?: string) => void;
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
    "Dialoga y convéncelo de impartir sus enseñanzas en la Alejandría helenística en vez de Judea.",
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
};

export function CharacterSelector({ onBack, onStart }: CharacterSelectorProps) {
  const [selectedChar, setSelectedChar] = useState<Character>(CHARACTERS[0]);
  const [mode, setMode] = useState<"casual" | "mission">("casual");
  const [selectedMissionIndex, setSelectedMissionIndex] = useState<number>(0);

  const handleConfirm = () => {
    const activeMissions = MISSION_OBJECTIVES[selectedChar.id] || [];
    const missionText = mode === "mission" ? activeMissions[selectedMissionIndex] : undefined;
    onStart(selectedChar, mode, missionText);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 text-white select-none">
      
      {/* Back to landing */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition cursor-pointer mb-8 animate-fade-in"
      >
        <ArrowLeft className="size-4" />
        Volver a la Landing
      </button>

      {/* Title */}
      <div className="text-center mb-12">
        <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest block mb-2 font-bold animate-pulse">
          [ PANEL DE CONTROL TEMPORAL ]
        </span>
        <h1 className="text-balance text-4xl font-black uppercase tracking-tight md:text-5xl text-white">
          Elige un Nodo e Inicia la Llamada
        </h1>
        <p className="mt-4 text-pretty text-sm text-neutral-400 font-sans">
          Selecciona una figura histórica, elige tu modo de aprendizaje y conecta de inmediato.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        
        {/* Left 2 Columns: Character Grid */}
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          {CHARACTERS.map((c) => {
            const isSelected = selectedChar.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedChar(c);
                  setSelectedMissionIndex(0);
                }}
                className={`flex flex-col items-start p-6 rounded-3xl border text-left transition-all duration-300 cursor-pointer ${
                  isSelected 
                    ? "border-white bg-white/5 shadow-md shadow-white/5" 
                    : "border-neutral-800 bg-black/60 hover:border-neutral-600 hover:bg-neutral-900/50"
                }`}
              >
                {/* Initial Ring indicator */}
                <div 
                  className="size-10 rounded-full border-2 flex items-center justify-center text-base font-mono font-black mb-4"
                  style={{ borderColor: c.appearance.accent }}
                >
                  {c.name.charAt(0)}
                </div>
                <h3 className="text-lg font-bold uppercase tracking-tight leading-tight text-white">{c.name}</h3>
                <span className="text-xs font-mono text-neutral-400 mt-0.5">{c.title}</span>
                <p className="text-[10px] font-mono text-neutral-500 mt-1">{c.era}</p>
                <p className="text-xs text-neutral-400 mt-3 font-sans line-clamp-2 leading-relaxed">
                  "{c.greeting}"
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Column: Mode selector & Confirmation */}
        <div className="glass-panel rounded-3xl p-8 flex flex-col gap-6 sticky top-8 bg-black/80 border border-neutral-800 shadow-xl backdrop-blur-md">
          <div>
            <h2 className="text-lg font-bold uppercase tracking-tight text-white">Configuración</h2>
            <p className="text-xs text-neutral-400 mt-1 font-sans">
              Personaliza el enfoque educativo antes de iniciar el portal.
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-neutral-900 border border-neutral-800">
            <button
              onClick={() => setMode("casual")}
              className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                mode === "casual" 
                  ? "bg-white text-black font-black shadow-sm" 
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Modo Libre
            </button>
            <button
              onClick={() => setMode("mission")}
              className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                mode === "mission" 
                  ? "bg-white text-black font-black shadow-sm" 
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Misión Época
            </button>
          </div>

          {/* Objective detail display */}
          <div className="p-5 rounded-2xl bg-black/40 border border-neutral-800 flex gap-3 items-start flex-col">
            {mode === "mission" ? (
              <>
                <div className="flex gap-2 items-center mb-2">
                  <ShieldCheck className="size-5 text-white shrink-0" />
                  <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider font-bold">
                    Elige tu Misión
                  </span>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  {(MISSION_OBJECTIVES[selectedChar.id] || ["Misión: Convence a la figura con sólidos argumentos históricos."]).map((mission, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedMissionIndex(idx)}
                      className={`text-left p-3 rounded-xl text-xs leading-relaxed font-sans border transition-all cursor-pointer ${
                        selectedMissionIndex === idx
                          ? "bg-neutral-900 border-white text-white font-medium shadow-sm"
                          : "bg-transparent border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
                      }`}
                    >
                      {mission}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex gap-3 items-start">
                <HelpCircle className="size-5 text-neutral-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider font-bold">
                    Charlas Libres
                  </span>
                  <p className="text-xs leading-relaxed text-neutral-400 font-sans">
                    Conversa abiertamente sobre sus teorías, inventos o vida cotidiana sin límites de tiempo ni presión de exámenes.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Launcher CTA */}
          <button
            onClick={handleConfirm}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-black hover:bg-transparent hover:text-white border border-white text-sm font-black uppercase transition-all duration-300 transform active:scale-95 cursor-pointer shadow-lg shadow-white/5 mt-auto"
          >
            <Play className="size-4 fill-current" />
            Llamar a {selectedChar.name.split(" ")[0]}
          </button>
        </div>

      </div>

    </div>
  );
}
