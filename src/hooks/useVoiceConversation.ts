import { useCallback, useRef, useState, useEffect } from "react";
import type { Character } from "@/lib/characters";

export type VoiceStatus = "idle" | "listening" | "thinking" | "speaking" | "error";

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
};

const SIMULATED_QUESTIONS = [
  "¿Cuál es el secreto de tus descubrimientos?",
  "¿Cómo ves los desafíos del mundo moderno?",
  "Cuéntame una lección de tu propia vida.",
];

export function useVoiceConversation(character: Character) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [speakingLevel, setSpeakingLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const replyIndex = useRef(0);
  const questionIndex = useRef(0);
  const speakingIntervalRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const simulateSpeech = useCallback((text: string) => {
    setStatus("speaking");
    setSpeakingLevel(0.7); // Instantly open mouth when character starts speaking!
    
    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    
    const fallbackSpeech = (fallbackText: string) => {
      // Animate mouth speaking level
      let time = 0;
      if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
      
      speakingIntervalRef.current = setInterval(() => {
        time += 0.12;
        // High-amplitude, pronounced lipsync movements
        const val = 0.35 + Math.abs(Math.sin(time * 3.8)) * 0.45 + Math.random() * 0.15;
        setSpeakingLevel(Math.min(0.9, val));
      }, 45);

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(fallbackText);
        utterance.lang = "es-ES";
        
        utterance.onend = () => {
          if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
          setSpeakingLevel(0);
          setStatus("idle");
        };
        
        utterance.onerror = () => {
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
            stability: 0.5,
            similarity_boost: 0.75,
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
        
        audio.onplay = () => {
          if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
          let time = 0;
          speakingIntervalRef.current = setInterval(() => {
            time += 0.12;
            const val = 0.35 + Math.abs(Math.sin(time * 3.8)) * 0.45 + Math.random() * 0.15;
            setSpeakingLevel(Math.min(0.9, val));
          }, 45);
        };

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

  const startListening = useCallback(() => {
    setErrorMsg(null);
    setStatus("listening");
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  const stopListening = useCallback(() => {
    setStatus("thinking");

    // Simulate STT -> LLM response after 1.5 seconds
    timeoutRef.current = setTimeout(() => {
      // Pick a question and a reply
      const q = SIMULATED_QUESTIONS[questionIndex.current];
      questionIndex.current = (questionIndex.current + 1) % SIMULATED_QUESTIONS.length;

      const characterReplies = SIMULATED_REPLIES[character.id] || [character.greeting];
      const r = characterReplies[replyIndex.current];
      replyIndex.current = (replyIndex.current + 1) % characterReplies.length;

      setMessages((prev) => [
        ...prev,
        { role: "user", content: q },
        { role: "assistant", content: r },
      ]);

      simulateSpeech(r);
    }, 1500);
  }, [character, simulateSpeech]);

  const submitTextQuestion = useCallback((q: string) => {
    if (!q.trim()) return;
    setStatus("thinking");

    setMessages((prev) => [
      ...prev,
      { role: "user", content: q },
    ]);

    // Simulate LLM response after 1.2 seconds
    timeoutRef.current = setTimeout(() => {
      const characterReplies = SIMULATED_REPLIES[character.id] || [character.greeting];
      const r = characterReplies[replyIndex.current];
      replyIndex.current = (replyIndex.current + 1) % characterReplies.length;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: r },
      ]);

      simulateSpeech(r);
    }, 1200);
  }, [character, simulateSpeech]);

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

  return {
    status,
    messages,
    speakingLevel,
    errorMsg,
    startListening,
    stopListening,
    submitTextQuestion,
    interruptSpeech,
    reset,
  };
}
