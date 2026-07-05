import { useCallback, useRef, useState, useEffect } from "react";
import type { Character } from "@/lib/characters";

export type VoiceStatus = "idle" | "listening" | "thinking" | "preparing" | "speaking" | "error";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

// Preset replies to make the simulation feel alive
const SIMULATED_REPLIES: Record<string, string[]> = {
  einstein: [
    "La teoría de la relatividad nos dice que el espacio y el tiempo no son absolutos. Dependen del observador.",
    "El misterio más grande del universo es que sea comprensible. La curiosidad es la clave.",
    "Si buscas resultados distintos, no hagas siempre lo mismo. Hay que cuestionar lo obvio.",
  ],
  cleopatra: [
    "Gobernar requiere comprender las ambiciones de los imperios. Roma era fuerte, pero Egipto tenía el saber.",
    "Un gobernante que no domina la diplomacia está destinado a perder sus fronteras.",
    "La fuerza militar es útil, pero la inteligencia geopolítica dura más que las legiones.",
  ],
  davinci: [
    "La naturaleza es la fuente de toda la sabiduría. Cada una de mis máquinas fue copiada del vuelo de las aves.",
    "La pintura es poesía muda; la poesía es pintura ciega. Ambas intentan captar la verdad.",
    "El agua es la fuerza motriz de la naturaleza. Comprender sus corrientes es dominar el movimiento.",
  ],
  curie: [
    "No debemos temer a la radiactividad, debemos comprenderla. La ciencia es paciencia y rigor.",
    "La perseverancia es la base del descubrimiento. Estuvimos años refinando toneladas de pechblenda.",
    "Las barreras en la academia solo se rompen con resultados innegables. La ciencia no tiene género.",
  ],
  shakespeare: [
    "El mundo es un gran teatro, y todos nosotros somos meros actores con sus entradas y salidas.",
    "La brevedad es el alma del ingenio. Por eso, mis palabras buscan el corazón de la duda humana.",
    "Nuestras dudas son traidoras, y nos hacen perder el bien que podríamos ganar por temor a intentarlo.",
  ],
  tesla: [
    "La corriente alterna es solo el comienzo. El universo vibra en frecuencias de energía libre.",
    "Si quieres entender el universo, piensa en términos de energía, frecuencia y vibración.",
    "El futuro demostrará la validez de mis inventos inalámbricos. La ciencia avanza paso a paso.",
  ],
  "michael-jackson": [
    "La música es el lenguaje del alma. Cuando canto, el mundo entero puede escuchar lo que las palabras no pueden decir.",
    "Heal the world, make it a better place. Eso es todo lo que he intentado hacer con mi arte.",
    "No importa tu raza, tu color o tu credo. En la pista de baile, todos somos iguales.",
  ],
};

const SINGING_KEYWORDS = /\b(canta|cantar|cántame|sing|song|canción|bailar|dance|beat it|thriller|billie jean|smooth criminal|black or white)\b/i;

const SIMULATED_QUESTIONS = [
  "¿Cuál es el secreto de tus descubrimientos?",
  "¿Cómo ves los desafíos del mundo moderno?",
  "Cuéntame una lección de tu propia vida.",
];

