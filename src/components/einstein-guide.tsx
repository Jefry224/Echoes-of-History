import { useEffect, useRef, useState } from "react";
import { HeadScene } from "@/components/three/HeadScene";
import { EINSTEIN } from "@/lib/characters";

export function EinsteinGuide() {
  const [spot, setSpot] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  
  const timer = useRef<number | null>(null);

  // Track window scroll and dimensions for responsive 3D frustum math
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleScroll();
    handleResize();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Spot wandering timer (only active if scrolled down and not minimized)
  useEffect(() => {
    if (minimized || scrollY < 50) {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
      return;
    }

    if (timer.current === null) {
      timer.current = window.setInterval(() => {
        setSpot((s) => (s + 1) % 5);
      }, 7500);
    }

    return () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };
  }, [minimized, scrollY]);

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-cyber-purple/40 bg-neutral-950/95 px-4 py-2 text-xs font-mono font-bold text-cyber-purple-light shadow-lg backdrop-blur hover:bg-neutral-900 transition-all cursor-pointer neon-shadow-purple pointer-events-auto"
      >
        <span className="size-2 animate-pulse rounded-full bg-cyber-purple" />
        Llamar a Einstein
      </button>
    );
  }

  // Calculate 3D Frustum boundary coordinates dynamically based on aspect ratio:
  // Camera FOV = 40, Z = 4.2
  // halfHeight = tan(fov / 2) * cameraZ = tan(20) * 4.2 = 0.364 * 4.2 = 1.53 units
  const aspect = dimensions.width / dimensions.height;
  const halfHeight = 1.53;
  
  // Safe limits to prevent head model from clipping off-screen:
  const safetyMarginX = 0.36;
  const safetyMarginY = 0.32;
  const maxX = halfHeight * aspect - safetyMarginX;
  const maxY = halfHeight - safetyMarginY;

  // 3D coordinate spots mapped to the actual viewport screen borders
  const SPOTS_3D = [
    [maxX * 0.9, maxY * 0.85, 0],   // Spot 0: Top-Right
    [-maxX * 0.95, -maxY * 0.2, 0], // Spot 1: Mid-Left
    [maxX * 0.95, maxY * 0.15, 0],  // Spot 2: Mid-Right
    [maxX * 0.9, -maxY * 0.9, 0],   // Spot 3: Bottom-Right
    [-maxX * 0.9, maxY * 0.75, 0],  // Spot 4: Top-Left
  ];

  // Calculate interpolation ratio based on scroll (transition completes over first 320px of scroll)
  const threshold = 320;
  const ratio = Math.min(1, Math.max(0, scrollY / threshold));

  // Determine current active spot
  const activeSpot = SPOTS_3D[spot];

  // 3D positioning interpolation:
  // - Top (ratio = 0): Centered horizontally, shifted downwards to y = -0.65 to sit below Hero title text.
  // - Scrolled (ratio = 1): Glides precisely to the active spot corner.
  const targetX = 0 + (activeSpot[0] - 0) * ratio;
  const targetY = -0.65 + (activeSpot[1] - (-0.65)) * ratio;
  const targetZ = 0;
  
  // Interpolated scale: 0.45 at top (medium-sized centered head), 0.22 when docked
  const targetScale = 0.45 - (0.45 - 0.22) * ratio;

  return (
    <div
      className="fixed inset-0 w-screen h-screen z-20 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <HeadScene
        appearance={EINSTEIN.appearance}
        modelUrl={EINSTEIN.modelUrl}
        className="w-full h-full"
        cameraZ={4.2}
        float={ratio > 0.15} // float breath sway when guide is wandering
        targetPosition={[targetX, targetY, targetZ]}
        targetScale={targetScale}
      />

      {/* "Ocultar Guía" option button floating in corner when guide is docked */}
      {ratio > 0.8 && (
        <button
          onClick={() => setMinimized(true)}
          className="fixed bottom-5 right-5 z-50 pointer-events-auto bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400 hover:text-white py-1.5 px-3 rounded-full transition-colors cursor-pointer"
        >
          ocultar guía
        </button>
      )}
    </div>
  );
}
