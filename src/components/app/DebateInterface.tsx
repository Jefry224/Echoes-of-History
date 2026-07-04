import { useEffect, useState, useRef } from "react";
import { VideoPuppet } from "./VideoPuppet";
import type { Character } from "@/lib/characters";
import { ArrowLeft, Play, RotateCcw, Sparkles, AlertCircle, Square } from "lucide-react";

interface DebateInterfaceProps {
  characters: [Character, Character];
  topic: string;
  onBack: () => void;
}

export interface DebateMessage {
  id: string;
  charId: string;
  name: string;
  content: string;
}

export function DebateInterface({ characters, topic, onBack }: DebateInterfaceProps) {
  const [charA, charB] = characters;
  
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [status, setStatus] = useState<"idle" | "calling" | "generating" | "speaking" | "paused" | "error">("idle");
  const [subStatus, setSubStatus] = useState<"idle" | "text-generating" | "voice-loading" | "speaking">("idle");
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [speakingLevel, setSpeakingLevel] = useState(0);
  const [emotion, setEmotion] = useState<"base" | "feliz" | "enojado" | "triste">("base");
  const [nextSpeakerId, setNextSpeakerId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lipSyncIntervalRef = useRef<any>(null);
  const isCancelledRef = useRef<boolean>(false);

  // Clean up speech synthesis and audio on unmount
  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status, activeSpeakerId]);

  // Handle first load / setup
  useEffect(() => {
    initializeDebate();
  }, []);

  // Auto-start the debate once calling transition finished
  useEffect(() => {
    if (status === "calling" && nextSpeakerId) {
      const t = setTimeout(() => {
        executeNextPair();
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [status, nextSpeakerId]);

  const cleanupAll = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (lipSyncIntervalRef.current) {
      clearInterval(lipSyncIntervalRef.current);
      lipSyncIntervalRef.current = null;
    }
    setActiveSpeakerId(null);
    setSpeakingLevel(0);
    setSubStatus("idle");
  };

  const initializeDebate = () => {
    cleanupAll();
    isCancelledRef.current = false;
    setMessages([]);
    setStatus("calling");
    setSubStatus("idle");
    // Pick starter randomly
    const starter = Math.random() < 0.5 ? charA : charB;
    setNextSpeakerId(starter.id);
  };

  const handleRestart = () => {
    if (confirm("¿Reiniciar la conversación desde el principio con el mismo tema?")) {
      initializeDebate();
    }
  };

  const handleStop = () => {
    isCancelledRef.current = true;
    cleanupAll();
    setStatus("paused");
    setSubStatus("idle");

    // Resume at the other character's turn on click Seguir
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const otherChar = characters.find((c) => c.id !== lastMsg.charId);
      if (otherChar) {
        setNextSpeakerId(otherChar.id);
      }
    }
  };

  const handleBack = () => {
    cleanupAll();
    onBack();
  };

  const generateResponse = async (
    speaker: Character,
    listener: Character,
    currentHistory: DebateMessage[]
  ): Promise<{ text: string; emotion: string }> => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      // Local fallback in case there is no API Key
      const fallbackReplies = [
        `Mi estimado colega ${listener.name}, entiendo tu punto de vista sobre "${topic}", pero considero que debemos examinar las bases empíricas e históricas antes de concluir.`,
        `Interesante argumento, ${listener.name}. No obstante, la experiencia de mi propia época nos enseña que las cosas rara vez son tan lineales.`,
        `Concuerdo parcialmente con tu enfoque, pero no debemos pasar por alto el impacto social de nuestras acciones en el desarrollo del ser humano.`,
        `¡Oh, es una perspectiva fascinante! Sin embargo, la razón y la observación científica revelan otra faceta que vale la pena analizar.`
      ];
      const randomText = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate thinking
      return { text: randomText, emotion: "base" };
    }

    const systemPrompt = `Eres el personaje histórico: ${speaker.name}. ${speaker.persona}
Estás entablando un diálogo/debate cruzado con ${listener.name} sobre el tema: "${topic}".

Debes responder siempre manteniendo tu personalidad histórica, vocabulario adecuado de tu época y en idioma Español.
Mantén tus respuestas ricas en contenido histórico (de 3 a 5 oraciones largas), para que den suficiente detalle y no sean demasiado cortas.
Refleja tu estado emocional a través de la puntuación en el texto para que la voz responda con la entonación adecuada (por ejemplo, usando "¡!" para alegría, pausas y puntos suspensivos para tristeza, u oraciones firmes y fuertes para enojo).

DEBES RESPONDER EXCLUSIVAMENTE EN FORMATO JSON con la siguiente estructura:
{
  "response_text": "Tu respuesta en personaje aquí",
  "emotion": "base" | "feliz" | "enojado" | "triste" (elige la emoción que mejor represente tu reacción a este turno)
}
No incluyas explicaciones ni bloques de código markdown extra, solo devuelve el objeto JSON de forma cruda.`;

    // Map conversation history from current speaker's perspective
    const chatHistory = currentHistory.map((msg) => ({
      role: msg.charId === speaker.id ? ("assistant" as const) : ("user" as const),
      content: `${msg.name} dijo: ${msg.content}`
    }));

    // If history is empty, add a starting message to initiate
    const messagesToSend = chatHistory.length === 0
      ? [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: `Por favor, inicia nuestro diálogo sobre el tema: "${topic}"` }
        ]
      : [
          { role: "system" as const, content: systemPrompt },
          ...chatHistory
        ];

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: messagesToSend
        })
      });

      if (!res.ok) throw new Error("OpenAI API call failed");
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty OpenAI content");

      const parsed = JSON.parse(content);
      return {
        text: parsed.response_text || "Disculpa, no logré formular mi idea.",
        emotion: parsed.emotion || "base"
      };
    } catch (e) {
      console.error("OpenAI error during debate generation, falling back:", e);
      return {
        text: `Mi estimado colega ${listener.name}, entiendo tu punto de vista sobre "${topic}", pero considero que debemos examinar este dilema con mayor rigor conceptual.`,
        emotion: "base"
      };
    }
  };

  const speakText = (text: string, char: Character, onStartPlayback: () => void): Promise<void> => {
    return new Promise((resolve) => {
      setActiveSpeakerId(char.id);
      setStatus("generating");
      setSpeakingLevel(0);
      
      let playbackStarted = false;
      const triggerStartPlayback = () => {
        if (playbackStarted) return;
        playbackStarted = true;
        onStartPlayback();
        setSubStatus("speaking");
        startSpeakingAnims();
      };

      const startSpeakingAnims = () => {
        if (isCancelledRef.current) return;
        setStatus("speaking");
        setSpeakingLevel(0.7);

        // Start lip sync animation
        if (lipSyncIntervalRef.current) clearInterval(lipSyncIntervalRef.current);
        let time = 0;
        lipSyncIntervalRef.current = window.setInterval(() => {
          time += 0.12;
          const val = 0.35 + Math.abs(Math.sin(time * 3.8)) * 0.45 + Math.random() * 0.15;
          setSpeakingLevel(Math.min(0.9, val));
        }, 45);
      };

      const cleanup = () => {
        if (lipSyncIntervalRef.current) {
          clearInterval(lipSyncIntervalRef.current);
          lipSyncIntervalRef.current = null;
        }
        setSpeakingLevel(0);
        setActiveSpeakerId(null);
      };

      const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

      const runFallback = () => {
        if (isCancelledRef.current) {
          cleanup();
          resolve();
          return;
        }
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "es-ES";
          
          utterance.onstart = () => {
            triggerStartPlayback();
          };

          utterance.onend = () => {
            cleanup();
            resolve();
          };
          
          utterance.onerror = () => {
            triggerStartPlayback();
            cleanup();
            resolve();
          };
          
          window.speechSynthesis.speak(utterance);
        } else {
          // absolute fallback
          triggerStartPlayback();
          const duration = Math.max(3000, text.length * 60);
          setTimeout(() => {
            cleanup();
            resolve();
          }, duration);
        }
      };

      if (ELEVENLABS_API_KEY) {
        const voiceId = char.voiceId || "21m00Tcm4TlvDq8ikWAM"; 
        fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            }
          }),
        })
        .then((res) => {
          if (!res.ok) throw new Error("ElevenLabs failed");
          return res.blob();
        })
        .then((blob) => {
          if (isCancelledRef.current) {
            cleanup();
            resolve();
            return;
          }
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          const handleAudioReady = () => {
            triggerStartPlayback();
          };

          if (audio.readyState >= 2) {
            handleAudioReady();
          } else {
            audio.addEventListener("canplay", handleAudioReady, { once: true });
          }

          audio.onended = () => {
            cleanup();
            URL.revokeObjectURL(url);
            resolve();
          };

          audio.onerror = () => {
            cleanup();
            URL.revokeObjectURL(url);
            runFallback();
          };

          audio.play().catch((e) => {
            console.error("Audio playback error", e);
            cleanup();
            URL.revokeObjectURL(url);
            runFallback();
          });
        })
        .catch((e) => {
          console.error("ElevenLabs error, falling back:", e);
          runFallback();
        });
      } else {
        runFallback();
      }
    });
  };

  const executeNextPair = async () => {
    if (status === "generating" || status === "speaking" || !nextSpeakerId) return;

    isCancelledRef.current = false;
    const speaker1 = characters.find((c) => c.id === nextSpeakerId)!;
    const speaker2 = characters.find((c) => c.id !== nextSpeakerId)!;

    try {
      // --- TURN 1 ---
      setStatus("generating");
      setSubStatus("text-generating");
      setActiveSpeakerId(speaker1.id);
      
      const localHistory = [...messages];
      const res1 = await generateResponse(speaker1, speaker2, localHistory);
      if (isCancelledRef.current) return;
      setEmotion(res1.emotion as any);
      
      const turn1Message: DebateMessage = {
        id: Math.random().toString(36).substring(2, 9),
        charId: speaker1.id,
        name: speaker1.name,
        content: res1.text
      };
      
      // Update local history for turn 2 context
      localHistory.push(turn1Message);
      
      setSubStatus("voice-loading");
      await speakText(res1.text, speaker1, () => {
        setMessages((prev) => [...prev, turn1Message]);
      });
      if (isCancelledRef.current) return;
      
      // --- TURN 2 ---
      setStatus("generating");
      setSubStatus("text-generating");
      setActiveSpeakerId(speaker2.id);
      
      const res2 = await generateResponse(speaker2, speaker1, localHistory);
      if (isCancelledRef.current) return;
      setEmotion(res2.emotion as any);
      
      const turn2Message: DebateMessage = {
        id: Math.random().toString(36).substring(2, 9),
        charId: speaker2.id,
        name: speaker2.name,
        content: res2.text
      };
      
      setSubStatus("voice-loading");
      await speakText(res2.text, speaker2, () => {
        setMessages((prev) => [...prev, turn2Message]);
      });
      if (isCancelledRef.current) return;

      // --- PAIR COMPLETED ---
      setStatus("paused");
      setSubStatus("idle");
      setNextSpeakerId(speaker1.id);
    } catch (e) {
      console.error("Error in executeNextPair:", e);
      if (!isCancelledRef.current) {
        setStatus("error");
        setSubStatus("idle");
      }
    }
  };

  const getStatusLabel = () => {
    if (status === "calling") return "Conectando portal temporal y enlazando conciencias...";
    if (subStatus === "text-generating") {
      const activeChar = characters.find((c) => c.id === activeSpeakerId);
      return `${activeChar?.name || "Personaje"} está reflexionando una respuesta...`;
    }
    if (subStatus === "voice-loading") {
      const activeChar = characters.find((c) => c.id === activeSpeakerId);
      return `Preparando transmisión de voz para ${activeChar?.name || "Personaje"}...`;
    }
    if (subStatus === "speaking" || status === "speaking") {
      const activeChar = characters.find((c) => c.id === activeSpeakerId);
      return `${activeChar?.name || "Personaje"} está hablando...`;
    }
    if (status === "paused") return "Diálogo pausado. Presiona 'Seguir' para el próximo par de turnos.";
    if (status === "error") return "Hubo un error de conexión temporal. Intenta de nuevo.";
    return "Preparando debate...";
  };

  const isBusy = status === "generating" || status === "speaking" || status === "calling";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#080b11] text-white select-none overflow-hidden h-screen font-sans">
      
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-900 bg-black/60 relative z-20">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Salir
        </button>

        <div className="max-w-md hidden md:block text-center">
          <div className="px-4 py-1.5 rounded-full border border-neutral-800 bg-neutral-950 text-xs font-mono text-neutral-400 font-bold uppercase tracking-wider truncate max-w-sm">
            Tema: {topic}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            disabled={isBusy}
            className="flex items-center justify-center p-2 rounded-full border border-neutral-800 bg-black/60 hover:bg-neutral-900 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="Reiniciar Debate"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile Topic Bar */}
      <div className="md:hidden px-6 py-2 bg-neutral-950 border-b border-neutral-900/50 z-20 text-[10px] font-mono text-neutral-400 text-center truncate">
        Tema: {topic}
      </div>

      {/* ─── MAIN DIALOGUE & PUPPET CONTAINER ─── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* LEFT/TOP: Visual puppets (Split layout) */}
        <div className="w-full lg:w-1/2 h-[35vh] lg:h-full grid grid-cols-2 bg-neutral-950 border-r border-neutral-900 relative">
          
          {/* Character 1 Puppet Card */}
          <div className={`relative border-r border-neutral-900 overflow-hidden flex flex-col justify-between transition-all duration-300 ${
            activeSpeakerId === charA.id ? "ring-2 ring-inset ring-amber-500/30" : ""
          }`}>
            {/* 3D Puppet */}
            <div className="absolute inset-0 z-0">
              <VideoPuppet
                character={charA}
                isSpeaking={activeSpeakerId === charA.id && status === "speaking"}
                speakingLevel={activeSpeakerId === charA.id ? speakingLevel : 0}
                emotion={activeSpeakerId === charA.id ? emotion : "base"}
              />
            </div>
            {/* Header info overlay */}
            <div className="relative z-10 p-3 bg-gradient-to-b from-black/80 to-transparent">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">Personaje A</span>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-white">{charA.name}</h3>
              <p className="text-[9px] text-neutral-400 truncate">{charA.title}</p>
            </div>
            {/* Speaking Status Glow */}
            {activeSpeakerId === charA.id && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500 animate-pulse z-10" />
            )}
          </div>

          {/* Character 2 Puppet Card */}
          <div className={`relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${
            activeSpeakerId === charB.id ? "ring-2 ring-inset ring-amber-500/30" : ""
          }`}>
            {/* 3D Puppet */}
            <div className="absolute inset-0 z-0">
              <VideoPuppet
                character={charB}
                isSpeaking={activeSpeakerId === charB.id && status === "speaking"}
                speakingLevel={activeSpeakerId === charB.id ? speakingLevel : 0}
                emotion={activeSpeakerId === charB.id ? emotion : "base"}
              />
            </div>
            {/* Header info overlay */}
            <div className="relative z-10 p-3 bg-gradient-to-b from-black/80 to-transparent">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">Personaje B</span>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-white">{charB.name}</h3>
              <p className="text-[9px] text-neutral-400 truncate">{charB.title}</p>
            </div>
            {/* Speaking Status Glow */}
            {activeSpeakerId === charB.id && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500 animate-pulse z-10" />
            )}
          </div>

        </div>

        {/* RIGHT/BOTTOM: Chat feed showing transcript */}
        <div className="w-full lg:w-1/2 h-[65vh] lg:h-full flex flex-col bg-[#0b0f17]/80 backdrop-blur-md">
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="p-4 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-500 animate-pulse">
                  <Sparkles className="size-8" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight">Estableciendo Conexión Temporal</h3>
                <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
                  Invocando a {charA.name} y {charB.name} para entablar un debate histórico sobre: <span className="text-white italic">"{topic}"</span>.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isCharA = msg.charId === charA.id;
                  const char = isCharA ? charA : charB;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 items-start animate-fade-in ${
                        isCharA ? "justify-start" : "justify-end"
                      }`}
                    >
                      {isCharA && (
                        <div
                          className="flex size-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-mono font-black animate-fade-in"
                          style={{ borderColor: char.appearance.accent, backgroundColor: "#000" }}
                        >
                          {char.name.charAt(0)}
                        </div>
                      )}

                      <div
                        className={`px-4 py-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                          isCharA
                            ? "bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-tl-none font-serif italic"
                            : "bg-white text-black font-sans font-medium rounded-tr-none"
                        }`}
                      >
                        <div className={`text-[9px] font-mono font-bold uppercase mb-1 ${
                          isCharA ? "text-amber-400" : "text-neutral-500"
                        }`}>
                          {msg.name}
                        </div>
                        {msg.content}
                      </div>

                      {!isCharA && (
                        <div
                          className="flex size-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-mono font-black animate-fade-in"
                          style={{ borderColor: char.appearance.accent, backgroundColor: "#000" }}
                        >
                          {char.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Loader when generating response */}
                {status === "generating" && (
                  <div className={`flex gap-3 items-start ${
                    activeSpeakerId === charA.id ? "justify-start" : "justify-end"
                  }`}>
                    {activeSpeakerId === charA.id && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-black text-[10px] font-mono font-black animate-pulse">
                        A
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-2xl">
                        <span className="size-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="size-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="size-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                    {activeSpeakerId === charB.id && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-black text-[10px] font-mono font-black animate-pulse">
                        B
                      </div>
                    )}
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* ─── CONTROLS DOCK ─── */}
          <div className="p-6 border-t border-neutral-900 bg-black/60">
            <div className="max-w-md mx-auto flex flex-col items-center gap-4">
              
              {/* Status text */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 text-center tracking-wide leading-normal">
                {isBusy && <span className="size-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />}
                {status === "error" && <AlertCircle className="size-3.5 text-red-500 shrink-0" />}
                <span>{getStatusLabel()}</span>
              </div>

              {/* Continue/Stop CTA Button */}
              {isBusy ? (
                <button
                  onClick={handleStop}
                  className="group flex h-14 items-center justify-center gap-3 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-10 text-sm font-black uppercase tracking-wider transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-lg"
                >
                  <Square className="size-4 fill-current text-red-400" />
                  Detener
                </button>
              ) : (
                <button
                  onClick={executeNextPair}
                  className="group flex h-14 items-center justify-center gap-3 rounded-full bg-white text-black hover:bg-neutral-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-lg px-10 text-sm font-black uppercase tracking-wider relative overflow-hidden"
                >
                  <Play className="size-4 fill-current text-black group-hover:scale-110 transition-transform" />
                  Seguir
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
