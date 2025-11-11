import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Target, TrendingUp, Shield, CheckCircle2, Users, Award, Briefcase, Phone, Mail, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatedAgentScroll } from "@/components/AnimatedAgentScroll";
import { ScrollParallaxFeatures } from "@/components/ScrollParallaxFeatures";
import owlDoorLogo from "@/assets/owldoor-icon.svg";
import { Header } from "@/components/Header";

export default function ForBrokerages() {
  const navigate = useNavigate();
  const [showSMS, setShowSMS] = useState(false);
  const [overlayProgress, setOverlayProgress] = useState(0);
  const findTeamRef = useRef<HTMLElement>(null);

  const agentInterests = [
    { initials: "AN", name: "Sombody 1", brokerage: "Sombody 1", location: "Seattle", status: "New!", match: 96, gci: "$275k" },
    { initials: "JW", name: "Jessica Williams", brokerage: "RE/MAX", location: "Phoenix", status: "Hot!", match: 96, gci: "$320k" },
    { initials: "RD", name: "Robert Davis", brokerage: "Keller Williams", location: "Dallas", status: "Warm", match: 89, gci: "$280k" },
    { initials: "LA", name: "Lisa Anderson", brokerage: "Coldwell Banker", location: "Austin", status: "Hot!", match: 97, gci: "$310k" },
    { initials: "MT", name: "Mike Turner", brokerage: "Compass", location: "Portland", status: "New!", match: 92, gci: "$265k" },
    { initials: "SK", name: "Sarah Kim", brokerage: "eXp Realty", location: "Denver", status: "Warm", match: 88, gci: "$295k" },
  ];

  // Duplicate array for seamless loop
  const duplicatedAgents = [...agentInterests, ...agentInterests, ...agentInterests];

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!findTeamRef.current) return;

      const rect = findTeamRef.current.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const windowHeight = window.innerHeight;
      
      // Start animation when section enters viewport
      const startTrigger = windowHeight - 200;
      const extendedScrollDistance = (sectionHeight + 1000) / 2.5; // 2.5x faster
      
      if (sectionTop < startTrigger) {
        const scrolledPastStart = startTrigger - sectionTop;
        const progress = Math.min(scrolledPastStart / extendedScrollDistance, 1);
        setOverlayProgress(progress);
      } else {
        setOverlayProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load Typeform embed script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//embed.typeform.com/next/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const openTypeform = () => {
    const typeformButton = document.querySelector('[data-tf-live]') as HTMLElement;
    if (typeformButton) {
      typeformButton.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 px-6">
        <div className="absolute top-0 left-0 right-0 bottom-0 dotted-pattern-fade-down pointer-events-none" />
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Recruit Smarter.{" "}
              <span className="text-primary">Match Better.</span>{" "}
              Grow Faster.
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Build high-performing teams with intelligent agent matching and data-driven recruiting strategies.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" onClick={openTypeform} className="text-lg px-8">
                Apply Now
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Check My Market →
              </Button>
            </div>
            {/* Hidden Typeform trigger */}
            <div data-tf-live="01K8YCEQWEDPCSHB0M1X1WJVYQ" style={{ display: 'none' }}></div>
          </motion.div>

          {/* Animated Agent Scroll */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16"
          >
            <AnimatedAgentScroll />
          </motion.div>
        </div>
      </section>

      {/* Parallax Features Section */}
      <ScrollParallaxFeatures mode="brokerage" />

      {/* Find the Team Section */}
      <section ref={findTeamRef} className="relative py-32 px-6 overflow-hidden" style={{ marginTop: '200px' }}>
        {/* Sliding Dark Overlay */}
        <motion.div
          className="absolute inset-0 z-0 bg-primary/90 dark:bg-primary/80"
          style={{
            clipPath: `inset(0 ${100 - (overlayProgress * 100)}% 0 0)`,
            transition: 'clip-path 0.1s linear'
          }}
        />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
            style={{
              color: overlayProgress > 0.1 ? 'white' : undefined,
              transition: 'color 0.3s ease'
            }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Find the Team That's Built for You.
            </h2>
            <h3 className="text-2xl md:text-3xl font-semibold mb-6" style={{
              color: overlayProgress > 0.1 ? 'rgba(255, 255, 255, 0.8)' : undefined,
              transition: 'color 0.3s ease'
            }}>
              You've Proven Yourself — Now Make Sure Your Brokerage Keeps Up.
            </h3>
            <div className="text-lg space-y-4 max-w-3xl mx-auto text-left" style={{
              color: overlayProgress > 0.1 ? 'rgba(255, 255, 255, 0.9)' : undefined,
              transition: 'color 0.3s ease'
            }}>
              <p>
                Your skills, results, and experience have grown every day, month, and year you've been in real estate. The question is: has your company grown with you? Are they providing the support, opportunities, and rewards you truly deserve?
              </p>
              <p>
                The truth is, most agents have better opportunities waiting for them — they just don't know it yet.
              </p>
              <p>
                That's where we come in. We've vetted, analyzed, and compared brokerages and teams nationwide, understanding exactly what each one offers. In the past, our system relied on complex algorithms — but now, with the power of AI -- our matching platform is so precise that you might never need to use it again.
              </p>
              <p>
                Discover what other teams are ready to offer you. There's no cost — except for the income, growth, and freedom you might be leaving on the table by staying where you are.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Cards with Dotted Pattern */}
      <section className="py-20 bg-muted/30 dotted-pattern">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <Card className="p-12 hover-lift animate-fade-in-up">
              <Sparkles className="h-12 w-12 text-primary mb-6" />
              <h3 className="text-3xl font-bold mb-4">For Agents</h3>
              <p className="text-muted-foreground mb-6">
                Find brokerages that match your goals, values, and growth trajectory.
              </p>
              <Button size="lg" className="w-full" onClick={() => navigate("/for-agents")}>
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
              <Button size="lg" variant="outline" className="w-full" onClick={() => navigate("/for-brokerages")}>
                Find Top Talent <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Agent Interest on AutoPilot Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Title and Agent Interest Feed */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
                  Agent Interest on AutoPilot
                </h2>
              </motion.div>

              {/* Scrolling Agent Cards */}
              <div className="relative h-[600px] overflow-hidden rounded-lg">
                <motion.div
                  animate={{
                    y: [0, -100 * agentInterests.length],
                  }}
                  transition={{
                    y: {
                      repeat: Infinity,
                      duration: 20,
                      ease: "linear",
                    },
                  }}
                  className="space-y-4"
                >
                  {duplicatedAgents.map((agent, idx) => (
                    <Card key={idx} className="p-4 bg-card/80 backdrop-blur">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                          {agent.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {agent.brokerage}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {agent.location}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={agent.status === "New!" ? "default" : agent.status === "Hot!" ? "destructive" : "outline"} className="text-xs">
                              {agent.status}
                            </Badge>
                            <span className="text-sm font-semibold text-primary">{agent.match}% Match</span>
                          </div>
                          <p className="text-xs text-muted-foreground">$ GCI {agent.gci}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-8 px-3">
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                          <Button size="sm" className="h-8 px-3">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </motion.div>
              </div>

              <Button size="lg" className="mt-8 w-full" onClick={openTypeform}>
                Apply Now →
              </Button>
            </div>

            {/* Right: Phone Mockup */}
            <div className="flex flex-col justify-center items-center gap-6">
              <Button size="lg" className="w-full max-w-md" onClick={openTypeform}>
                Apply Now →
              </Button>
              
              <motion.div
                className="relative"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                onHoverStart={() => setShowSMS(true)}
                onHoverEnd={() => setShowSMS(false)}
                animate={showSMS ? {
                  x: [0, -2, 2, -2, 2, 0],
                  transition: {
                    x: {
                      repeat: Infinity,
                      duration: 0.5,
                      ease: "easeInOut",
                    },
                  }
                } : { x: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Phone Frame */}
                <div className="relative w-80 bg-background rounded-[3rem] shadow-2xl" style={{ border: '8px solid hsl(0deg 0% 100%)' }}>
                  {/* Phone Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 rounded-b-3xl z-10" style={{ backgroundColor: 'hsl(0deg 0% 100%)' }} />
                  
                  {/* Phone Content */}
                  <div className="pt-8 pb-6 px-0 bg-gradient-to-b from-background/30 to-background min-h-[650px] overflow-hidden rounded-[2rem]">
                    {/* Profile Card */}
                    <Card className="p-6 mx-6 text-center">
                      <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl font-bold">SP</span>
                      </div>
                      <h3 className="text-xl font-bold mb-1">Sarah Parker</h3>
                      <p className="text-sm text-muted-foreground mb-6">Real Estate Agent</p>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div>
                          <p className="text-2xl font-bold">$2.4M</p>
                          <p className="text-xs text-muted-foreground">ANNUAL VOLUME</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">24</p>
                          <p className="text-xs text-muted-foreground">SALES/YEAR</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">5</p>
                          <p className="text-xs text-muted-foreground">YEARS EXP</p>
                        </div>
                      </div>

                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-semibold">🎯 My Wants</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                            <TrendingUp className="h-3 w-3 text-primary" />
                            <span>Leads Provided</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                            <Star className="h-3 w-3 text-primary" />
                            <span>Zillow Flex</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                            <Shield className="h-3 w-3 text-primary" />
                            <span>CRM & Tech</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                            <Users className="h-3 w-3 text-primary" />
                            <span>TC's and TA's</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                            <Target className="h-3 w-3 text-primary" />
                            <span>80% Self Gen</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                            <Award className="h-3 w-3 text-primary" />
                            <span>Signs & Cards</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* SMS Notification Popup */}
                <AnimatePresence>
                  {showSMS && (
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 w-72 bg-card border rounded-2xl shadow-2xl p-4 z-20"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary-foreground">🦉</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold mb-1">OwlDoor</p>
                          <p className="text-xs text-muted-foreground">
                            Sarah, You're on a Roll! Top 1% Team - Everest Elite just sent you an invite
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligent Matching Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Intelligent Agent Matching
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our advanced matching system ensures every connection is meaningful and mutually beneficial.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Star,
                title: "Quality",
                heading: "Quality Over Quantity",
                description: "We exclusively match you with top 20% producers who are already closing deals.",
                features: ["Top 20% producers only", "Verified production records", "Proven track record"]
              },
              {
                icon: Target,
                title: "Culture",
                heading: "Cultural Fit Analysis",
                description: "AI evaluates team culture, values, and work style to ensure long-term success.",
                features: ["Team culture evaluation", "Values alignment check", "Work style compatibility"]
              },
              {
                icon: TrendingUp,
                title: "Leads",
                heading: "Lead Generation",
                description: "Matched agents get access to high-quality leads that convert at higher rates.",
                features: ["High-quality lead access", "Better conversion rates", "Exclusive opportunities"]
              },
              {
                icon: Shield,
                title: "Trust",
                heading: "Security & Trust",
                description: "All matches are verified and backed by our comprehensive screening process.",
                features: ["Verified credentials", "Comprehensive screening", "Background verification"]
              }
            ].map((feature, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card className="p-8 h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <div className="w-14 h-14 rounded-full bg-background flex items-center justify-center mb-6 shadow-lg">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                  <h4 className="text-lg font-semibold mb-3 text-muted-foreground">{feature.heading}</h4>
                  <p className="text-muted-foreground mb-6">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.features.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-muted/30 dotted-pattern">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            className="grid md:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {[
              { number: "500+", label: "Teams Matched", icon: Users },
              { number: "95%", label: "Success Rate", icon: Award },
              { number: "$2.4B+", label: "Combined Volume", icon: TrendingUp },
              { number: "50+", label: "Markets Served", icon: Briefcase }
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                <stat.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <div className="text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Build Your Dream Team?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of successful teams who have transformed their recruiting with OwlDoor.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" onClick={openTypeform} className="text-lg px-8">
                Get Started Today
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Schedule a Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
