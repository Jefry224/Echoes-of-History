import { useEffect, useState, useRef } from "react";
import { HeadScene } from "@/components/three/HeadScene";
import { useVoiceConversation } from "@/hooks/useVoiceConversation";
import type { Character } from "@/lib/characters";
import { ArrowLeft, Mic, Square, RotateCcw, Send, User, Sparkles } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  idle: "Escribe o mantén pulsado el micro para hablar",
  listening: "Escuchando tu voz...",
  thinking: "Albert está reflexionando...",
  speaking: "Albert está hablando...",
  error: "Error de audio. Intenta de nuevo.",
};

const CHARACTER_PROMPTS: Record<string, string[]> = {
  einstein: [
    "¿Cómo explicas la curvatura del espacio-tiempo?",
    "¿Qué opinas sobre el entrelazamiento cuántico?",
    "¿Cuál es tu fórmula más famosa y qué significa?",
  ],
  cleopatra: [
    "¿Cómo lograste pactar con Julio César y Marco Antonio?",
    "¿Cuál era tu visión geopolítica para Egipto?",
    "¿Qué papel jugaba la biblioteca de Alejandría?",
  ],
  davinci: [
    "¿Cómo diseñaste tus prototipos de máquinas voladoras?",
    "¿Cuál es el secreto de tu técnica del sfumato?",
    "¿Cómo estudiabas la anatomía humana en Florencia?",
  ],
  curie: [
    "¿Cómo descubriste el Radio y el Polonio?",
    "¿Qué barreras enfrentaste como mujer en la ciencia?",
    "¿Cómo ayudaste en los hospitales durante la guerra?",
  ],
  shakespeare: [
    "¿Cuál es el dilema de 'ser o no ser' en Hamlet?",
    "¿Qué te inspiró a escribir tus sonetos de amor?",
    "¿Por qué considerabas que el mundo es un escenario?",
  ],
  tesla: [
    "¿Cómo funciona la transmisión inalámbrica de energía?",
    "¿Cuál era tu visión para el motor de corriente alterna?",
    "¿Cómo recuerdas tu rivalidad con Thomas Edison?",
  ],
};

interface ConversationProps {
  character: Character;
  onBack: () => void;
}

