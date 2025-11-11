import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import agentBefore from "@/assets/agent-before.png";
import agentAfter from "@/assets/agent-after.png";

export const ScrollFlipCard = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!cardRef.current) return;

      const card = cardRef.current;
      const rect = card.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Flip when card is in the middle of the viewport
      const shouldFlip = rect.top < windowHeight / 2 && rect.bottom > windowHeight / 2;
      setIsFlipped(shouldFlip);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={cardRef} className="flex items-center justify-center" style={{ minHeight: "165vh", paddingTop: "100px", paddingBottom: "50px" }}>
      <div className="sticky top-1/2 -translate-y-1/2 perspective-1000 w-full max-w-xl">
        <Card 
          className="relative transition-transform duration-[3000ms] transform-style-3d shadow-2xl rounded-3xl overflow-hidden"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            backgroundColor: "#f7f5ed",
          }}
        >
          {/* Front Side - Before */}
          <div 
            className="backface-hidden p-6 pb-2"
            style={{
              backfaceVisibility: "hidden",
              backgroundColor: "#f7f5ed",
            }}
          >
            <h2 className="text-9xl font-bold text-center mb-8 text-primary">
              Before
            </h2>
            <div className="flex justify-center">
              <img 
                src={agentBefore} 
                alt="Agent before - thinking about selling"
                className="w-[95%] h-auto rounded-lg"
              />
            </div>
          </div>

          {/* Back Side - After */}
          <div 
            className="absolute inset-0 backface-hidden p-6 pb-2"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              backgroundColor: "#f7f5ed",
            }}
          >
            <h2 className="text-9xl font-bold text-center mb-8 text-primary">
              After
            </h2>
            <div className="flex justify-center">
              <img 
                src={agentAfter} 
                alt="Agent after - confidently holding for sale sign"
                className="w-[95%] h-auto rounded-lg"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
