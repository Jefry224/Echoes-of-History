import { useEffect, useState, useRef } from "react";
import { VideoPuppet } from "./VideoPuppet";
import { useVoiceConversation, type VoiceStatus } from "@/hooks/useVoiceConversation";
import { useAudioSync } from "@/hooks/useAudioSync";
import type { Character } from "@/lib/characters";
import { ArrowLeft, Mic, Square, RotateCcw, Send, User, Sparkles, PhoneOff, ShieldAlert, StopCircle, Trash2, Pause, Play } from "lucide-react";

interface CallInterfaceProps {
  character: Character;
  mode: "casual" | "mission";
  missionText?: string;
  missionDifficulty?: "fácil" | "media" | "difícil";
  onBack: () => void;
  onHangUp: (history: { role: string; content: string }[], score: number, passed: boolean) => void;
}

const SUGGESTIONS: Record<string, string[]> = {
  einstein: [
    "¿Es posible viajar en el tiempo?",
    "¿Por qué dudabas de la mecánica cuántica?",
    "Explícame E=mc² como si tuviera 5 años",
  ],
  cleopatra: [
    "¿Cómo era la vida en Alejandría?",
    "¿Cómo usaste la política para salvar Egipto?",
    "¿Qué opinas de Julio César?",
  ],
  cesar: [
    "¿Cómo cruzaste el Rubicón?",
    "¿Qué opinas de Bruto y el Senado?",
    "¿Cuál fue tu mayor victoria militar?",
  ],
  napoleon: [
    "¿Por qué decidiste invadir Rusia?",
    "¿Qué lección te dejó la batalla de Waterloo?",
    "¿Cómo redactaste el Código Napoleónico?",
  ],
  jesus: [
    "¿Cómo explicas el mandamiento del amor?",
    "¿Qué nos enseña la parábola del hijo pródigo?",
    "¿Cuál era tu visión del Reino de los Cielos?",
  ],
};

const STATUS_LABEL: Record<string, string> = {
  idle: "Escribe o mantén pulsado el micro para hablar",
  listening: "Escuchando tu voz...",
  thinking: "Reflexionando...",
  preparing: "Preparando voz...",
  speaking: "Hablando...",
  error: "Error de audio. Intenta de nuevo.",
};

