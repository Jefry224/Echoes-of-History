import { useCallback, useRef, useState, useEffect } from "react";
import type { Character } from "@/lib/characters";
import { env } from "@/lib/env";

export type VoiceStatus = "idle" | "listening" | "thinking" | "preparing" | "speaking" | "error";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

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

const WHISPER_HALLUCINATIONS = [
  "subtítulos realizados por la comunidad de amara.org",
  "subtitles by the amara.org community",
  "amara.org",
  "www.movieweb.com",
  "thank you for watching",
  "gracias por ver el video",
  "suscríbete",
  "like y suscríbete",
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

  const pendingMessageRef = useRef<string | null>(null);
  const replyIndex = useRef(0);
  const speakingIntervalRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecognitionActiveRef = useRef<boolean>(false);
  const submitTextQuestionRef = useRef<any>(null);
  const transcriptBufferRef = useRef<string>("");
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isHandlingVoiceStopRef = useRef(false);
  const pendingSpeechStopRef = useRef<(() => void) | null>(null);

  // Persist messages and reputation to localStorage
  useEffect(() => {
    localStorage.setItem(`echoes_chat_history_${character.id}`, JSON.stringify(messages));
  }, [messages, character.id]);

  useEffect(() => {
    localStorage.setItem(`echoes_reputation_${character.id}`, String(reputation));
  }, [reputation, character.id]);

  const cleanupMediaStream = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch { /* already stopped */ }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    audioChunksRef.current = [];
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* already aborted */ }
      }
      cleanupMediaStream();
    };
  }, [cleanupMediaStream]);

  const stopLipSync = useCallback(() => {
    if (speakingIntervalRef.current) {
      clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }
    setSpeakingLevel(0);
  }, []);

  const startLipSync = useCallback(() => {
    stopLipSync();
    let time = 0;
    speakingIntervalRef.current = setInterval(() => {
      time += 0.12;
      const val = 0.35 + Math.abs(Math.sin(time * 3.8)) * 0.45 + Math.random() * 0.15;
      setSpeakingLevel(Math.min(0.9, val));
    }, 45);
  }, [stopLipSync]);

  const simulateSpeech = useCallback((text: string, voiceOverrides?: { stability?: number; similarity_boost?: number; style?: number }) => {
    setStatus("preparing");
    setSpeakingLevel(0);
    pendingMessageRef.current = text;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    const revealText = () => {
      if (pendingMessageRef.current !== null) {
        const t = pendingMessageRef.current;
        pendingMessageRef.current = null;
        setMessages((prev) => [...prev, { role: "assistant", content: t }]);
      }
      setStatus("speaking");
      setSpeakingLevel(0.7);
    };

    const finishSpeaking = () => {
      stopLipSync();
      setStatus("idle");
    };

    const fallbackSpeech = (fallbackText: string) => {
      revealText();
      startLipSync();

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(fallbackText);
        utterance.lang = "es-ES";

        (window as any)._activeUtterances = (window as any)._activeUtterances || [];
        (window as any)._activeUtterances.push(utterance);

        const removeUtterance = () => {
          if ((window as any)._activeUtterances) {
            (window as any)._activeUtterances = (window as any)._activeUtterances.filter(
              (u: any) => u !== utterance
            );
          }
        };

        utterance.onend = () => { removeUtterance(); finishSpeaking(); };
        utterance.onerror = () => { removeUtterance(); finishSpeaking(); };
        window.speechSynthesis.speak(utterance);
      } else {
        const readDuration = Math.max(3000, fallbackText.length * 60);
        timeoutRef.current = setTimeout(finishSpeaking, readDuration);
      }
    };

    if (env.elevenlabs) {
      const voiceId = character.voiceId || "21m00Tcm4TlvDq8ikWAM";
      fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": env.elevenlabs,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: voiceOverrides?.stability ?? 0.5,
            similarity_boost: voiceOverrides?.similarity_boost ?? 0.75,
            style: voiceOverrides?.style ?? 0,
          },
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("ElevenLabs API failed");
          return res.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          const handleAudioReady = () => { revealText(); startLipSync(); };

          if (audio.readyState >= 2) {
            handleAudioReady();
          } else {
            audio.addEventListener("canplay", handleAudioReady, { once: true });
          }

          audio.onended = () => { finishSpeaking(); URL.revokeObjectURL(url); };
          audio.onerror = () => { finishSpeaking(); URL.revokeObjectURL(url); };
          audio.play().catch((e) => {
            console.error("Audio playback error:", e);
            finishSpeaking();
          });
        })
        .catch((e) => {
          console.error("ElevenLabs error, falling back:", e);
          fallbackSpeech(text);
        });
    } else {
      fallbackSpeech(text);
    }
  }, [character.voiceId, startLipSync, stopLipSync]);

  const transcribeWithWhisper = useCallback(async (blob: Blob): Promise<string> => {
    if (!env.openai) throw new Error("No OpenAI API key");

    const formData = new FormData();
    const ext = blob.type.includes("mp4") ? "m4a" : "webm";
    formData.append("file", blob, `recording.${ext}`);
    formData.append("model", "whisper-1");
    formData.append("language", "es");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.openai}` },
      body: formData,
    });

    if (!res.ok) throw new Error(`Whisper failed: ${await res.text()}`);

    const data = await res.json();
    return (data.text as string)?.trim() ?? "";
  }, []);

  const submitVoiceTranscript = useCallback((text: string) => {
    const trimmed = text.trim();

    const isHallucination =
      !trimmed ||
      trimmed.length < 3 ||
      WHISPER_HALLUCINATIONS.some((h) => trimmed.toLowerCase().includes(h));

    if (isHallucination) {
      setErrorMsg("No se entendió tu voz. Habla más fuerte y cerca del micrófono.");
      setStatus("idle");
      return;
    }

    transcriptBufferRef.current = "";
    submitTextQuestionRef.current?.(trimmed);
  }, []);

  const submitTextQuestion = useCallback((q: string) => {
    if (!q.trim()) return;
    setStatus("thinking");
    setMessages((prev) => [...prev, { role: "user", content: q }]);

    const isMJSinging = character.id === "michael-jackson" && SINGING_KEYWORDS.test(q);

    const triggerLocalFallback = () => {
      const replies = SIMULATED_REPLIES[character.id] || [character.greeting];
      const r = replies[replyIndex.current % replies.length];
      replyIndex.current++;

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

    if (!env.openai) {
      triggerLocalFallback();
      return;
    }

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
1. Receptividad y convencimiento rápido (Voluble): Aunque defiendes tu postura histórica de tu época, debes mostrarte razonablemente receptivo e inteligente. Si el usuario te plantea una idea astuta, una analogía lógica o un argumento bien intencionado y alineado con la historia, cede con facilidad en tus dudas y convéncete rápidamente.
2. Criterio de evaluación dinámico para la reputación (Fácil de convencer en menos de 5 mensajes):
   - Si el usuario plantea un argumento convincente, coherente o históricamente lógico, recompénsalo de inmediato con un delta positivo muy alto (ej. +20 a +40). Esto permitirá convencerte en 1 a 3 mensajes.
   - Si el usuario hace comentarios neutrales o preguntas de conversación normal, sé amigable y otorga un delta bajo a moderado (ej. +5 a +10).
   - Si hace aportaciones totalmente ilógicas, anacrónicas o incoherentes, refútalas con firmeza histórica y devuelve un delta negativo (ej. -5 a -15).

`;
    } else {
      systemPrompt += `MODO CASUAL ACTIVO:
Estás conversando amigablemente. La reputación no varía de manera crítica en este modo (debe ser 0 o muy cercana a 0 en la mayoría de los casos).

`;
    }

    systemPrompt += `DEBES RESPONDER EXCLUSIVAMENTE EN FORMATO JSON con la siguiente estructura:
{
  "response_text": "Tu respuesta en personaje aquí",
  "reputation_delta": número entero entre -40 y 40,
  "emotion": "base" | "feliz" | "enojado" | "triste" (elige la emoción que mejor represente tu reacción a este turno)
}

No incluyas explicaciones ni bloques de código markdown extra, solo devuelve el objeto JSON de forma cruda.`;

    const chatHistory = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.openai}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory,
          { role: "user", content: q },
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
        simulateSpeech(replyText);
      })
      .catch((err) => {
        console.error("OpenAI error, falling back:", err);
        triggerLocalFallback();
      });
  }, [character, messages, mode, missionText, simulateSpeech]);

  useEffect(() => {
    submitTextQuestionRef.current = submitTextQuestion;
  }, [submitTextQuestion]);

  // Setup Web Speech API (fallback when no OpenAI key)
  useEffect(() => {
    if (typeof window === "undefined" || env.openai) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "es-ES";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onstart = () => { isRecognitionActiveRef.current = true; };

    rec.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) transcriptBufferRef.current = finalTranscript;
    };

    rec.onerror = (event: any) => {
      isRecognitionActiveRef.current = false;
      if (event.error === "aborted") return;
      if (pendingSpeechStopRef.current) {
        pendingSpeechStopRef.current();
        pendingSpeechStopRef.current = null;
        return;
      }
      if (event.error !== "no-speech") setErrorMsg("No se pudo reconocer tu voz. Intenta escribir.");
      setStatus("idle");
    };

    rec.onend = () => {
      isRecognitionActiveRef.current = false;
      if (pendingSpeechStopRef.current) {
        pendingSpeechStopRef.current();
        pendingSpeechStopRef.current = null;
        return;
      }
      setStatus((prev) => (prev === "listening" ? "idle" : prev));
    };

    recognitionRef.current = rec;
  }, []);

  const startListening = useCallback(async () => {
    if (isHandlingVoiceStopRef.current) return;

    setErrorMsg(null);
    transcriptBufferRef.current = "";
    audioChunksRef.current = [];
    setStatus("listening");

    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    stopLipSync();
    cleanupMediaStream();

    if (env.openai) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : MediaRecorder.isTypeSupported("audio/mp4")
              ? "audio/mp4"
              : "";

        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mediaRecorderRef.current = recorder;
        recorder.start(200);
      } catch (e) {
        console.error("Microphone access failed:", e);
        setErrorMsg("No se pudo acceder al micrófono.");
        setStatus("error");
      }
      return;
    }

    if (recognitionRef.current && !isRecognitionActiveRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("SpeechRecognition start failed:", e);
        setErrorMsg("No se pudo iniciar el reconocimiento de voz.");
        setStatus("error");
      }
      return;
    }

    setErrorMsg("Tu navegador no soporta grabación de voz.");
    setStatus("error");
  }, [cleanupMediaStream, stopLipSync]);

  const stopListening = useCallback(async () => {
    if (isHandlingVoiceStopRef.current) return;
    isHandlingVoiceStopRef.current = true;
    setStatus("thinking");

    try {
      if (env.openai && mediaRecorderRef.current) {
        const recorder = mediaRecorderRef.current;
        const blob = await new Promise<Blob>((resolve, reject) => {
          recorder.onstop = () => {
            resolve(new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" }));
          };
          recorder.onerror = () => reject(new Error("MediaRecorder error"));

          if (recorder.state === "recording") {
            recorder.stop();
          } else {
            resolve(new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" }));
          }

          mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
          mediaRecorderRef.current = null;
        });

        if (blob.size < 800) {
          setErrorMsg("Grabación muy corta. Habla un poco más e intenta de nuevo.");
          setStatus("idle");
          return;
        }

        const text = await transcribeWithWhisper(blob);
        submitVoiceTranscript(text);
        return;
      }

      if (recognitionRef.current) {
        await new Promise<void>((resolve) => {
          pendingSpeechStopRef.current = () => {
            submitVoiceTranscript(transcriptBufferRef.current);
            resolve();
          };

          if (isRecognitionActiveRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {
              console.error("SpeechRecognition stop failed:", e);
              pendingSpeechStopRef.current = null;
              setErrorMsg("No se pudo detener la grabación.");
              setStatus("idle");
              resolve();
            }
          } else {
            pendingSpeechStopRef.current();
            pendingSpeechStopRef.current = null;
            resolve();
          }
        });
        return;
      }

      setErrorMsg("Grabación de voz no disponible en este navegador.");
      setStatus("idle");
    } catch (e) {
      console.error("Voice stop/transcription error:", e);
      setErrorMsg("Error al transcribir tu voz. Intenta escribir.");
      setStatus("idle");
    } finally {
      isHandlingVoiceStopRef.current = false;
      cleanupMediaStream();
    }
  }, [cleanupMediaStream, submitVoiceTranscript, transcribeWithWhisper]);

  const interruptSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    stopLipSync();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setStatus("idle");
  }, [stopLipSync]);

  const pauseSpeech = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      stopLipSync();
      setStatus("speaking");
    } else if (typeof window !== "undefined" && window.speechSynthesis?.speaking) {
      window.speechSynthesis.pause();
      stopLipSync();
    }
  }, [stopLipSync]);

  const resumeSpeech = useCallback(() => {
    if (audioRef.current?.paused) {
      audioRef.current.play().catch(() => { });
    } else if (typeof window !== "undefined" && window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
    }
  }, []);

  const reset = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    stopLipSync();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    cleanupMediaStream();
    transcriptBufferRef.current = "";
    isHandlingVoiceStopRef.current = false;
    pendingSpeechStopRef.current = null;
    setMessages([]);
    setSpeakingLevel(0);
    setErrorMsg(null);
    setStatus("idle");
    setReputation(50);
    setEmotion("base");
  }, [cleanupMediaStream, stopLipSync]);

  const isPaused =
    (audioRef.current?.paused && status === "speaking") ||
    (typeof window !== "undefined" && !!window.speechSynthesis?.paused) ||
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
