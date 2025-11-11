import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Building, TrendingUp, Users, Target, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { LiveMatchingDemo } from "@/components/LiveMatchingDemo";
import { LiveRecruitingDemo } from "@/components/LiveRecruitingDemo";
import { AnimatedMatchingCards } from "@/components/AnimatedMatchingCards";
import { HorizontalScrollSteps } from "@/components/HorizontalScrollSteps";
import GreenerGrassSection from "@/components/GreenerGrassSection";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ScrollFlipCard } from "@/components/ScrollFlipCard";
import { Header } from "@/components/Header";
import { AnimatedScrollLine } from "@/components/AnimatedScrollLine";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import leftOwlDoor from "@/assets/left-owldoor.png";
import rightOwlDoor from "@/assets/right-owldoor.png";
const Home = () => {
  const videoRef = useRef<HTMLElement>(null);
  const [overlayProgress, setOverlayProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!videoRef.current) return;

      const rect = videoRef.current.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const windowHeight = window.innerHeight;
      
      // Start animation when section enters viewport
      const startTrigger = windowHeight + 100;
      const extendedScrollDistance = (sectionHeight + 1500) / 1.5;
      
      if (sectionTop < startTrigger) {
        const scrolledPastStart = startTrigger - sectionTop;
        const progress = Math.min(scrolledPastStart / extendedScrollDistance, 1);
        setOverlayProgress(progress);
      } else {
        setOverlayProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return <ThemeProvider>
      <div className="min-h-screen relative">
        <Header />

        {/* Hero Section with Fading Dots - Single continuous pattern */}
        <div className="relative">
          {/* Single dotted pattern that fades from top to bottom */}
          <div className="absolute top-0 left-0 right-0 bottom-0 dotted-pattern-fade-down pointer-events-none" />

          {/* Hero Section */}
          <section className="relative pt-40 pb-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background -z-10" />
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-5xl mx-auto text-center animate-fade-in-up">
                <h1 className="mb-6 leading-none text-foreground md:text-8xl font-bold sm:text-5xl text-6xl">
                  When the right people connect, <span className="gradient-text">everyone wins</span>
                </h1>
                <p className="mb-12 max-w-3xl mx-auto md:text-2xl text-muted-foreground font-bold text-xl">
                  Our mission is to revolutionize how real estate professionals connect
                  by combining AI-driven insights with human expertise.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="px-8 hover-lift bg-foreground text-background hover:bg-foreground/90 text-lg">
                    For Agents <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-8 border-muted-foreground/20 bg-neutral-950 hover:bg-neutral-800 text-slate-50">
                    For Brokerages
                  </Button>
                </div>
              </div>
            </div>
          </section>

        {/* Animated Matching Cards */}
        <section className="py-8 pb-12 relative">
          <AnimatedMatchingCards />
        </section>
        </div>

        {/* How OwlDoor Works */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 animate-fade-in-up">
              <h2 className="md:text-5xl font-bold mb-4 text-5xl">How OwlDoor Works</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our AI-powered platform analyzes compatibility across multiple dimensions to create perfect matches
              </p>
            </div>
          </div>
          <LiveRecruitingDemo />
        </section>

        {/* Before/After Flip Card */}
        {/* <ScrollFlipCard /> */}

        {/* Stats Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[{
              icon: Users,
              stat: "10K+",
              label: "Successful Matches"
            }, {
              icon: TrendingUp,
              stat: "95%",
              label: "Match Accuracy"
            }, {
              icon: Building,
              stat: "50%",
              label: "Less Turnover"
            }].map((item, index) => <Card key={index} className="p-8 text-center hover-lift animate-fade-in-up" style={{
              animationDelay: `${index * 0.1}s`
            }}>
                  <item.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <div className="text-4xl font-bold mb-2">{item.stat}</div>
                  <div className="text-muted-foreground">{item.label}</div>
                </Card>)}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 bg-muted/30 dotted-pattern">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <Card className="p-12 hover-lift animate-fade-in-up">
                <Sparkles className="h-12 w-12 text-primary mb-6" />
                <h3 className="text-3xl font-bold mb-4">For Agents</h3>
                <p className="text-muted-foreground mb-6">
                  Find brokerages that match your goals, values, and growth trajectory.
                </p>
                <Button size="lg" className="w-full">
                  Explore Opportunities <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Card>

              <Card className="p-12 hover-lift animate-fade-in-up" style={{
              animationDelay: "0.1s"
            }}>
                <Target className="h-12 w-12 text-primary mb-6" />
                <h3 className="text-3xl font-bold mb-4">For Brokerages</h3>
                <p className="text-muted-foreground mb-6">
                  Recruit top-performing agents who fit your culture and vision.
                </p>
                <Button size="lg" variant="outline" className="w-full">
                  Find Top Talent <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works - Step by Step */}
        <section className="py-20">
          <div className="container mx-auto px-4 mb-12">
            <div className="text-center animate-fade-in-up">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Matching Process</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Four steps to finding your perfect match
              </p>
            </div>
          </div>
          <HorizontalScrollSteps />
        </section>

        {/* Video Section with Scroll Effect */}
        <section ref={videoRef} className="relative py-32 overflow-hidden" style={{ marginTop: '120px' }}>
          {/* Left door - slides right */}
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{
              transform: `translateX(${overlayProgress * 50}%)`,
              transition: 'transform 0.1s linear'
            }}
          >
            <img 
              src={leftOwlDoor} 
              alt="" 
              className="w-1/2 h-full object-cover"
              style={{ marginLeft: 'auto' }}
            />
          </motion.div>
          
          {/* Right door - slides left */}
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{
              transform: `translateX(-${overlayProgress * 50}%)`,
              transition: 'transform 0.1s linear'
            }}
          >
            <img 
              src={rightOwlDoor} 
              alt="" 
              className="w-1/2 h-full object-cover"
              style={{ marginRight: 'auto' }}
            />
          </motion.div>
          
          <div className="container mx-auto px-4 relative z-0">
            <div className="relative w-full overflow-hidden rounded-lg" style={{
              padding: '56.25% 0 0 0'
            }}>
              <iframe 
                src="https://player.vimeo.com/video/1130933495?autoplay=1&loop=1&muted=1&background=1" 
                frameBorder="0" 
                allow="autoplay; fullscreen; picture-in-picture" 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }} 
                title="OwlDoor Demo Video"
              ></iframe>
            </div>
          </div>
        </section>

        {/* Greener Grass Section */}
        <GreenerGrassSection />

        {/* Footer */}
        <Footer />
      </div>
    </ThemeProvider>;
};
export default Home;