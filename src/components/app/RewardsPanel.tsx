import { useEffect, useRef, useState } from "react";
import type { Character } from "@/lib/characters";
import { Sparkles, CheckCircle, XCircle, ArrowLeft, Loader2, Mail, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface RewardsPanelProps {
  character: Character;
  score: number;
  passed: boolean;
  transcript: { role: string; content: string }[];
  mode: "casual" | "mission";
  onDone: () => void;
}

export function RewardsPanel({ character, score, passed, transcript, mode, onDone }: RewardsPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem("echoes_user_name") || "Investigador";
  });
  const [userEmail, setUserEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const cachedMarkdown = useRef<string>("");
  const [voicePlayed, setVoicePlayed] = useState(false);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  // Play ElevenLabs simulated congratulations audio on mount
  useEffect(() => {
    if (voicePlayed) return;
    setVoicePlayed(true);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const congratsText = mode === "mission"
        ? (passed
          ? `Felicidades, ${userName}. Has completado con éxito la misión con ${character.name}. Tu entendimiento de la historia es verdaderamente admirable.`
          : `Lamentablemente, ${userName}, no has logrado convencer a ${character.name} en esta ocasión. Revisa tu estrategia y vuelve a intentarlo.`)
        : `Gracias, ${userName}, por conversar con ${character.name}. Espero que hayas aprendido valiosas lecciones de nuestra charla libre.`;

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

  const buildLocalMarkdown = () => {
    let md = `# Tarjetas de Memoria - ${character.name}\n\n`;
    md += `**Fecha:** ${new Date().toLocaleDateString()}\n`;
    md += `**Evaluación:** ${passed ? "Aprobado" : "Participación"}\n`;
    md += `**Puntaje:** ${score}%\n\n---\n\n`;

    const userTurns = transcript.filter((t) => t.role === "user");
    const assistantTurns = transcript.filter((t) => t.role === "assistant");

    for (let i = 0; i < Math.min(userTurns.length, assistantTurns.length); i++) {
      md += `## Q: ¿Qué discutimos sobre: ${userTurns[i].content}?\n`;
      md += `A: ${assistantTurns[i].content}\n\n<!-- Card Divider -->\n\n`;
    }

    if (userTurns.length === 0) {
      md += `## Q: ¿Cuál es el núcleo del pensamiento de ${character.name}?\n`;
      md += `A: ${character.greeting}\n\n`;
    }

    return md;
  };

  const triggerDownload = (markdown: string) => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Flashcards_${character.id}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportFlashcards = async () => {
    setEmailError("");

    if (!userEmail.trim() || !userEmail.includes("@")) {
      setEmailError("Ingresa un correo válido para continuar.");
      return;
    }

    setExporting(true);
    const localMarkdown = buildLocalMarkdown();
    cachedMarkdown.current = localMarkdown;

    let pdfBase64 = "";

    // Generate PDF base64 and trigger local download
    const element = pdfTemplateRef.current;
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: 1.2,
          useCORS: true,
          backgroundColor: "#0b0f19",
          logging: false
        });

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const imgData = canvas.toDataURL("image/jpeg", 0.8);

        const pdf = new jsPDF("p", "mm", "a4");
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Get base64 string without data URI prefix
        pdfBase64 = pdf.output("datauristring").split(",")[1];

        // Download locally
        pdf.save(`Flashcards_${character.id}.pdf`);
      } catch (e) {
        console.error("Error generating PDF", e);
      }
    }

    try {
      const res = await fetch("https://primary-production-bfd4.up.railway.app/webhook/echoes-flashcards", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          userName,
          email: userEmail.trim(),
          character: character.name,
          score,
          passed,
          transcript,
          localMarkdown,
          pdfBase64,
        }),
      });

      if (res.ok) {
        try {
          const data = await res.json();
          if (data?.markdown) {
            cachedMarkdown.current = data.markdown;
          }
        } catch {
          // response not JSON — use local fallback
        }
        setEmailSent(true);
      }
    } catch (e) {
      console.error("Network error sending to webhook:", e);
    } finally {
      setExporting(false);
    }
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
        
        {mode === "mission" ? (
          passed ? (
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
          )
        ) : (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="size-16 text-white animate-bounce" />
            <h1 className="text-4xl font-black uppercase tracking-tight text-white">Conversación Finalizada</h1>
            <p className="text-sm text-neutral-300 max-w-md font-sans">
              Gracias por debatir con {character.name}. Se han recopilado tus tarjetas de repaso basadas en la charla libre.
            </p>
          </div>
        )}

        {/* 
          MAJESTIC DIGITAL DIPLOMA (Dark themed parchment)
        */}
        {mode === "mission" && passed && (
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

        {/* EMAIL + EXPORT */}
        <div className="flex flex-col items-center gap-4 pt-6 w-full max-w-md">

          {!emailSent ? (
            <>
              {/* Email input */}
              <div className="w-full flex flex-col gap-1">
                <label
                  htmlFor="export-email"
                  className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-bold"
                >
                  Correo para recibir las flashcards
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500 pointer-events-none" />
                  <input
                    id="export-email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={userEmail}
                    onChange={(e) => {
                      setUserEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleExportFlashcards();
                    }}
                    aria-label="Correo electrónico de destino"
                    aria-describedby={emailError ? "email-error" : undefined}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900 pl-9 pr-4 py-3 text-sm text-white placeholder:text-neutral-600 font-mono focus:outline-none focus:border-neutral-400 transition-colors"
                  />
                </div>
                {emailError && (
                  <p id="email-error" role="alert" className="text-[11px] text-red-400 font-mono mt-1">
                    {emailError}
                  </p>
                )}
              </div>

              {/* Export button */}
              <button
                onClick={handleExportFlashcards}
                disabled={exporting}
                aria-busy={exporting}
                className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-white text-black hover:bg-neutral-200 border border-white px-10 text-base font-black uppercase tracking-wider transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 cursor-pointer shadow-lg"
              >
                {exporting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Analizando con Codex...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-5 fill-current animate-pulse" />
                    Exportar mis aprendizajes a Obsidian / Anki
                  </>
                )}
              </button>

              <span className="text-[10px] font-mono text-neutral-500 tracking-wide uppercase font-bold">
                Codex · n8n · Envío automático por correo
              </span>
            </>
          ) : (
            /* Post-send confirmation */
            <div className="flex flex-col items-center gap-4 w-full">
              <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-700 bg-neutral-900/80 px-8 py-6 w-full text-center"
              >
                <CheckCircle className="size-10 text-white animate-bounce" />
                <p className="text-sm font-black uppercase tracking-wide text-white">
                  ¡Flashcards enviadas por Correo!
                </p>
                <p className="text-xs font-mono text-neutral-400">
                  Revisa tu bandeja en{" "}
                  <span className="text-neutral-200 font-bold">{userEmail}</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  onClick={() => triggerDownload(cachedMarkdown.current || buildLocalMarkdown())}
                  aria-label="Descargar archivo Markdown para Obsidian / Anki"
                  className="flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 rounded-xl px-4 py-2 transition-colors cursor-pointer"
                >
                  <Download className="size-4" />
                  Descargar Markdown (.md)
                </button>

                <button
                  onClick={async () => {
                    const element = pdfTemplateRef.current;
                    if (element) {
                      try {
                        const canvas = await html2canvas(element, {
                          scale: 1.2,
                          useCORS: true,
                          backgroundColor: "#0b0f19",
                          logging: false
                        });

                        const imgWidth = 210;
                        const pageHeight = 297;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        const imgData = canvas.toDataURL("image/jpeg", 0.8);

                        const pdf = new jsPDF("p", "mm", "a4");
                        let heightLeft = imgHeight;
                        let position = 0;

                        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;

                        while (heightLeft >= 0) {
                          position = heightLeft - imgHeight;
                          pdf.addPage();
                          pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
                          heightLeft -= pageHeight;
                        }
                        pdf.save(`Flashcards_${character.id}.pdf`);
                      } catch (e) {
                        console.error("Error downloading PDF", e);
                      }
                    }
                  }}
                  aria-label="Descargar archivo PDF nuevamente"
                  className="flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 rounded-xl px-4 py-2 transition-colors cursor-pointer"
                >
                  <Download className="size-4" />
                  Descargar PDF (.pdf)
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Hidden off-screen PDF template styled using pure inline CSS to avoid Tailwind v4 oklch() color space error in html2canvas */}
      <div
        ref={pdfTemplateRef}
        style={{
          position: "fixed",
          left: "-9999px",
          top: "0",
          width: "800px",
          backgroundColor: "#0b0f19",
          color: "#ffffff",
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          fontFamily: "system-ui, sans-serif",
          zIndex: -50,
          pointerEvents: "none"
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", paddingBottom: "24px", borderBottom: "1px solid #1f2937" }}>
          <span style={{ color: "#737373", fontFamily: "monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", display: "block", marginBottom: "8px", fontWeight: "bold" }}>
            [ APRENDIZAJES ADQUIRIDOS ]
          </span>
          <h1 style={{ fontSize: "30px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "-0.025em", color: "#ffffff", margin: 0 }}>
            ECHOES OF HISTORY
          </h1>
          <p style={{ fontSize: "12px", color: "#a3a3a3", fontFamily: "monospace", marginTop: "4px", fontWeight: "bold" }}>
            Sincronización Temporal Exitosa &bull; {character.name}
          </p>
        </div>

        {/* Certificate (only if mode === "mission" and passed) */}
        {mode === "mission" && passed && (
          <div style={{ padding: "40px", borderRadius: "24px", border: "2px solid #d4af37", backgroundColor: "#1a150b", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", color: "#fef3c7", position: "relative", overflow: "hidden" }}>
            <span style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em", color: "#8a7043", fontWeight: "bold" }}>
              Certificación de Época Digital
            </span>
            <div style={{ height: "1px", width: "48px", backgroundColor: "#d4af37", margin: "12px 0" }} />
            <h2 style={{ fontSize: "24px", fontFamily: "Georgia, serif", fontStyle: "italic", color: "#fcd34d", fontWeight: "bold", margin: "8px 0" }}>
              Diploma de Competencia Histórica
            </h2>
            <p style={{ fontSize: "12px", color: "#d4af37", fontFamily: "sans-serif", marginTop: "16px" }}>Se otorga solemnemente a:</p>
            <span style={{ fontSize: "20px", fontWeight: "950", textTransform: "uppercase", letterSpacing: "0.05em", color: "#ffffff", borderBottom: "1px solid rgba(212,175,55,0.4)", paddingBottom: "6px", margin: "8px 0", minWidth: "200px", fontFamily: "monospace", display: "block" }}>
              {userName}
            </span>
            <p style={{ fontSize: "12px", color: "#d4af37", maxWidth: "450px", lineHeight: "1.6", marginTop: "12px", fontFamily: "sans-serif" }}>
              Por debatir y convencer con éxito a {character.name} en el desafío de argumentación temporal,
              alcanzando un índice de reputación histórica del <strong style={{ color: "#ffffff", fontWeight: "900" }}>{score}%</strong>.
            </p>
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "32px", paddingTop: "16px", borderTop: "1px solid rgba(212,175,55,0.2)" }}>
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#8a7043", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "bold", display: "block" }}>Autoridad</span>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: "#fcd34d", fontFamily: "monospace" }}>Echoes of History</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "16px", color: "#fcd34d", fontWeight: "bold", display: "block" }}>{character.name}</span>
                <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#8a7043", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "bold", display: "block" }}>Firma Digital</span>
              </div>
            </div>
          </div>
        )}

        {/* Flashcards section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ fontSize: "11px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a3a3a3", fontWeight: "bold", borderBottom: "1px solid #1f2937", paddingBottom: "8px", margin: 0 }}>
            Tarjetas de Repaso
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {transcript.reduce<{ q: string; a: string }[]>((acc, cur, idx, arr) => {
              if (cur.role === "user") {
                const nextAssistant = arr.slice(idx + 1).find((x) => x.role === "assistant");
                if (nextAssistant) {
                  acc.push({ q: cur.content, a: nextAssistant.content });
                }
              }
              return acc;
            }, []).map((card, i) => (
              <div key={i} style={{ padding: "20px", borderRadius: "16px", border: "1px solid #1f2937", backgroundColor: "#070b13", display: "flex", flexDirection: "column", justifyContent: "space-between", pageBreakInside: "avoid" }}>
                <div>
                  <span style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.05em", color: "#737373", fontWeight: "bold", display: "block" }}>Pregunta (Q)</span>
                  <p style={{ fontSize: "12px", fontWeight: "500", color: "#e5e5e5", marginTop: "4px", fontFamily: "sans-serif", lineHeight: "1.5" }}>{card.q}</p>
                </div>
                <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #1f2937" }}>
                  <span style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.05em", color: "#737373", fontWeight: "bold", display: "block" }}>Respuesta (A)</span>
                  <p style={{ fontSize: "12px", fontStyle: "italic", color: "#d4d4d4", marginTop: "4px", fontFamily: "Georgia, serif", lineHeight: "1.5" }}>"{card.a}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", paddingTop: "32px", borderTop: "1px solid #1f2937", marginTop: "auto" }}>
          <p style={{ fontSize: "10px", fontFamily: "monospace", color: "#737373", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: "bold" }}>
            Generado por Echoes of History &bull; Hackathon 2026
          </p>
        </div>
      </div>

    </div>
  );
}
