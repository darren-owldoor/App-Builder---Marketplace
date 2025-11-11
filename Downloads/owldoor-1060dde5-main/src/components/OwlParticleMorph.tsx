import { useEffect, useRef } from "react";

export const OwlParticleMorph = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = Math.min(parent.offsetWidth * 0.6, window.innerHeight * 0.6);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.width;
    const H = () => canvas.height;

    // Parameters
    const DOT_COUNT = 300;
    const AMP = 60;
    const WAVELEN = 250;
    const R = 3;

    // Particle class
    class Dot {
      i: number;
      pos: { x: number; y: number };
      target: { x: number; y: number };
      phase: number;

      constructor(i: number) {
        this.i = i;
        this.pos = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 };
        this.phase = Math.random() * Math.PI * 2;
      }

      moveTo(x: number, y: number) {
        this.target.x = x;
        this.target.y = y;
      }

      update() {
        this.pos.x += (this.target.x - this.pos.x) * 0.08;
        this.pos.y += (this.target.y - this.pos.y) * 0.08;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, R, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create dots
    const dots = Array.from({ length: DOT_COUNT }, (_, i) => new Dot(i));

    // Build target shapes
    function sinePoints() {
      const pts = [];
      for (let i = 0; i < DOT_COUNT; i++) {
        const x = (i / (DOT_COUNT - 1)) * W();
        const y = H() / 2 + Math.sin((x / WAVELEN) * 2 * Math.PI) * AMP;
        pts.push({ x, y });
      }
      return pts;
    }

    function owlPoints() {
      const pts = [];
      const cx = W() / 2;
      const cy = H() / 2;
      for (let i = 0; i < DOT_COUNT; i++) {
        const t = i / DOT_COUNT;
        let x, y;
        if (t < 0.33) {
          // left eye
          const a = (t / 0.33) * 2 * Math.PI;
          x = cx - 60 + Math.cos(a) * 18;
          y = cy - 40 + Math.sin(a) * 18;
        } else if (t < 0.66) {
          // right eye
          const a = ((t - 0.33) / 0.33) * 2 * Math.PI;
          x = cx + 60 + Math.cos(a) * 18;
          y = cy - 40 + Math.sin(a) * 18;
        } else {
          // body oval
          const a = ((t - 0.66) / 0.34) * 2 * Math.PI;
          x = cx + Math.cos(a) * 70;
          y = cy + 40 + Math.sin(a) * 90;
        }
        pts.push({ x, y });
      }
      return pts;
    }

    let lineShape = sinePoints();
    let owlShape = owlPoints();
    dots.forEach((d, i) => {
      d.pos = { ...lineShape[i] };
      d.target = { ...lineShape[i] };
    });

    // State machine
    let toOwl = true;
    const interval = setInterval(() => {
      lineShape = sinePoints();
      owlShape = owlPoints();
      const targetPts = toOwl ? owlShape : lineShape;
      dots.forEach((d, i) => {
        const p = targetPts[i];
        d.moveTo(p.x, p.y);
      });
      toOwl = !toOwl;
    }, 4500);

    // Draw loop
    let animationId: number;
    function draw() {
      ctx.clearRect(0, 0, W(), H());
      ctx.fillStyle = 'hsl(var(--primary))';
      dots.forEach((d) => {
        d.update();
        d.draw();
      });
      animationId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      clearInterval(interval);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="w-full flex justify-center items-center py-12">
      <canvas
        ref={canvasRef}
        className="w-[90vw] max-w-[1000px] rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      />
    </div>
  );
};
