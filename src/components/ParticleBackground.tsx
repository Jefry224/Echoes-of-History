import { useEffect, useRef } from "react";

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Create glowing dark particles (floating light particles on dark background)
    const particles: { x: number; y: number; r: number; dy: number; alpha: number; dAlpha: number }[] = [];
    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.8 + 0.5,
        dy: -(Math.random() * 0.15 + 0.06), // slow float upwards
        alpha: Math.random() * 0.4 + 0.2,
        dAlpha: (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1), // twinkle
      });
    }

    let time = 0;
    const gridSize = 65;

    const draw = () => {
      // Clear with dark base color
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, width, height);

      time += 0.005;

      // Draw flowing silk waves (Dark Veil Cosmic Dust effect in white color)
      ctx.lineWidth = 1.0;
      const waveCount = 5;
      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();
        const waveAlpha = 0.05 + (i / waveCount) * 0.05;
        ctx.strokeStyle = `rgba(255, 255, 255, ${waveAlpha})`;
        
        const phaseOffset = i * (Math.PI / 3);
        const amplitude1 = 70 + i * 15;
        const amplitude2 = 30 + i * 8;
        
        for (let x = 0; x < width; x += 15) {
          const y = height * 0.5 + 
            Math.sin(x * 0.0012 + time * 1.2 + phaseOffset) * amplitude1 + 
            Math.cos(x * 0.0007 - time * 0.6 + phaseOffset * 1.5) * amplitude2;
            
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Draw subtle grid lines in light-gray
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw twinkling light stars
      particles.forEach((p) => {
        p.alpha += p.dAlpha;
        if (p.alpha <= 0.2 || p.alpha >= 0.85) {
          p.dAlpha = -p.dAlpha;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();

        // Slow movement
        p.y += p.dy;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-20 w-screen h-screen pointer-events-none bg-[#050505]"
    />
  );
}
