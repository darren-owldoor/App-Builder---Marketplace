import { useEffect, useRef, useState } from "react";
import { Users, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import forSaleSign from "@/assets/for-sale-sign-new.png";

const GreenerGrassSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [grassHeight, setGrassHeight] = useState(0);
  const [signPosition, setSignPosition] = useState(100);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const scrollProgress = Math.max(
        0,
        Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height))
      );

      // Update active section based on scroll progress - adjusted to keep first section longer
      if (scrollProgress < 0.25) {
        setActiveSection(0); // Keep title longer
      } else {
        const section = Math.floor((scrollProgress - 0.25) / 0.15) + 1;
        setActiveSection(Math.min(5, section));
      }

      // Gradual grass growth from 10px to 450px - 3x slower
      const minHeight = 10;
      const maxHeight = 450;
      const grassProgress = Math.min(1, scrollProgress * 0.43); // Grow 3x slower
      setGrassHeight(minHeight + (grassProgress * (maxHeight - minHeight)));
      
      // Sign slides up from below when at final section (last 10% of scroll)
      if (scrollProgress > 0.9) {
        const signProgress = (scrollProgress - 0.9) / 0.1;
        setSignPosition(signProgress * 100); // 0 = below viewport, 100 = visible
      } else {
        setSignPosition(0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sections = [
    {
      title: "See How Much Greener The Grass Is On The Other Side",
      content:
        "Whether you're an agent seeking growth, leads, technology, mentorship, a top team, or better opportunities—or a team looking to hire top talent—OwlDoor connects you with the right people at the right time.",
    },
    {
      stat: "16%",
      content:
        "of agents switched brokerages last year—not because of poor skill, but because their needs weren't met, whether in leads, technology, culture, or reputation. OwlDoor adds AI to the equation to ensure every match is lasting, effective, and filled with opportunity.",
    },
    {
      content:
        "You're looking for more than just a track record or a name in your network. You want meaningful business relationships built on shared values, aligned goals, and complementary strengths. You value trust, honesty, and collaboration, and you know success comes from working with people who bring out the best in you—and vice versa.",
    },
    {
      title: "Effortless Connections, Powered by AI",
      content:
        "At OwlDoor, we make these connections effortless. Our AI-powered platform analyzes thousands of data points and leverages insights from top recruiters across the U.S. to determine what truly makes an Agent/Team match successful. Beyond experience, performance, and cultural fit, we dig into what drives long-term, productive relationships.",
    },
    {
      cards: [
        {
          icon: Users,
          title: "For Agents",
          content:
            "Access insights on better opportunities and discover how much more a team or brokerage can offer. Find teams that align with your ambitions, style, and career trajectory.",
        },
        {
          icon: Building2,
          title: "For Teams",
          content:
            "Discover professionals who not only have the skills you need but also share your vision and commitment to excellence.",
        },
      ],
    },
    {
      finalMessage: [
        "No more blind networking.",
        "No more guesswork.",
        "No more empty promises.",
        "Just intelligent matching, thoughtful introductions, and the ability to focus on what truly matters—building relationships that drive real growth.",
      ],
      cta: true,
    },
  ];

  return (
    <section ref={containerRef} className="relative min-h-[400vh] py-20 pb-0">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            {sections.map((section, index) => (
              <div
                key={index}
                className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
                  activeSection === index
                    ? "opacity-100 translate-y-0"
                    : activeSection < index
                    ? "opacity-0 translate-y-10"
                    : "opacity-0 -translate-y-10"
                }`}
              >
                <div className="text-center space-y-8">
                  {section.title && (
                    <h2 className="text-6xl md:text-7xl font-bold gradient-text leading-tight">
                      {section.title}
                    </h2>
                  )}
                  {section.stat && (
                    <div>
                      <p className="text-8xl font-bold text-primary mb-4">{section.stat}</p>
                      <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                        {section.content}
                      </p>
                    </div>
                  )}
                  {section.content && !section.stat && (
                    <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  )}
                  {section.cards && (
                    <div className="grid md:grid-cols-2 gap-8 mt-12">
                      {section.cards.map((card, cardIndex) => (
                        <div
                          key={cardIndex}
                          className="bg-card/50 backdrop-blur-sm p-8 rounded-lg border border-border"
                        >
                          <card.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                          <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
                          <p className="text-muted-foreground">{card.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.finalMessage && (
                    <div className="space-y-8">
                      <div className="space-y-4">
                        {section.finalMessage.map((message, msgIndex) => (
                          <p
                            key={msgIndex}
                            className="text-2xl md:text-3xl font-semibold"
                            style={{
                              animationDelay: `${msgIndex * 0.1}s`,
                            }}
                          >
                            {message}
                          </p>
                        ))}
                      </div>
                      {section.cta && (
                        <div className="pt-8 pb-[150px]">
                          <h2 className="text-5xl md:text-6xl font-bold mb-6">
                            Ready to grow?
                          </h2>
                          <p className="text-xl text-muted-foreground mb-8">
                            Join thousands finding their perfect match with OwlDoor.
                          </p>
                          <Button size="lg" className="text-lg px-12 hover-lift">
                            Get Started <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grass - Growing on Scroll */}
        <div 
          className="absolute left-0 right-0 bottom-0 pointer-events-none transition-all duration-100 ease-linear"
          style={{ height: `${grassHeight}px`, marginTop: '250px' }}
        >
          {/* Back layer - darker grass */}
          <div className="absolute bottom-0 w-full h-full">
            {Array.from({ length: 40 }).map((_, i) => {
              const height = 40 + Math.random() * 60;
              const left = (i * 100) / 40;
              const skew = -5 + Math.random() * 10;
              return (
                <div
                  key={`back-${i}`}
                  className="absolute bottom-0"
                  style={{
                    left: `${left}%`,
                    width: '16px',
                    height: `${height}%`,
                    background: 'hsl(110 28% 45%)',
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                    opacity: 0.8,
                  } as React.CSSProperties}
                />
              );
            })}
          </div>

          {/* Middle layer - medium grass */}
          <div className="absolute bottom-0 w-full h-full">
            {Array.from({ length: 50 }).map((_, i) => {
              const height = 50 + Math.random() * 50;
              const left = (i * 100) / 50;
              const skew = -8 + Math.random() * 16;
              return (
                <div
                  key={`mid-${i}`}
                  className="absolute bottom-0"
                  style={{
                    left: `${left}%`,
                    width: '12px',
                    height: `${height}%`,
                    background: 'hsl(110 28% 55%)',
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                    opacity: 0.9,
                  } as React.CSSProperties}
                />
              );
            })}
          </div>

          {/* Front layer - bright grass */}
          <div className="absolute bottom-0 w-full h-full">
            {Array.from({ length: 60 }).map((_, i) => {
              const height = 60 + Math.random() * 40;
              const left = (i * 100) / 60;
              const skew = -10 + Math.random() * 20;
              const isLight = Math.random() > 0.5;
              return (
                <div
                  key={`front-${i}`}
                  className="absolute bottom-0"
                  style={{
                    left: `${left}%`,
                    width: '10px',
                    height: `${height}%`,
                    background: isLight ? 'hsl(110 30% 70%)' : 'hsl(110 28% 60%)',
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                  } as React.CSSProperties}
                />
              );
            })}
          </div>

          {/* For Sale Sign - Slides up from bottom right */}
          <div
            className="absolute right-8 md:right-16 bottom-0 transition-all duration-1000 ease-out z-10"
            style={{
              transform: `translateY(${100 - signPosition}%)`,
              opacity: signPosition > 0 ? 1 : 0,
            }}
          >
            <img
              src={forSaleSign}
              alt="For Sale"
              className="w-32 md:w-40 lg:w-48 h-auto drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default GreenerGrassSection;
