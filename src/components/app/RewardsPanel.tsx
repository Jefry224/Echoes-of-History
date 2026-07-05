import { useEffect, useState } from "react";
import type { Character } from "@/lib/characters";
import { Sparkles, CheckCircle, XCircle, ArrowLeft, Loader2 } from "lucide-react";

interface RewardsPanelProps {
  character: Character;
  score: number;
  passed: boolean;
  transcript: { role: string; content: string }[];
  onDone: () => void;
}

export function RewardsPanel({ character, score, passed, transcript, onDone }: RewardsPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem("echoes_user_name") || "Investigador";
  });
  const [voicePlayed, setVoicePlayed] = useState(false);

  // Play ElevenLabs simulated congratulations audio on mount
  useEffect(() => {
    if (voicePlayed) return;
    setVoicePlayed(true);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const congratsText = passed
        ? `Felicidades, ${userName}. Has completado con éxito la misión con ${character.name}. Tu entendimiento de la historia es verdaderamente admirable.`
        : `Lamentablemente, ${userName}, no has logrado convencer a ${character.name} en esta ocasión. Revisa tu estrategia y vuelve a intentarlo.`;

      const utterance = new SpeechSynthesisUtterance(congratsText);
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
      };
      utterance.onerror = () => {
        removeUtterance();
      };

      window.speechSynthesis.speak(utterance);
    }
  }, [passed, character, userName, voicePlayed]);

  // Export Flashcards via simulated n8n webhook and local download
  const handleExportFlashcards = async () => {
    setExporting(true);

    // Format transcript into strict Markdown flashcards (Anki/Obsidian format)
    let markdownContent = `# Tarjetas de Memoria - ${character.name}\n\n`;
    markdownContent += `**Fecha:** ${new Date().toLocaleDateString()}\n`;
    markdownContent += `**Evaluación:** ${passed ? "Aprobado" : "Participación"}\n`;
    markdownContent += `**Puntaje:** ${score}%\n\n`;
    markdownContent += `---\n\n`;

    const userTurns = transcript.filter((t) => t.role === "user");
    const assistantTurns = transcript.filter((t) => t.role === "assistant");

    for (let i = 0; i < Math.min(userTurns.length, assistantTurns.length); i++) {
      markdownContent += `## Q: ¿Qué discutimos sobre: ${userTurns[i].content}?\n`;
      markdownContent += `A: ${assistantTurns[i].content}\n\n`;
      markdownContent += `<!-- Card Divider -->\n\n`;
    }

    if (userTurns.length === 0) {
      markdownContent += `## Q: ¿Cuál es el núcleo del pensamiento de ${character.name}?\n`;
      markdownContent += `A: ${character.greeting}\n\n`;
    }

    try {
      await fetch("https://primary-production-bfd4.up.railway.app/webhook/echoes-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          character: character.name,
          score,
          passed,
          markdown: markdownContent,
          transcript
        })
      }).catch(() => {});
    } catch (e) {}

    // Direct download of the Markdown file
    setTimeout(() => {
      const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Flashcards_${character.id}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExporting(false);
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 text-white select-none">
      
      {/* Back button */}
      <button
        onClick={onDone}
        className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition cursor-pointer mb-8"
      >
        <ArrowLeft className="size-4" />
        Volver al Selector
      </button>

      {/* Main Results Container */}
      <div className="flex flex-col items-center text-center space-y-6">
        
        {passed ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="size-16 text-white animate-bounce" />
            <h1 className="text-4xl font-black uppercase tracking-tight text-white">¡Objetivo Logrado!</h1>
            <p className="text-sm text-neutral-300 max-w-md font-sans">
              Has demostrado un dominio argumental excelente. Has persuadido a {character.name} y ganado tu certificación.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="size-16 text-neutral-400 animate-pulse" />
            <h1 className="text-4xl font-black uppercase tracking-tight text-neutral-200">Misión Incompleta</h1>
            <p className="text-sm text-neutral-400 max-w-md font-sans">
              No has logrado alcanzar el 65% de reputación necesaria. Tu nivel final fue del {score}%. Cuestiona tus premisas históricas y vuelve a intentarlo.
            </p>
          </div>
        )}

        {/* 
          MAJESTIC DIGITAL DIPLOMA (Dark themed parchment)
        */}
        {passed && (
          <div className="w-full max-w-2xl p-8 md:p-12 rounded-3xl border-2 border-[#d4af37] bg-[#1a150b] flex flex-col items-center relative overflow-hidden shadow-xl my-6 text-[#fef3c7] animate-fade-in">
            {/* Background design accents */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-700 via-transparent to-transparent" />
            
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8a7043] font-bold">
              Certificación de Época Digital
            </span>
            
            <div className="h-[1px] w-12 bg-[#d4af37] my-4" />
            
            <h2 className="text-2xl md:text-3xl font-serif italic text-[#fcd34d] mt-2 text-center font-bold">
              Diploma de Competencia Histórica
            </h2>
            
            <p className="text-sm text-[#d4af37] font-sans mt-6">Se otorga solemnemente a:</p>
            
            <input
              type="text"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                localStorage.setItem("echoes_user_name", e.target.value);
              }}
              className="text-center text-xl md:text-2xl font-black uppercase tracking-wider text-white bg-transparent border-b border-[#d4af37]/40 focus:border-[#d4af37] outline-none py-1.5 my-3 w-64 max-w-full font-mono"
            />
            
            <p className="text-xs text-[#d4af37] max-w-md leading-relaxed mt-4 font-sans text-center">
              Por debatir y convencer con éxito a {character.name} en el desafío de argumentación temporal,
              alcanzando un índice de reputación histórica del <strong className="text-white font-black">{score}%</strong>.
            </p>

            <div className="w-full flex justify-between items-end mt-12 pt-6 border-t border-[#d4af37]/20">
              <div className="flex flex-col items-start text-left">
                <span className="text-[9px] font-mono text-[#8a7043] uppercase tracking-widest font-bold">Autoridad</span>
                <span className="text-xs font-bold text-[#fcd34d] font-mono">Echoes of History</span>
              </div>

              {/* Digital Interactive Signature */}
              <div className="flex flex-col items-center">
                <span className="font-serif italic text-lg text-[#fcd34d] select-none cursor-pointer hover:text-white transition-colors" title="Firma verificada digitalmente">
                  {character.name}
                </span>
                <span className="text-[9px] font-mono text-[#8a7043] uppercase tracking-widest mt-1 font-bold">Firma Digital</span>
              </div>
            </div>
          </div>
        )}

        {/* Visual Flashcard Preview (Dark themed) */}
        <div className="w-full max-w-2xl mt-8 text-left space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold border-b border-neutral-800 pb-2">
            Tarjetas de Repaso Generadas ({Math.min(transcript.filter(t => t.role === 'user').length, transcript.filter(t => t.role === 'assistant').length)} tarjetas)
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {transcript.reduce<{ q: string; a: string }[]>((acc, cur, idx, arr) => {
              if (cur.role === "user") {
                const nextAssistant = arr.slice(idx + 1).find((x) => x.role === "assistant");
                if (nextAssistant) {
                  acc.push({ q: cur.content, a: nextAssistant.content });
                }
              }
              return acc;
            }, []).map((card, i) => (
              <div key={i} className="p-5 rounded-2xl border border-neutral-800 bg-black/60 shadow-md flex flex-col justify-between hover:border-neutral-600 transition-colors">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
                    Pregunta (Q)
                  </span>
                  <p className="text-xs font-medium text-neutral-200 mt-1 font-sans">
                    {card.q}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-800">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
                    Respuesta (A)
                  </span>
                  <p className="text-xs italic text-neutral-300 mt-1 font-serif">
                    "{card.a}"
                  </p>
                </div>
              </div>
            ))}

            {transcript.filter(t => t.role === 'user').length === 0 && (
              <div className="p-5 rounded-2xl border border-neutral-800 bg-black/60 col-span-2 text-center text-xs text-neutral-500 font-mono py-8">
                Inicia una conversación para generar tarjetas de estudio.
              </div>
            )}
          </div>
        </div>

        {/* 
          AUTOMATION BUTTON (Dark themed)
        */}
        <div className="flex flex-col items-center gap-4 pt-6">
          <button
            onClick={handleExportFlashcards}
            disabled={exporting}
            className="group flex h-14 items-center justify-center gap-3 rounded-full bg-white text-black hover:bg-neutral-200 border border-white px-10 text-base font-black uppercase tracking-wider transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
          >
            {exporting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Sparkles className="size-5 fill-current animate-pulse" />
                Exportar mis aprendizajes a Obsidian / Anki
              </>
            )}
          </button>
          <span className="text-[10px] font-mono text-neutral-500 tracking-wide uppercase font-bold">
            Integración lista para API de Flashcards
          </span>
        </div>

      </div>

    </div>
  );
}
