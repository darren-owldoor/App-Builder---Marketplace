import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

const questions = [
  {
    text: "How can I find a branch that values my experience?",
    icon: "💼"
  },
  {
    text: "Where can I get better commission splits?",
    icon: "💰"
  },
  {
    text: "Who provides quality leads consistently?",
    icon: "📊"
  },
  {
    text: "Which companies offer the best technology?",
    icon: "💻"
  },
  {
    text: "How do I access better training programs?",
    icon: "📚"
  }
];

export const MortgageQuestionCards = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % questions.length);
        setIsTransitioning(false);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative py-16 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Cards Container */}
          <div className="relative h-[400px] md:h-[300px] flex items-center justify-center">
            {/* Side Cards (Blurred Background) */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-30 blur-sm scale-90 hidden md:block">
              <Card className="w-64 h-64 bg-accent/20 border-accent/30" />
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-30 blur-sm scale-90 hidden md:block">
              <Card className="w-64 h-64 bg-accent/20 border-accent/30" />
            </div>

            {/* Main Card */}
            <Card 
              className={`
                relative z-10 w-full max-w-lg h-72 md:h-64
                bg-background border-2 border-primary/20
                flex flex-col items-center justify-center p-8
                shadow-2xl
                transition-all duration-500
                ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
              `}
            >
              <div className="text-6xl mb-6 animate-bounce">
                {questions[currentIndex].icon}
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-center text-foreground leading-relaxed">
                {questions[currentIndex].text}
              </h3>
            </Card>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`
                  w-3 h-3 rounded-full transition-all duration-300
                  ${index === currentIndex 
                    ? 'bg-primary w-8' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }
                `}
                aria-label={`Go to question ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
