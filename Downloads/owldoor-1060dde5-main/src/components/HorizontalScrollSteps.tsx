import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface Step {
  number: string;
  title: string;
  description: string;
  details: string[];
}

const steps: Step[] = [
  {
    number: "01",
    title: "Profile Analysis",
    description: "We analyze agent experience, goals, and preferences to understand what they're looking for.",
    details: [
      "Experience level assessment",
      "Career goals analysis",
      "Tech preference evaluation"
    ]
  },
  {
    number: "02",
    title: "Brokerage Scanning",
    description: "Our AI scans hundreds of brokerages to find ones that match specific criteria.",
    details: [
      "247+ brokerages evaluated",
      "12 matching factors",
      "Location-based filtering"
    ]
  },
  {
    number: "03",
    title: "Compatibility Scoring",
    description: "Advanced algorithms calculate compatibility scores across multiple dimensions.",
    details: [
      "Lead generation: 95% match",
      "Tech support: 98% match",
      "Culture fit: 92% match"
    ]
  },
  {
    number: "04",
    title: "Perfect Match Found!",
    description: "We present you with your ideal agent match and all the benefits that come with it.",
    details: [
      "Quality leads included",
      "Transaction coordinator",
      "AI-powered social media"
    ]
  }
];

export const HorizontalScrollSteps = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const { top, height } = container.getBoundingClientRect();
      const scrollProgress = Math.max(0, Math.min(1, -top / (height - window.innerHeight)));
      
      const newStep = Math.min(
        steps.length - 1,
        Math.floor(scrollProgress * steps.length)
      );
      
      setActiveStep(newStep);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative" style={{ height: `${steps.length * 100}vh` }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="container mx-auto px-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
                activeStep === index
                  ? "opacity-100 translate-x-0"
                  : activeStep > index
                  ? "opacity-0 -translate-x-full"
                  : "opacity-0 translate-x-full"
              }`}
            >
              <div 
                className="w-full backdrop-blur-sm border border-border rounded-3xl p-12 md:p-16 shadow-xl bg-card"
              >
                <div className="max-w-3xl mx-auto">
                  <div className="text-primary/40 text-8xl md:text-9xl font-bold mb-6">
                    {step.number}
                  </div>
                  
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                    {step.title}
                  </h2>
                  
                  <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                    {step.description}
                  </p>
                  
                  <div className="space-y-4">
                    {step.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                        <span className="text-lg text-foreground">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="hidden fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                window.scrollTo({
                  top: containerRef.current!.offsetTop + (index * window.innerHeight),
                  behavior: "smooth"
                });
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                activeStep === index
                  ? "bg-primary scale-125"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
