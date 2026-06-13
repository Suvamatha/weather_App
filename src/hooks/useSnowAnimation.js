import { useEffect, useRef, useState, useCallback } from "react";

export function useSnowAnimation(canvasRef, isSnowing, isTyping) {
  const requestRef = useRef(null);
  const particlesRef = useRef([]);
  const frameTimesRef = useRef([]);
  const fpsRef = useRef(60);
  const maxParticlesRef = useRef(100);
  const [performanceAlert, setPerformanceAlert] = useState(false);
  const [isSnowDisabled, setIsSnowDisabled] = useState(false);

  // Resize handler for canvas matching window dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [canvasRef]);

  // Main animation effect loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isSnowing || isTyping || isSnowDisabled) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      // Clear canvas if it's inactive
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const ctx = canvas.getContext("2d");
    let animationActive = true;
    let lastTime = performance.now();

    // Populate particles if they don't exist
    if (particlesRef.current.length === 0) {
      const particles = [];
      const count = maxParticlesRef.current;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 3.5 + 1.2, // particle radius (1.2px to 4.7px)
          d: Math.random() * count, // horizontal sway speed coefficient
          speedY: Math.random() * 1.5 + 0.6,
          speedX: Math.random() * 0.8 - 0.4,
          opacity: Math.random() * 0.4 + 0.5,
        });
      }
      particlesRef.current = particles;
    }

    const updateAndDraw = (time) => {
      if (!animationActive) return;

      const delta = time - lastTime;
      lastTime = time;

      // Calculate FPS and adjust particles
      if (delta > 0) {
        const currentFps = 1000 / delta;
        frameTimesRef.current.push(currentFps);
        if (frameTimesRef.current.length > 80) {
          frameTimesRef.current.shift();
        }

        const avgFps =
          frameTimesRef.current.reduce((a, b) => a + b, 0) /
          frameTimesRef.current.length;
        fpsRef.current = avgFps;

        // Perform threshold checks after gathering enough frames (at least 60)
        if (frameTimesRef.current.length >= 60) {
          if (avgFps < 42 && maxParticlesRef.current > 30) {
            // Drop particles
            maxParticlesRef.current = Math.max(20, maxParticlesRef.current - 15);
            particlesRef.current = particlesRef.current.slice(
              0,
              maxParticlesRef.current
            );
            frameTimesRef.current = []; // Reset window to let things settle
            console.warn(`Lag detected (${avgFps.toFixed(1)} FPS). Reducing particle density to ${maxParticlesRef.current}`);
          } else if (avgFps < 28 && maxParticlesRef.current <= 30) {
            // Extreme lag, disable snow completely
            console.error(`Extreme lag (${avgFps.toFixed(1)} FPS). Disabling snow animation for battery/CPU preservation.`);
            setIsSnowDisabled(true);
            setPerformanceAlert(true);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            animationActive = false;
            return;
          }
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const w = canvas.width;
      const h = canvas.height;

      // Single path draw command for optimal GPU rendering performance
      ctx.beginPath();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);

        // Update physics positions
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(time / 1000 + p.d) * 0.25;

        // Wrap around borders
        if (p.y > h + 10 || p.x > w + 10 || p.x < -10) {
          p.x = Math.random() * w;
          p.y = -10;
        }
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fill();

      requestRef.current = requestAnimationFrame(updateAndDraw);
    };

    requestRef.current = requestAnimationFrame(updateAndDraw);

    return () => {
      animationActive = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [canvasRef, isSnowing, isTyping, isSnowDisabled]);

  const reEnableSnow = useCallback(() => {
    setIsSnowDisabled(false);
    setPerformanceAlert(false);
    maxParticlesRef.current = 100;
    frameTimesRef.current = [];
    fpsRef.current = 60;
  }, []);

  return {
    fps: fpsRef.current,
    maxParticles: maxParticlesRef.current,
    performanceAlert,
    isSnowDisabled,
    reEnableSnow,
  };
}