export function Conversation({ character, onBack }: ConversationProps) {
  const { 
    status, 
    messages, 
    speakingLevel, 
    errorMsg, 
    startListening, 
    stopListening, 
    submitTextQuestion, 
    reset 
  } = useVoiceConversation(character);

  const [textInput, setTextInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const isBusy = status === "thinking";
  const isListening = status === "listening";

  const handleSendText = () => {
    if (!textInput.trim() || isBusy || status === "speaking") return;
    submitTextQuestion(textInput);
    setTextInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendText();
    }
  };

  // Get character-specific dynamic suggestions
  const suggestions = CHARACTER_PROMPTS[character.id] || [
    "Cuéntame una lección de tu vida.",
    "¿Cuál consideras tu mayor logro?",
    "¿Qué opinas sobre el siglo XXI?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-black text-white select-none overflow-hidden h-screen">
      
      {/* 
        LEFT COLUMN: ChatGPT-style Conversational UI
        - Clean black layout with modern text entry, suggestions, and scrollable logs.
      */}
      <div className="w-full md:w-1/2 h-[55vh] md:h-full flex flex-col border-b md:border-b-0 md:border-r border-neutral-900 bg-[#0c0c0e] z-10 relative">
        
        {/* ChatGPT Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-900 bg-[#09090b]">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            Volver
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold tracking-tight">{character.name}</span>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">GPT-Historical-v4</span>
          </div>

          <button
            onClick={reset}
            className="flex items-center justify-center p-2 rounded-full border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
            title="Reiniciar chat"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {messages.length === 0 ? (
            /* ChatGPT Welcome & Suggested Prompts Grid */
            <div className="h-full flex flex-col justify-center max-w-lg mx-auto text-center space-y-8 py-10">
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="flex size-14 items-center justify-center rounded-full border-2 text-2xl font-mono font-black"
                  style={{ borderColor: character.appearance.accent }}
                >
                  {character.name.charAt(0)}
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Conversa con {character.name}</h2>
                <p className="text-sm text-neutral-400 font-sans leading-relaxed">
                  {character.greeting}
                </p>
              </div>

              <div className="space-y-3 text-left">
                <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="size-3" /> Preguntas sugeridas
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {suggestions.map((promptText, i) => (
                    <button
                      key={i}
                      onClick={() => submitTextQuestion(promptText)}
                      className="p-3.5 text-xs text-left rounded-2xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all cursor-pointer font-sans leading-snug"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active message stream */
            <div className="space-y-6 max-w-xl mx-auto">
              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-4 items-start ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* Left aligned avatar for historical character */}
                  {m.role === "assistant" && (
                    <div 
                      className="flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-mono font-black select-none"
                      style={{ borderColor: character.appearance.accent, backgroundColor: "#111112" }}
                    >
                      {character.name.charAt(0)}
                    </div>
                  )}

                  <div 
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user" 
                        ? "bg-white text-black font-sans font-medium rounded-tr-none max-w-[80%]" 
                        : "text-neutral-200 font-serif italic max-w-[85%]"
                    }`}
                  >
                    {m.content}
                  </div>

                  {/* Right aligned avatar for user */}
                  {m.role === "user" && (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-neutral-400 select-none">
                      <User className="size-4" />
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming/Thinking Loader inside Chat Feed */}
              {isBusy && (
                <div className="flex gap-4 items-start justify-start">
                  <div 
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-mono font-black animate-pulse"
                    style={{ borderColor: character.appearance.accent }}
                  >
                    {character.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-3 bg-neutral-900/20 rounded-2xl">
                    <span className="size-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="size-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="size-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* ChatGPT Input Bar */}
        <div className="p-6 border-t border-neutral-900 bg-[#09090b]">
          <div className="max-w-xl mx-auto flex flex-col gap-2.5">
            
            {/* Input Capsule containing both typing input, send arrow, and voice mic */}
            <div className="relative flex items-center rounded-full border border-neutral-800 bg-neutral-900 px-4 py-1.5 focus-within:border-white/40 transition-colors">
              <input
                type="text"
                disabled={isBusy}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={`Pregunta a ${character.name}...`}
                className="flex-1 bg-transparent py-2.5 pr-20 text-sm text-white placeholder-neutral-500 outline-none font-sans"
              />

              {/* Action Buttons floated inside the input box */}
              <div className="absolute right-3 flex items-center gap-2">
                
                {/* Voice Input Microphone Button */}
                <button
                  disabled={isBusy}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    if (!isBusy && status !== "speaking") startListening();
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    if (isListening) stopListening();
                  }}
                  onPointerLeave={() => {
                    if (isListening) stopListening();
                  }}
                  className={`flex size-9 items-center justify-center rounded-full border transition-all ${
                    isListening
                      ? "bg-white text-black border-white scale-105"
                      : "bg-transparent border-neutral-800 text-neutral-400 hover:border-white hover:text-white"
                  } cursor-pointer`}
                  title="Mantén presionado para hablar"
                >
                  {isListening ? <Square className="size-3.5 fill-current" /> : <Mic className="size-4" />}
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSendText}
                  disabled={isBusy || !textInput.trim() || status === "speaking"}
                  className="flex size-9 items-center justify-center rounded-full bg-white text-black hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors cursor-pointer"
                >
                  <Send className="size-4" />
                </button>

              </div>
            </div>

            {/* Subtext info */}
            <div className="flex justify-between text-[10px] font-mono text-neutral-500 px-3">
              <span>{errorMsg ?? STATUS_LABEL[status]}</span>
              {isListening && <span className="animate-pulse text-white">Escuchando...</span>}
            </div>

          </div>
        </div>

      </div>

      {/* 
        RIGHT SIDE COLUMN: Pure 3D Model View on a Grid Background
        - Grid lines and glowing ambient background.
        - NO text elements overlaying the model.
      */}
      <div className="w-full md:w-1/2 h-[45vh] md:h-full relative bg-neutral-950 flex items-center justify-center overflow-hidden">
        
        {/* Background glow: Clean white ambient glow instead of colorful blobs */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 70%)" }}
        />
        
        {/* Cyber digital grid layout */}
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-15 cyber-grid" />

        {/* 3D Head Canvas filling the container */}
        <div className="w-full h-full">
          <HeadScene
            appearance={character.appearance}
            speaking={speakingLevel}
            className="h-full w-full"
            float
            cameraZ={3.8}
          />
        </div>

      </div>

    </div>
  );
}
