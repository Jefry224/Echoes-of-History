import { useEffect, useRef, useState } from "react";

interface AudioSyncProps {
  isCharacterSpeaking: boolean;
  onInterrupt: () => void;
}

export function useAudioSync({ isCharacterSpeaking, onInterrupt }: AudioSyncProps) {
  const [micVolume, setMicVolume] = useState(0);
  const [isUserTalking, setIsUserTalking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const speakTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isCharacterSpeakingRef = useRef(isCharacterSpeaking);

  useEffect(() => {
    isCharacterSpeakingRef.current = isCharacterSpeaking;
  }, [isCharacterSpeaking]);

  // Request mic access and start volume monitoring once
  useEffect(() => {
    let active = true;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        micStreamRef.current = stream;
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Voice Activity Detection loop at 60fps
        const checkVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average amplitude
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          const volumeNormalized = average / 255; // 0 to 1
          setMicVolume(volumeNormalized);

          const threshold = 0.08; // sensitivity threshold

          if (volumeNormalized > threshold) {
            // User is actively talking
            if (speakTimeRef.current === 0) {
              speakTimeRef.current = Date.now();
            } else {
              const speakDuration = Date.now() - speakTimeRef.current;
              // Intelligent Interruption: user speaks for >300ms while character speaks
              if (speakDuration > 300) {
                setIsUserTalking(true);
                if (isCharacterSpeakingRef.current) {
                  onInterrupt(); // Interrupt the character
                }
              }
            }
          } else {
            // User stopped talking
            speakTimeRef.current = 0;
            setIsUserTalking(false);
          }

          animationFrameRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      } catch (err) {
        console.warn("Microphone access declined or unavailable:", err);
      }
    }

    initAudio();

    return () => {
      active = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [onInterrupt]);

  return {
    micVolume,
    isUserTalking,
  };
}
