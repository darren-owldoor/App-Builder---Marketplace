import { useEffect, useState } from "react";

export const AnimatedScrollLine = () => {
  const [path, setPath] = useState("M 0 50 L 1000 50");

  // Simplified owl outline path (traced from the line art)
  const OWL_PATH = "M 400 30 Q 350 20 320 40 L 300 45 Q 280 35 280 55 Q 280 70 295 75 Q 290 80 295 90 Q 300 95 310 92 L 320 120 Q 340 130 360 125 L 380 150 L 420 150 Q 450 155 480 150 L 500 150 L 520 125 Q 540 130 560 120 L 570 92 Q 580 95 585 90 Q 590 80 585 75 Q 600 70 600 55 Q 600 35 580 45 L 560 40 Q 530 20 480 30 M 360 60 Q 350 50 345 65 Q 350 75 360 70 M 520 60 Q 530 50 535 65 Q 530 75 520 70 M 320 160 L 340 165 L 360 160 M 520 160 L 540 165 L 560 160";

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const pageHeight = document.body.scrollHeight;
      const scrollPercent = scrollY / (pageHeight - windowHeight);

      console.log('Scroll %:', scrollPercent.toFixed(2), 'ScrollY:', scrollY);

      // Between 20% and 70% scroll: zig-zag in middle section
      if (scrollPercent > 0.2 && scrollPercent < 0.7) {
        const waveFrequency = 5;
        const waveAmplitude = 40;
        
        let newPath = "M 0 50";
        for (let i = 1; i <= 100; i++) {
          const x = i * 10;
          const y = 50 + Math.sin((x / 1000) * waveFrequency * Math.PI * 2 + scrollY * 0.01) * waveAmplitude;
          newPath += ` L ${x} ${y}`;
        }
        console.log('Setting zig-zag path');
        setPath(newPath);
      } 
      // At 80%+ scroll: transform into owl
      else if (scrollPercent >= 0.8) {
        console.log('Setting owl path');
        setPath(OWL_PATH);
      } 
      // Otherwise: horizontal line
      else {
        console.log('Setting horizontal path');
        setPath("M 0 50 L 1000 50");
      }
    };

    const onScroll = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div className="absolute left-0 w-full pointer-events-none z-10" style={{ top: "870px", height: "100px" }}>
      <svg
        className="w-full h-full"
        viewBox="0 0 1000 200"
        preserveAspectRatio="none"
      >
        <path
          d={path}
          stroke="hsl(var(--muted-foreground) / 0.3)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "d 0.1s ease-out" }}
        />
      </svg>
    </div>
  );
};