export function useVoiceConversation(character: Character, mode: "casual" | "mission" = "casual", missionText?: string) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [messages, setMessages] = useState<ChatTurn[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`echoes_chat_history_${character.id}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [speakingLevel, setSpeakingLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reputation, setReputation] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`echoes_reputation_${character.id}`);
      return saved ? Number(saved) : 50;
    }
    return 50;
  });
  const [emotion, setEmotion] = useState<"base" | "feliz" | "enojado" | "triste">("base");
  // Text is held here until the audio is ready, then flushed into messages
  const pendingMessageRef = useRef<string | null>(null);

  // Persist messages and reputation to localStorage
  useEffect(() => {
    localStorage.setItem(`echoes_chat_history_${character.id}`, JSON.stringify(messages));
  }, [messages, character.id]);

  useEffect(() => {
    localStorage.setItem(`echoes_reputation_${character.id}`, String(reputation));
  }, [reputation, character.id]);

  const replyIndex = useRef(0);
  const questionIndex = useRef(0);
  const speakingIntervalRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecognitionActiveRef = useRef<boolean>(false);
  const submitTextQuestionRef = useRef<any>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) { }
      }
    };
  }, []);

  const simulateSpeech = useCallback((text: string, voiceOverrides?: { stability?: number; similarity_boost?: number; style?: number }) => {
    // Mark as "preparing" – audio is being fetched, text not yet revealed
    setStatus("preparing");
    setSpeakingLevel(0);
    // Store the pending text so we can flush it once audio is ready
    pendingMessageRef.current = text;

    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    /** Flush pending text into the visible message list */
    const revealText = () => {
      if (pendingMessageRef.current !== null) {
        const t = pendingMessageRef.current;
        pendingMessageRef.current = null;
        setMessages((prev) => [...prev, { role: "assistant", content: t }]);
      }
      setStatus("speaking");
      setSpeakingLevel(0.7);
    };

    const startLipSync = () => {
      if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
      let time = 0;
      speakingIntervalRef.current = setInterval(() => {
        time += 0.12;
        const val = 0.35 + Math.abs(Math.sin(time * 3.8)) * 0.45 + Math.random() * 0.15;
        setSpeakingLevel(Math.min(0.9, val));
      }, 45);
    };

    const fallbackSpeech = (fallbackText: string) => {
      // Reveal text before the native TTS starts
      revealText();
      startLipSync();

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(fallbackText);
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

        utterance.onend = () => {
          removeUtterance();
          if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
          setSpeakingLevel(0);
          setStatus("idle");
        };

        utterance.onerror = () => {
          removeUtterance();
          if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
          setSpeakingLevel(0);
          setStatus("idle");
        };

        window.speechSynthesis.speak(utterance);
      } else {
        const readDuration = Math.max(3000, fallbackText.length * 60);
        timeoutRef.current = setTimeout(() => {
          if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
          setSpeakingLevel(0);
          setStatus("idle");
        }, readDuration);
      }
    };

    const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

    if (ELEVENLABS_API_KEY) {
      const voiceId = character.voiceId || "21m00Tcm4TlvDq8ikWAM";
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
            stability: voiceOverrides?.stability ?? 0.5,
            similarity_boost: voiceOverrides?.similarity_boost ?? 0.75,
            style: voiceOverrides?.style ?? 0,
          }
        }),
      })
        .then(res => {
          if (!res.ok) throw new Error("ElevenLabs API failed");
          return res.blob();
        })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          const handleAudioReady = () => {
            revealText();
            startLipSync();
          };

          if (audio.readyState >= 2) {
            handleAudioReady();
          } else {
            audio.addEventListener("canplay", handleAudioReady, { once: true });
          }

          audio.onended = () => {
            if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
            setSpeakingLevel(0);
            setStatus("idle");
            URL.revokeObjectURL(url);
          };

          audio.onerror = () => {
            if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
            setSpeakingLevel(0);
            setStatus("idle");
            URL.revokeObjectURL(url);
          };

          audio.play().catch(e => {
            console.error("Error playing audio", e);
            if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
            setSpeakingLevel(0);
            setStatus("idle");
          });
        })
        .catch(e => {
          console.error(e);
          fallbackSpeech(text);
        });
    } else {
      fallbackSpeech(text);
    }
  }, [character.voiceId]);

  const submitTextQuestion = useCallback((q: string) => {
    if (!q.trim()) return;
    setStatus("thinking");

    setMessages((prev) => [
      ...prev,
      { role: "user", content: q },
    ]);

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    const isMJSinging = character.id === "michael-jackson" && SINGING_KEYWORDS.test(q);

    const triggerLocalFallback = () => {
      const characterReplies = SIMULATED_REPLIES[character.id] || [character.greeting];
      const r = characterReplies[replyIndex.current];
      replyIndex.current = (replyIndex.current + 1) % characterReplies.length;

      const localDelta = Math.min(10, Math.max(-5, Math.floor(q.length / 8) - 4));
      setReputation((prev) => Math.min(100, Math.max(0, prev + localDelta)));

      if (isMJSinging) {
        simulateSpeech(
          "This is it! You want me to sing? Alright... People always told me, be careful what you do. Don't go around breaking young girls' hearts... Hee-hee!",
          { stability: 0.3, similarity_boost: 0.9, style: 0.6 }
        );
      } else {
        simulateSpeech(r);
      }
    };

    if (apiKey) {
      const singingInstruction = isMJSinging
        ? `The user is asking you to sing. RESPOND ENTIRELY IN ENGLISH. Improvise 4-6 lines of original lyrics in your musical style — soulful, emotional, rhythmic. Keep it short and punchy. Do NOT translate to Spanish. Stay fully in character as Michael Jackson performing live.`
        : "";

      const responseLengthInstruction = mode === "mission"
        ? "Mantén tus respuestas sumamente concisas, directas y ágiles (de 2 a 3 oraciones de extensión corta o mediana) para facilitar un debate rápido y dinámico."
        : "Mantén tus respuestas ricas en contenido histórico (de 3 a 5 oraciones largas), para que den suficiente detalle y no sean demasiado cortas.";

      let systemPrompt = `Eres el personaje histórico: ${character.name}. ${character.persona}

${singingInstruction ? singingInstruction + "\n\n" : ""}${isMJSinging ? "Respond in English only for this turn." : "Debes responder siempre manteniendo tu personalidad histórica, vocabulario adecuado de tu época y en idioma Español."}
${responseLengthInstruction}
Refleja tu estado emocional a través de la puntuación en el texto para que la voz de ElevenLabs responda con la entonación adecuada (por ejemplo, usando "¡!" para alegría, pausas y puntos suspensivos para tristeza, u oraciones firmes y fuertes para enojo).

`;

      if (mode === "mission" && missionText) {
        systemPrompt += `MODO RETO ACTIVO:
El usuario está intentando cumplir la siguiente misión histórica contigo: "${missionText}".

Pautas de comportamiento críticas para este reto:
1. Sé escéptico y confrontativo: No aceptes los argumentos del usuario con facilidad. Si propone ideas que contradicen tus decisiones históricas, tu orgullo, ética o conveniencia, debes debatir con firmeza, plantear contra-argumentos lógicos de tu época y cuestionar directamente sus suposiciones.
2. Evita las respuestas generales: Exige precisión. Cita miedos reales, detalles logísticos, rivales políticos o hechos históricos específicos de tu biografía para confrontar el punto de vista del usuario.
3. Criterio de evaluación dinámico para la reputación:
   - Si el usuario plantea un argumento excelente, astuto, convincente y bien fundamentado históricamente que aborde de manera lógica tus dudas, muestra un progreso gradual en tu convencimiento y devuelve un delta positivo alto (ej. +15 a +30).
   - Si el usuario hace preguntas generales, aportes neutrales o promedio, mantente escéptico, no cedas en tus posturas y otorga un delta bajo (ej. 0 o +2).
   - Si hace argumentos débiles, anacrónicos, ilógicos o incoherentes, refútalos con firmeza histórica y devuelve un delta negativo (ej. -10 a -25).

`;
      } else {
        systemPrompt += `MODO CASUAL ACTIVO:
Estás conversando amigablemente. La reputación no varía de manera crítica en este modo (debe ser 0 o muy cercana a 0 en la mayoría de los casos).

`;
      }

      systemPrompt += `DEBES RESPONDER EXCLUSIVAMENTE EN FORMATO JSON con la siguiente estructura:
{
  "response_text": "Tu respuesta en personaje aquí",
  "reputation_delta": número entero entre -30 y 30,
  "emotion": "base" | "feliz" | "enojado" | "triste" (elige la emoción que mejor represente tu reacción a este turno)
}

No incluyas explicaciones ni bloques de código markdown extra, solo devuelve el objeto JSON de forma cruda.`;

      const chatHistory = messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant" as "user" | "assistant",
        content: m.content,
      }));

      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            ...chatHistory,
            { role: "user", content: q }
          ],
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("OpenAI request failed");
          return res.json();
        })
        .then((data) => {
          const content = data.choices?.[0]?.message?.content;
          if (!content) throw new Error("Empty content from OpenAI");

          const parsed = JSON.parse(content);
          const replyText = parsed.response_text || "Disculpa, no logré entenderte.";
          const delta = Number(parsed.reputation_delta) || 0;
          const targetEmotion = parsed.emotion || "base";

          setReputation((prev) => Math.min(100, Math.max(0, prev + delta)));
          setEmotion(targetEmotion as any);
          // Do NOT add to messages yet — simulateSpeech will reveal text when audio starts
          simulateSpeech(replyText);
        })
        .catch((err) => {
          console.error("OpenAI Error, falling back:", err);
          triggerLocalFallback();
        });
    } else {
      triggerLocalFallback();
    }
  }, [character, messages, mode, missionText, simulateSpeech]);

  useEffect(() => {
    submitTextQuestionRef.current = submitTextQuestion;
  }, [submitTextQuestion]);

  // Setup Web Speech API Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = "es-ES";
        rec.continuous = false;
        rec.interimResults = false;

        rec.onstart = () => {
          isRecognitionActiveRef.current = true;
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          console.log("Speech recognition transcript:", transcript);
          if (submitTextQuestionRef.current) {
            submitTextQuestionRef.current(transcript);
          }
        };

        rec.onerror = (event: any) => {
          isRecognitionActiveRef.current = false;
          console.error("Speech recognition error:", event.error);
          if (event.error !== "no-speech") {
            setErrorMsg("No se pudo reconocer tu voz. Intenta escribir.");
            setStatus("idle");
          } else {
            setStatus("idle");
          }
        };

        rec.onend = () => {
          isRecognitionActiveRef.current = false;
          setStatus((prev) => (prev === "listening" ? "idle" : prev));
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const startListening = useCallback(() => {
    setErrorMsg(null);
    setStatus("listening");
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (speakingIntervalRef.current) {
      clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }
    setSpeakingLevel(0);

    if (recognitionRef.current && !isRecognitionActiveRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start SpeechRecognition:", e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      if (isRecognitionActiveRef.current) {
        try {
          recognitionRef.current.stop();
          setStatus("thinking");
        } catch (e) {
          console.error("Failed to stop SpeechRecognition:", e);
          setStatus("idle");
        }
      } else {
        // If it was requested to stop before it fully started, abort it immediately
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        setStatus("idle");
      }
    } else {
      // Fallback if SpeechRecognition is not supported
      setStatus("thinking");
      timeoutRef.current = setTimeout(() => {
        const q = SIMULATED_QUESTIONS[questionIndex.current];
        questionIndex.current = (questionIndex.current + 1) % SIMULATED_QUESTIONS.length;
        if (submitTextQuestionRef.current) {
          submitTextQuestionRef.current(q);
        }
      }, 1500);
    }
  }, []);

  const reset = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setMessages([]);
    setSpeakingLevel(0);
    setErrorMsg(null);
    setStatus("idle");
    setReputation(50);
    setEmotion("base");
  }, []);

  const interruptSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    if (speakingIntervalRef.current) {
      clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setSpeakingLevel(0);
    setStatus("idle");
  }, []);

  const pauseSpeech = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
      setSpeakingLevel(0);
      setStatus("speaking"); // keep as speaking so resume works
    } else if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
      setSpeakingLevel(0);
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => { });
    } else if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }, []);

  const isPaused =
    (audioRef.current?.paused && status === "speaking") ||
    (typeof window !== 'undefined' && window.speechSynthesis?.paused) ||
    false;

  return {
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
    emotion,
  };
}
