import { useEffect, useState, useRef } from "react";
import { VideoPuppet } from "./VideoPuppet";
import type { Character } from "@/lib/characters";
import { ArrowLeft, Play, RotateCcw, AlertCircle, Square } from "lucide-react";

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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lipSyncIntervalRef = useRef<any>(null);
  const isCancelledRef = useRef<boolean>(false);

  // Clean up speech synthesis and audio on unmount
  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, []);

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

          // Prevent garbage collection by keeping reference on window
          (window as any)._activeUtterances = (window as any)._activeUtterances || [];
          (window as any)._activeUtterances.push(utterance);

          const removeUtterance = () => {
            if ((window as any)._activeUtterances) {
              (window as any)._activeUtterances = (window as any)._activeUtterances.filter(
                (u: any) => u !== utterance
              );
            }
          };
          
          utterance.onstart = () => {
            triggerStartPlayback();
          };

          utterance.onend = () => {
            removeUtterance();
            cleanup();
            resolve();
          };
          
          utterance.onerror = () => {
            removeUtterance();
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

  const latestMessageA = [...messages].reverse().find((m) => m.charId === charA.id);
  const latestMessageB = [...messages].reverse().find((m) => m.charId === charB.id);

  const renderSpeechBubble = (
    char: Character,
    latestMessage: DebateMessage | undefined,
    isLeft: boolean
  ) => {
    const isActive = activeSpeakerId === char.id;
    const isThinking = status === "generating" && isActive;
    const isConnecting = messages.length === 0 && status === "calling";

    return (
      <div
        className={`absolute bottom-20 left-4 right-4 z-20 animate-fade-in ${
          isLeft ? "md:left-6 md:right-8" : "md:left-8 md:right-6"
        }`}
      >
        <div
          className={`relative px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-xl backdrop-blur-sm font-serif italic ${
            isLeft
              ? "bg-neutral-900/90 text-neutral-200 border border-neutral-700/80 rounded-bl-none"
              : "bg-[#0d1117]/95 text-neutral-200 border rounded-br-none"
          }`}
          style={!isLeft ? { borderColor: `${char.appearance.accent}40` } : undefined}
        >
          <div
            className="text-[9px] font-mono font-bold uppercase mb-1 text-amber-400"
          >
            {char.name}
          </div>

          {isConnecting ? (
            <p className="text-neutral-500 italic">Conectando...</p>
          ) : isThinking ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="size-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="size-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="size-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : latestMessage ? (
            <p>{latestMessage.content}</p>
          ) : (
            <p className="text-neutral-500 italic">Esperando su turno...</p>
          )}

          {/* Bubble tail */}
          <div
            className={`absolute -bottom-2 w-4 h-4 rotate-45 ${
              isLeft
                ? "left-6 bg-neutral-900/90 border-r border-b border-neutral-700/80"
                : "right-6 bg-[#0d1117]/95 border-r border-b"
            }`}
            style={!isLeft ? { borderColor: `${char.appearance.accent}40` } : undefined}
          />
        </div>
      </div>
    );
  };

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

      {/* Status bar */}
      <div className="px-6 py-2 border-b border-neutral-900/50 bg-black/50 z-20 flex items-center justify-center gap-2 min-h-[36px]">
        {isBusy && <span className="size-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />}
        {status === "error" && <AlertCircle className="size-3.5 text-red-500 shrink-0" />}
        <span className="text-[10px] font-mono text-neutral-400 text-center tracking-wide">
          {getStatusLabel()}
        </span>
      </div>

      {/* ─── MAIN: split-screen characters ─── */}
      <div className="flex-1 flex flex-row overflow-hidden relative">

        {/* Character A — left half */}
        <div
          className={`relative w-1/2 h-full border-r border-neutral-900 overflow-hidden transition-all duration-300 ${
            activeSpeakerId === charA.id ? "ring-2 ring-inset ring-amber-500/30" : ""
          }`}
        >
          <div className="absolute inset-0 z-0">
            <VideoPuppet
              character={charA}
              isSpeaking={activeSpeakerId === charA.id && status === "speaking"}
              speakingLevel={activeSpeakerId === charA.id ? speakingLevel : 0}
              emotion={activeSpeakerId === charA.id ? emotion : "base"}
              fillHeight
            />
          </div>

          <div className="relative z-10 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <h3 className="text-sm font-black uppercase tracking-tight text-white">{charA.name}</h3>
            <p className="text-[10px] text-neutral-400 truncate">{charA.title}</p>
          </div>

          {renderSpeechBubble(charA, latestMessageA, true)}

          {activeSpeakerId === charA.id && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500 animate-pulse z-10" />
          )}
        </div>

        {/* Character B — right half */}
        <div
          className={`relative w-1/2 h-full overflow-hidden transition-all duration-300 ${
            activeSpeakerId === charB.id ? "ring-2 ring-inset ring-amber-500/30" : ""
          }`}
        >
          <div className="absolute inset-0 z-0">
            <VideoPuppet
              character={charB}
              isSpeaking={activeSpeakerId === charB.id && status === "speaking"}
              speakingLevel={activeSpeakerId === charB.id ? speakingLevel : 0}
              emotion={activeSpeakerId === charB.id ? emotion : "base"}
              fillHeight
            />
          </div>

          <div className="relative z-10 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <h3 className="text-sm font-black uppercase tracking-tight text-white text-right">{charB.name}</h3>
            <p className="text-[10px] text-neutral-400 truncate text-right">{charB.title}</p>
          </div>

          {renderSpeechBubble(charB, latestMessageB, false)}

          {activeSpeakerId === charB.id && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500 animate-pulse z-10" />
          )}
        </div>

        {/* ─── CONTROLS DOCK (floating center bottom) ─── */}
        <div className="absolute bottom-0 inset-x-0 z-30 px-6 pb-4 pt-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto flex flex-col items-center pointer-events-auto">

            {isBusy ? (
              <button
                onClick={handleStop}
                className="group flex h-12 items-center justify-center gap-3 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-8 text-xs font-black uppercase tracking-wider transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-lg backdrop-blur-sm"
              >
                <Square className="size-3.5 fill-current text-red-400" />
                Detener
              </button>
            ) : (
              <button
                onClick={executeNextPair}
                className="group flex h-12 items-center justify-center gap-3 rounded-full bg-white text-black hover:bg-neutral-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-lg px-8 text-xs font-black uppercase tracking-wider relative overflow-hidden backdrop-blur-sm"
              >
                <Play className="size-3.5 fill-current text-black group-hover:scale-110 transition-transform" />
                Seguir
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