export function CallInterface({ character, mode, missionText, missionDifficulty = "fácil", onBack, onHangUp }: CallInterfaceProps) {
  const { 
    status, 
    messages, 
    speakingLevel, 
    errorMsg, 
    startListening, 
    stopListening, 
    submitTextQuestion, 
    interruptSpeech, 
    pauseSpeech,
    resumeSpeech,
    isPaused,
    reset,
    reputation,
    emotion
  } = useVoiceConversation(character, mode, missionText, missionDifficulty);

  const [autoInterrupt, setAutoInterrupt] = useState(false);

  // Hook up Web Audio VAD monitoring & Intelligent Interruption
  const { micVolume } = useAudioSync({
    isCharacterSpeaking: status === "speaking",
    onInterrupt: interruptSpeech,
    enabled: autoInterrupt,
  });

  const [textInput, setTextInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes countdown (180 seconds)
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const handleFinishCall = () => {
    playHangUpSound();
    if (timerRef.current) clearInterval(timerRef.current);
    const finalScore = mode === "mission" ? reputation : 100;
    const passed = mode === "mission" ? reputation >= 65 : true;
    onHangUp(messages, finalScore, passed);
  };

  const handleFinishCallRef = useRef(handleFinishCall);
  useEffect(() => {
    handleFinishCallRef.current = handleFinishCall;
  });

  // 3 Minutes Countdown Timer for Mission Mode
  useEffect(() => {
    if (mode !== "mission") return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleFinishCallRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]);

  // Automatically end call when reputation reaches 100% and assistant is done speaking (idle)
  useEffect(() => {
    if (mode === "mission" && reputation >= 100 && status === "idle") {
      const timer = setTimeout(() => {
        handleFinishCallRef.current();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [mode, reputation, status]);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const isBusy = status === "thinking" || status === "preparing";
  const isListening = status === "listening";
  const isPreparing = status === "preparing" as VoiceStatus;

  const handleSendText = () => {
    if (!textInput.trim() || isBusy || status === "speaking") return;
    submitTextQuestion(textInput);
    setTextInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendText();
  };

  const activeSuggestions = SUGGESTIONS[character.id] || [
    "Cuéntame sobre tu época.",
    "¿Qué opinas del futuro?",
    "¿Cuál fue tu mayor desafío?",
  ];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-[#0b0f19] text-white select-none overflow-hidden h-screen">
      
      {/* 
        LEFT COLUMN: Dialogue Stream & Controls (ChatGPT-style - Dark Themed)
      */}
      <div className="w-full md:w-1/2 h-[55vh] md:h-full flex flex-col border-b md:border-b-0 md:border-r border-neutral-800 bg-black/40 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-black/60">
          <button
            onClick={() => {
              playHangUpSound();
              onBack();
            }}
            className="flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            Salir
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold tracking-tight text-white">{character.name}</span>
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">
              {mode === "mission" ? "Modo Certificación" : "Charla Libre"}
            </span>
          </div>

          {/* Header right area: Reset + Clear chat */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm(`¿Limpiar todo el historial con ${character.name}?`)) {
                  const historyKey = mode === "mission" 
                    ? `echoes_chat_history_mission_${character.id}` 
                    : `echoes_chat_history_casual_${character.id}`;
                  const reputationKey = mode === "mission" 
                    ? `echoes_reputation_mission_${character.id}` 
                    : `echoes_reputation_casual_${character.id}`;
                  localStorage.removeItem(historyKey);
                  localStorage.removeItem(reputationKey);
                  reset();
                }
              }}
              className="flex items-center justify-center p-2 rounded-full border border-neutral-800 bg-black/60 hover:bg-red-900/40 hover:border-red-700 text-neutral-400 hover:text-red-400 transition cursor-pointer"
              title="Limpiar historial de chat"
            >
              <Trash2 className="size-3.5" />
            </button>
            <button
              onClick={reset}
              className="flex items-center justify-center p-2 rounded-full border border-neutral-800 bg-black/60 hover:bg-neutral-900 text-neutral-400 hover:text-white transition cursor-pointer"
              title="Reiniciar chat"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center max-w-lg mx-auto text-center space-y-8 py-10">
              <div className="flex flex-col items-center space-y-4">
                <div 
                  className="flex size-14 items-center justify-center rounded-full border-2 text-2xl font-mono font-black"
                  style={{ borderColor: character.appearance.accent }}
                >
                  {character.name.charAt(0)}
                </div>
                
                {mode === "mission" ? (
                  <>
                    <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-black bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                      ⚡ Misión Temporal Activa
                    </span>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Objetivo de Certificación</h2>
                    <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 max-w-md">
                      <p className="text-xs text-neutral-400 font-mono uppercase tracking-wider mb-2 font-bold">
                        Tu Tarea con {character.name}:
                      </p>
                      <p className="text-sm text-neutral-200 font-serif italic leading-relaxed">
                        "{missionText}"
                      </p>
                    </div>
                    <p className="text-xs text-neutral-500 font-sans max-w-xs leading-normal">
                      Sustenta tus argumentos con precisión histórica. Debes convencer al personaje y alcanzar al menos 65% de aprobación para certificar la misión.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Conversación Histórica</h2>
                    <p className="text-sm text-neutral-400 font-sans leading-relaxed">
                      {character.greeting}
                    </p>
                  </>
                )}
              </div>

              {mode !== "mission" && (
                <div className="space-y-3 text-left">
                  <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-2 font-bold">
                    <Sparkles className="size-3" /> Preguntas sugeridas
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeSuggestions.map((promptText, i) => (
                      <button
                        key={i}
                        onClick={() => submitTextQuestion(promptText)}
                        className="p-3.5 text-xs text-left rounded-2xl border border-neutral-800 bg-black/60 hover:bg-neutral-900 text-neutral-300 hover:text-white transition-all cursor-pointer font-sans leading-snug shadow-sm"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 max-w-xl mx-auto">
              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-4 items-start ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div 
                      className="flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-mono font-black select-none"
                      style={{ borderColor: character.appearance.accent, backgroundColor: "#000" }}
                    >
                      {character.name.charAt(0)}
                    </div>
                  )}

                  <div 
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user" 
                        ? "bg-[#0d1117]/95 text-neutral-200 font-sans font-medium rounded-tr-none max-w-[80%]" 
                        : "bg-neutral-900/90 text-neutral-200 border border-neutral-800/80 font-serif italic max-w-[85%] shadow-sm"
                    }`}
                  >
                    {m.content}
                  </div>

                  {m.role === "user" && (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-neutral-400 select-none shadow-sm">
                      <User className="size-4" />
                    </div>
                  )}
                </div>
              ))}

              {(isBusy || isPreparing) && (
                <div className="flex gap-4 items-start justify-start">
                  <div 
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-mono font-black animate-pulse"
                    style={{ borderColor: character.appearance.accent }}
                  >
                    {character.name.charAt(0)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-sm">
                      <span className="size-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="size-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="size-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    {status === "preparing" && (
                      <span className="text-[9px] font-mono text-neutral-600 px-1">Generando audio...</span>
                    )}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar & Mic Controls */}
        <div className="p-6 border-t border-neutral-800 bg-black/60">
          <div className="max-w-xl mx-auto flex flex-col gap-2.5">
            
            <div className="relative flex items-center rounded-full border border-neutral-800 bg-neutral-950 px-4 py-1.5 focus-within:border-neutral-600 transition-colors">
              <input
                type="text"
                disabled={isBusy}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={`Pregunta a ${character.name}...`}
                className="flex-1 bg-transparent py-2.5 pr-20 text-sm text-white placeholder-neutral-500 outline-none font-sans"
              />

              <div className="absolute right-3 flex items-center gap-2">
                <button
                  disabled={isBusy}
                  onClick={() => {
                    if (status === "listening") {
                      stopListening();
                    } else if (status !== "speaking") {
                      startListening();
                    }
                  }}
                  className={`flex size-9 items-center justify-center rounded-full border transition-all ${
                    isListening
                      ? "bg-red-500 text-white border-red-500 scale-105 animate-pulse"
                      : "bg-transparent border-neutral-700 text-neutral-400 hover:border-white hover:text-white"
                  } cursor-pointer`}
                  title={isListening ? "Detener grabación" : "Hablar (Voz)"}
                >
                  {isListening ? <Square className="size-3.5 fill-current" /> : <Mic className="size-4" />}
                </button>

                <button
                  onClick={handleSendText}
                  disabled={isBusy || !textInput.trim() || status === "speaking"}
                  className="flex size-9 items-center justify-center rounded-full bg-white text-black hover:bg-neutral-200 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>

            {/* Subtext VAD and Volume status */}
            <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 px-3">
              <div className="flex items-center gap-3">
                <span>{errorMsg ?? STATUS_LABEL[status]}</span>
                {status !== "listening" && (
                  <button
                    onClick={() => setAutoInterrupt(!autoInterrupt)}
                    className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold transition-all cursor-pointer ${
                      autoInterrupt 
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                        : "bg-transparent text-neutral-600 border-neutral-800 hover:text-neutral-400"
                    }`}
                    title="Permite interrumpir al personaje hablando encima de su voz"
                  >
                    {autoInterrupt ? "⚡ Interrupción Activa" : "🔇 Interrupción Desactivada"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="size-1 bg-white/20 rounded-full transition-all duration-75" style={{ height: `${Math.max(4, micVolume * 36)}px` }} />
                <span className="size-1 bg-white/20 rounded-full transition-all duration-75" style={{ height: `${Math.max(4, micVolume * 48)}px` }} />
                <span className="size-1 bg-white/20 rounded-full transition-all duration-75" style={{ height: `${Math.max(4, micVolume * 24)}px` }} />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 
        RIGHT COLUMN: Superposed Video Puppet & Mission Widgets
      */}
      <div className="w-full md:w-1/2 h-[45vh] md:h-full relative bg-neutral-950 border-l border-neutral-800 flex flex-col justify-between overflow-hidden">
        
        {/* Video Puppet covering entire side panel */}
        <div className="absolute inset-0 z-0">
          <VideoPuppet 
            character={character} 
            isSpeaking={status === "speaking"} 
            speakingLevel={speakingLevel} 
            emotion={emotion}
            fillHeight
          />
        </div>

        {/* 
          MISSION WIDGET (Overlay top right, only if mode === 'mission')
        */}
        {mode === "mission" && (
          <div className="absolute top-4 left-4 right-4 z-10 bg-black/80 border border-neutral-800 shadow-md p-4 rounded-2xl flex flex-col gap-3 max-w-sm backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1">
                <ShieldAlert className="size-3.5 text-white animate-pulse" />
                Objetivo Misión
              </span>
              <span className="text-xs font-mono font-bold bg-white text-black px-2 py-0.5 rounded-md">
                {formatTime(timeLeft)}
              </span>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>Persuasión Lograda</span>
                <span className={reputation >= 65 ? "text-green-400" : "text-red-400"}>{reputation}%</span>
              </div>
              
              <div className="h-2 w-full rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-500 rounded-full"
                  style={{ width: `${reputation}%` }}
                />
              </div>
              <span className="text-[9px] font-sans text-neutral-500 leading-normal mt-2 block">
                {missionText || "Misión: Debes superar el 65% de persuasión para aprobar la certificación."}
              </span>
            </div>
          </div>
        )}

        {/* 
          SLIDER DOCKING HANGUP BUTTON:
          - Replaced with a more elegant dark-themed pill button to match the minimalist UI.
        */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-3 pointer-events-auto">
          {/* Pause / Resume button - visible while speaking */}
          {status === "speaking" && (
            <button
              onClick={isPaused ? resumeSpeech : pauseSpeech}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-700 px-5 text-sm font-bold transition-all transform hover:-translate-y-1 active:translate-y-0 cursor-pointer shadow-lg backdrop-blur-md animate-fade-in"
              title={isPaused ? "Reanudar" : "Pausar"}
            >
              {isPaused
                ? <><Play className="size-4 text-green-400" /> REANUDAR</>
                : <><Pause className="size-4 text-yellow-400" /> PAUSAR</>
              }
            </button>
          )}
          {/* Stop speaking button - only visible while speaking */}
          {status === "speaking" && (
            <button
              onClick={interruptSpeech}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-700 px-6 text-sm font-bold transition-all transform hover:-translate-y-1 active:translate-y-0 cursor-pointer shadow-lg backdrop-blur-md animate-fade-in"
              title="Detener el habla"
            >
              <StopCircle className="size-4 text-orange-400" />
              DETENER
            </button>
          )}
          <button
            onClick={handleFinishCall}
            className="group flex h-12 items-center justify-center gap-3 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-8 text-sm font-bold transition-all transform hover:-translate-y-1 active:translate-y-0 cursor-pointer shadow-lg backdrop-blur-md"
            title="Finalizar Conversación"
          >
            <PhoneOff className="size-4" />
            FINALIZAR LLAMADA
          </button>
        </div>

      </div>

    </div>
  );
}

function playHangUpSound() {
  if (typeof window === "undefined") return;
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(320, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.35);
  
  gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.36);
  
  setTimeout(() => {
    try { ctx.close(); } catch { }
  }, 400);
}
