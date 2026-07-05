import { useState, lazy, Suspense } from "react";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CharacterPreview } from "@/components/landing/CharacterPreview";
import { ParticleBackground } from "@/components/ParticleBackground";
import type { Character } from "@/lib/characters";
import "./index.css";
import { DebateInterface } from "./components/app/DebateInterface";

const EinsteinGuide    = lazy(() => import("@/components/einstein-guide").then(m => ({ default: m.EinsteinGuide })));
const CharacterSelector = lazy(() => import("@/components/app/CharacterSelector").then(m => ({ default: m.CharacterSelector })));
const CallInterface    = lazy(() => import("@/components/app/CallInterface").then(m => ({ default: m.CallInterface })));
const RewardsPanel     = lazy(() => import("@/components/app/RewardsPanel").then(m => ({ default: m.RewardsPanel })));

function App() {
  const [view, setView] = useState<"landing" | "app">("landing");
  const [appState, setAppState] = useState<"selector" | "call" | "rewards" | "debate">("selector");
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
  const [mode, setMode] = useState<"casual" | "mission">("casual");
  const [activeMission, setActiveMission] = useState<string | undefined>(undefined);

  // Debate states
  const [debateCharacters, setDebateCharacters] = useState<[Character, Character] | null>(null);
  const [debateTopic, setDebateTopic] = useState<string>("");

  // Evaluation & Reward states
  const [lastTranscript, setLastTranscript] = useState<{ role: string; content: string }[]>([]);
  const [lastScore, setLastScore] = useState(0);
  const [lastPassed, setLastPassed] = useState(false);

  const handleEnterApp = () => {
    setView("app");
    setAppState("selector");
  };

  const handleBackToLanding = () => {
    setView("landing");
  };

  const handleStartCall = (char: Character, selectedMode: "casual" | "mission", missionText?: string) => {
    setActiveCharacter(char);
    setMode(selectedMode);
    setActiveMission(missionText);
    setAppState("call");
  };

  const handleStartDebate = (char1: Character, char2: Character, topic: string) => {
    setDebateCharacters([char1, char2]);
    setDebateTopic(topic);
    setAppState("debate");
  };

  const handleCallFinished = (
    transcript: { role: string; content: string }[],
    score: number,
    passed: boolean
  ) => {
    setLastTranscript(transcript);
    setLastScore(score);
    setLastPassed(passed);
    setAppState("rewards");
  };

  return (
    <main className="relative min-h-screen bg-transparent text-white overflow-x-hidden font-sans">
      <ParticleBackground />

      {view === "landing" ? (
        <>
          <Hero onEnterMuseum={handleEnterApp} />
          <HowItWorks />
          <CharacterPreview onEnterMuseum={handleEnterApp} />
          <footer className="relative z-30 border-t border-neutral-900 bg-neutral-950/20 px-6 py-10 text-center text-xs font-mono text-neutral-500 uppercase tracking-wider">
            Echoes of History — un portal para conversar con el tiempo.
          </footer>
          <Suspense fallback={null}>
            <EinsteinGuide />
          </Suspense>
        </>
      ) : (
        <div className="relative min-h-screen z-10">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <span className="text-xs font-mono text-neutral-500 animate-pulse tracking-widest uppercase">
                Cargando...
              </span>
            </div>
          }>
            {appState === "selector" && (
              <CharacterSelector 
                onBack={handleBackToLanding} 
                onStart={handleStartCall} 
                onStartDebate={handleStartDebate}
              />
            )}

            {appState === "call" && activeCharacter && (
              <CallInterface
                character={activeCharacter}
                mode={mode}
                missionText={activeMission}
                onBack={() => setAppState("selector")}
                onHangUp={handleCallFinished}
              />
            )}

          {appState === "debate" && debateCharacters && (
            <DebateInterface
              characters={debateCharacters}
              topic={debateTopic}
              onBack={() => setAppState("selector")}
            />
          )}

          {appState === "rewards" && activeCharacter && (
            <RewardsPanel
              character={activeCharacter}
              score={lastScore}
              passed={lastPassed}
              transcript={lastTranscript}
              onDone={() => setAppState("selector")}
            />
          )}
          </Suspense>
        </div>
      )}
    </main>
  );
}

export default App;
