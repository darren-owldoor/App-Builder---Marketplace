import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";

export const AnimatedOwlMorph = () => {
  const [dots, setDots] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const controls = useAnimation();
  const [isMorphed, setIsMorphed] = useState(false);

  // Generate initial sine wave dots
  useEffect(() => {
    const width = 1000;
    const amplitude = 60;
    const wavelength = 250;
    const spacing = 14;
    const generatedDots = [];
    
    for (let x = 0; x <= width; x += spacing) {
      const y = 200 + Math.sin((x / wavelength) * 2 * Math.PI) * amplitude;
      generatedDots.push({ x, y, id: x });
    }
    
    setDots(generatedDots);
  }, []);

  // Owl path points (approximated from the SVG path)
  const getOwlPoints = (totalDots: number) => {
    const owlPoints = [];
    const segments = [
      // Top of head (left to right curve)
      { startX: 300, startY: 150, endX: 500, endY: 50, points: Math.floor(totalDots * 0.15) },
      { startX: 500, startY: 50, endX: 700, endY: 150, points: Math.floor(totalDots * 0.15) },
      // Right side
      { startX: 700, startY: 150, endX: 720, endY: 200, points: Math.floor(totalDots * 0.1) },
      { startX: 720, startY: 200, endX: 680, endY: 250, points: Math.floor(totalDots * 0.1) },
      // Bottom curve (right to left)
      { startX: 680, startY: 250, endX: 500, endY: 350, points: Math.floor(totalDots * 0.2) },
      { startX: 500, startY: 350, endX: 320, endY: 250, points: Math.floor(totalDots * 0.2) },
      // Left side back up
      { startX: 320, startY: 250, endX: 280, endY: 200, points: Math.floor(totalDots * 0.1) },
    ];

    segments.forEach(segment => {
      for (let i = 0; i < segment.points; i++) {
        const t = i / segment.points;
        const x = segment.startX + (segment.endX - segment.startX) * t;
        const y = segment.startY + (segment.endY - segment.startY) * t;
        owlPoints.push({ x, y });
      }
    });

    // Fill remaining dots
    while (owlPoints.length < totalDots) {
      owlPoints.push({ x: 300, y: 150 });
    }

    return owlPoints;
  };

  // Animation loop
  useEffect(() => {
    if (dots.length === 0) return;

    const animate = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsMorphed(true);
      await new Promise(resolve => setTimeout(resolve, 4000));
      setIsMorphed(false);
      await new Promise(resolve => setTimeout(resolve, 2000));
      animate();
    };

    animate();
  }, [dots.length]);

  const owlPoints = dots.length > 0 ? getOwlPoints(dots.length) : [];

  return (
    <div className="w-full flex items-center justify-center py-20 bg-transparent">
      <svg viewBox="0 0 1000 400" className="w-full max-w-[800px] h-auto">
        <g>
          {dots.map((dot, index) => {
            const targetX = isMorphed && owlPoints[index] ? owlPoints[index].x : dot.x;
            const targetY = isMorphed && owlPoints[index] ? owlPoints[index].y : dot.y;
            
            return (
              <motion.circle
                key={dot.id}
                cx={dot.x}
                cy={dot.y}
                r={3.2}
                className="fill-primary opacity-90"
                animate={{
                  cx: targetX,
                  cy: targetY,
                }}
                transition={{
                  duration: 1.5,
                  ease: [0.4, 0, 0.2, 1],
                  delay: index * 0.003,
                }}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};
