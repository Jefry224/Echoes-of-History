import { useState } from "react";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CharacterPreview } from "@/components/landing/CharacterPreview";
import { EinsteinGuide } from "@/components/einstein-guide";
import { ParticleBackground } from "@/components/ParticleBackground";
import { CharacterSelector } from "@/components/app/CharacterSelector";
import { CallInterface } from "@/components/app/CallInterface";
import { RewardsPanel } from "@/components/app/RewardsPanel";
import { DebateInterface } from "@/components/app/DebateInterface";
import type { Character } from "@/lib/characters";
import "./index.css";

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
      {/* Global modern white particles and dark veil waves background */}
      <ParticleBackground />

      {view === "landing" ? (
        <>
          <Hero onEnterMuseum={handleEnterApp} />
          <HowItWorks />
          <CharacterPreview onEnterMuseum={handleEnterApp} />
          <footer className="relative z-30 border-t border-neutral-900 bg-neutral-950/20 px-6 py-10 text-center text-xs font-mono text-neutral-500 uppercase tracking-wider">
            Echoes of History — un portal para conversar con el tiempo.
          </footer>
          <EinsteinGuide />
        </>
      ) : (
        /* App View Navigator */
        <div className="relative min-h-screen z-10">
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
              mode={mode}
              onDone={() => setAppState("selector")}
            />
          )}
        </div>
      )}
    </main>
  );
}

export default App;
