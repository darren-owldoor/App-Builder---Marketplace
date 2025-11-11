import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Target, TrendingUp, Shield, CheckCircle2, Users, Award, Briefcase, Phone, Mail, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatedAgentScroll } from "@/components/AnimatedAgentScroll";
import { ScrollParallaxFeatures } from "@/components/ScrollParallaxFeatures";
import { HomeSignUpForm } from "@/components/HomeSignUpForm";
import owlDoorLogo from "@/assets/owldoor-icon.svg";
import owlOfficeBackground from "@/assets/owl-office-background.jpg";
import agentDavid from "@/assets/agent-david.jpg";
import teamNetwork from "@/assets/team-network.png";
import { Header } from "@/components/Header";
const matchData = [{
  agent: {
    initials: "AN",
    name: "Anthony Nguyen",
    company: "Sotheby's",
    location: "Seattle",
    price: "$275k",
    sales: "23",
    rating: "9/10",
    benefits: ["High Splits", "Free Leads", "Coaching"]
  },
  brokerage: {
    initials: "SSG",
    name: "Seattle Success Group",
    company: "Sotheby's",
    location: "Seattle",
    agents: "29",
    sales: "1190",
    rating: "9/10",
    benefits: ["Referrals", "Top Team", "Tech Provided"]
  },
  matchRate: "86%"
}, {
  agent: {
    initials: "JD",
    name: "John Davis",
    company: "RE/MAX",
    location: "Dallas",
    price: "$180k",
    sales: "15",
    rating: "8/10",
    benefits: ["Marketing", "Training", "Support"]
  },
  brokerage: {
    initials: "PG",
    name: "Premier Group",
    company: "Keller Williams",
    location: "Dallas",
    agents: "35",
    sales: "1200",
    rating: "9/10",
    benefits: ["Leads", "Support", "Tech"]
  },
  matchRate: "88%"
}, {
  agent: {
    initials: "MR",
    name: "Maria Rodriguez",
    company: "eXp Realty",
    location: "Houston",
    price: "$250k",
    sales: "22",
    rating: "10/10",
    benefits: ["Tech Suite", "Mentorship", "Leads"]
  },
  brokerage: {
    initials: "TH",
    name: "The Heights",
    company: "Compass",
    location: "Houston",
    agents: "52",
    sales: "1800",
    rating: "9/10",
    benefits: ["Premium Leads", "Advanced CRM", "Support"]
  },
  matchRate: "95%"
}];
export default function Teams() {
  const navigate = useNavigate();
  const [showSMS, setShowSMS] = useState(false);
  const [overlayProgress, setOverlayProgress] = useState(0);
  const findTeamRef = useRef<HTMLElement>(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [cardBrightness, setCardBrightness] = useState(0.4);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const stepRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMatchIndex(prev => (prev + 1) % matchData.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      if (!howItWorksRef.current) return;
      const windowHeight = window.innerHeight;
      const scrollProgress = window.scrollY;
      let maxProgress = 0;
      stepRefs.forEach((ref, index) => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const elementTop = rect.top;
          const elementHeight = rect.height;

          // Check if element is in viewport
          if (elementTop < windowHeight * 0.7 && elementTop + elementHeight > 0) {
            const progress = Math.min(Math.max((windowHeight * 0.7 - elementTop) / (windowHeight * 0.5), 0), 1);
            const stepProgress = (index + progress) / stepRefs.length;
            maxProgress = Math.max(maxProgress, stepProgress);
          }
        }
      });

      // Map progress to brightness range: 0.4 to 1.0
      const brightness = 0.4 + maxProgress * 0.6;
      setCardBrightness(brightness);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const currentMatch = matchData[currentMatchIndex];
  const agentInterests = [{
    initials: "AN",
    name: "Sombody 1",
    brokerage: "Sombody 1",
    location: "Seattle",
    status: "New!",
    match: 96,
    gci: "$275k"
  }, {
    initials: "JW",
    name: "Jessica Williams",
    brokerage: "RE/MAX",
    location: "Phoenix",
    status: "Hot!",
    match: 96,
    gci: "$320k"
  }, {
    initials: "RD",
    name: "Robert Davis",
    brokerage: "Keller Williams",
    location: "Dallas",
    status: "Warm",
    match: 89,
    gci: "$280k"
  }, {
    initials: "LA",
    name: "Lisa Anderson",
    brokerage: "Coldwell Banker",
    location: "Austin",
    status: "Hot!",
    match: 97,
    gci: "$310k"
  }, {
    initials: "MT",
    name: "Mike Turner",
    brokerage: "Compass",
    location: "Portland",
    status: "New!",
    match: 92,
    gci: "$265k"
  }, {
    initials: "SK",
    name: "Sarah Kim",
    brokerage: "eXp Realty",
    location: "Denver",
    status: "Warm",
    match: 88,
    gci: "$295k"
  }];

  // Duplicate array for seamless loop
  const duplicatedAgents = [...agentInterests, ...agentInterests, ...agentInterests];
  const fadeInUp = {
    initial: {
      opacity: 0,
      y: 30
    },
    animate: {
      opacity: 1,
      y: 0
    },
    transition: {
      duration: 0.6
    }
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
      const windowHeight = window.innerHeight;

      // Start animation when section enters viewport
      const startTrigger = windowHeight - 200;
      const extendedScrollDistance = (rect.height + 1000) / 2.5; // Match ForAgents speed
      const holdDistance = 1000;
      if (sectionTop < startTrigger) {
        const scrolledPastStart = startTrigger - sectionTop;
        const progress = Math.min(scrolledPastStart / extendedScrollDistance, 1);
        setOverlayProgress(progress);
      } else {
        setOverlayProgress(0);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load Typeform embed script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "//embed.typeform.com/next/embed.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  const openTypeform = () => {
    const typeformButton = document.querySelector("[data-tf-live]") as HTMLElement;
    if (typeformButton) {
      typeformButton.click();
    }
  };
  return <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />

      {/* Hero Section */}
      <section className="pt-16 pb-4 px-4 sm:px-6 sm:pt-24 sm:pb-16 min-h-[50vh] sm:min-h-0">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left Column - Main Content */}
            <motion.div initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6
          }} className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-4 w-full tracking-tight">
                Recruit Top Local{" "}
                <span className="text-primary">Real Estate Pros</span>
              </h1>

              {/* Inline Join Form */}
              <div className="rounded-2xl p-6 sm:p-8 border-0 shadow-lg mb-6 sm:mb-8 bg-primary">
                <HomeSignUpForm />
              </div>
            </motion.div>

            {/* Right Column - Scrolling Agent Interest Cards */}
            <motion.div initial={{
            opacity: 0,
            x: 30
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            duration: 0.6,
            delay: 0.2
          }} className="space-y-6">
              <div>
                
                
                {/* Scrolling Agent Cards */}
                <div className="relative h-[500px] sm:h-[600px] overflow-hidden rounded-lg">
                  <motion.div animate={{
                  y: [0, -100 * agentInterests.length]
                }} transition={{
                  y: {
                    repeat: Infinity,
                    duration: 20,
                    ease: "linear"
                  }
                }} className="space-y-4">
                    {duplicatedAgents.map((agent, idx) => <Card key={idx} className="p-3 sm:p-4 bg-card/80 backdrop-blur">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm">
                            {agent.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                {agent.brokerage}
                              </Badge>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {agent.location}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge variant={agent.status === "New!" ? "default" : agent.status === "Hot!" ? "destructive" : "outline"} className="text-xs">
                                {agent.status}
                              </Badge>
                              <span className="text-sm font-semibold text-primary">{agent.match}% Match</span>
                            </div>
                            <p className="text-xs text-muted-foreground">$ GCI {agent.gci}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button size="sm" variant="outline" className="h-8 px-2 sm:px-3 text-xs">
                              <Phone className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Call</span>
                            </Button>
                            <Button size="sm" className="h-8 px-2 sm:px-3 text-xs">
                              <Mail className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Email</span>
                            </Button>
                          </div>
                        </div>
                      </Card>)}
                  </motion.div>
                </div>
                <p className="text-muted-foreground mt-6 text-center text-base sm:text-xl md:text-2xl font-normal">
                  We Help Build Top National Real Estate Teams
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* We Do The Recruiting Section */}
      <section className="py-20 px-6 bg-primary">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Card with Map */}
            <motion.div initial={{
            opacity: 0,
            x: -30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }}>
              <Card className="p-8 md:p-12 bg-background shadow-xl">
                <div className="mb-8">
                  <img src={teamNetwork} alt="Real Estate Team Network" className="w-full h-auto" />
                </div>
                
                <Button size="lg" className="w-full text-lg" onClick={openTypeform}>
                  Hiring Real Estate Pros?
                </Button>
              </Card>
            </motion.div>

            {/* Right Side - Main Headline */}
            <motion.div initial={{
            opacity: 0,
            x: 30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }} className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-background text-center lg:text-7xl">We Recruit Top Agents For The Top 10% of  National Teams{" "}
                
              </h1>
              <p className="text-lg md:text-xl text-background/90 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed text-center">See if we have availability in your market</p>
              
            </motion.div>
          </div>
        </div>
      </section>

      {/* Parallax Features Section */}
      

      {/* How OwlDoor Works */}
      <section className="py-20 px-6" ref={howItWorksRef}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Match With The Right Agents</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Our AI-powered platform analyzes compatibility across multiple dimensions </p>
          </div>

          {/* Animated Cards Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 relative">
            {/* Agent Card */}
            <div className="relative h-[200px]">
              <AnimatePresence mode="wait">
                <motion.div key={`agent-${currentMatchIndex}`} initial={{
                opacity: 0,
                x: -20
              }} animate={{
                opacity: 1,
                x: 0
              }} exit={{
                opacity: 0,
                x: 20
              }} transition={{
                duration: 0.5
              }} className="absolute inset-0">
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm">
                          {currentMatch.agent.initials}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold">{currentMatch.agent.name}</h3>
                          <p className="text-sm text-muted-foreground">{currentMatch.agent.company}</p>
                          <p className="text-sm text-muted-foreground">📍 {currentMatch.agent.location} · {currentMatch.agent.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-2xl font-bold">{currentMatch.agent.sales}</p>
                          <p className="text-muted-foreground">Yearly Sales</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{currentMatch.agent.rating}</p>
                          <div className="flex gap-1 text-xs mt-2">
                            {currentMatch.agent.benefits.map((benefit, idx) => <span key={idx} className="text-muted-foreground">• {benefit}</span>)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Match Rate Circle */}
            <div className="flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div key={`match-${currentMatchIndex}`} initial={{
                scale: 0.8,
                opacity: 0
              }} animate={{
                scale: 1,
                opacity: 1
              }} exit={{
                scale: 0.8,
                opacity: 0
              }} transition={{
                duration: 0.5
              }} className="w-48 h-48 rounded-full bg-primary flex items-center justify-center">
                  <div className="text-center text-primary-foreground">
                    <p className="text-6xl font-bold">{currentMatch.matchRate}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Brokerage Card */}
            <div className="relative h-[200px]">
              <AnimatePresence mode="wait">
                <motion.div key={`brokerage-${currentMatchIndex}`} initial={{
                opacity: 0,
                x: 20
              }} animate={{
                opacity: 1,
                x: 0
              }} exit={{
                opacity: 0,
                x: -20
              }} transition={{
                duration: 0.5
              }} className="absolute inset-0">
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm">
                          {currentMatch.brokerage.initials}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold">{currentMatch.brokerage.name}</h3>
                          <p className="text-sm text-muted-foreground">{currentMatch.brokerage.company}</p>
                          <p className="text-sm text-muted-foreground">📍 {currentMatch.brokerage.location} · 👥 {currentMatch.brokerage.agents}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-2xl font-bold">{currentMatch.brokerage.sales}</p>
                          <p className="text-muted-foreground">Yearly Sales</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{currentMatch.brokerage.rating}</p>
                          <div className="flex gap-1 text-xs mt-2">
                            {currentMatch.brokerage.benefits.map((benefit, idx) => <span key={idx} className="text-muted-foreground">{benefit} •</span>)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          
        </div>
      </section>

      {/* Find the Team Section */}
      

      {/* CTA Cards with Dotted Pattern */}
      <section className="py-20 bg-muted/30 dotted-pattern">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <Card className="p-16 hover-lift animate-fade-in-up">
              <Sparkles className="h-16 w-16 text-primary mb-8" />
              <h3 className="text-4xl font-bold mb-6">For Agents</h3>
              <p className="text-lg text-muted-foreground mb-8">
                Find brokerages that match your goals, values, and growth trajectory.
              </p>
              <Button size="lg" className="w-full text-lg h-12" onClick={() => navigate("/for-agents")}>
                Explore Opportunities <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Card>

            <Card className="p-16 hover-lift animate-fade-in-up" style={{
            animationDelay: "0.1s"
          }}>
              <Target className="h-16 w-16 text-primary mb-8" />
              <h3 className="text-4xl font-bold mb-6">For Brokerages</h3>
              <p className="text-lg text-muted-foreground mb-8">
                Recruit top-performing agents who fit your culture and vision.
              </p>
              <Button size="lg" variant="outline" className="w-full text-lg h-12" onClick={() => navigate("/teams")}>
                Find Top Talent <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Agent Interest on AutoPilot Section */}
      

      {/* Intelligent Matching Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div className="text-center mb-16" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Intelligent Agent Matching</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our advanced matching system ensures every connection is meaningful and mutually beneficial.
            </p>
          </motion.div>

          <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" variants={staggerChildren} initial="initial" whileInView="animate" viewport={{
          once: true
        }}>
            {[{
            icon: Star,
            title: "Quality",
            heading: "Quality Over Quantity",
            description: "We exclusively match you with top 20% producers who are already closing deals.",
            features: ["Top 20% producers only", "Verified production records", "Proven track record"]
          }, {
            icon: Target,
            title: "Culture",
            heading: "Cultural Fit Analysis",
            description: "AI evaluates team culture, values, and work style to ensure long-term success.",
            features: ["Team culture evaluation", "Values alignment check", "Work style compatibility"]
          }, {
            icon: TrendingUp,
            title: "Leads",
            heading: "Lead Generation",
            description: "Matched agents get access to high-quality leads that convert at higher rates.",
            features: ["High-quality lead access", "Better conversion rates", "Exclusive opportunities"]
          }, {
            icon: Shield,
            title: "Trust",
            heading: "Security & Trust",
            description: "All matches are verified and backed by our comprehensive screening process.",
            features: ["Verified credentials", "Comprehensive screening", "Background verification"]
          }].map((feature, idx) => <motion.div key={idx} variants={fadeInUp}>
                <Card className="p-8 h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-background flex items-center justify-center shadow-lg flex-shrink-0">
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold">{feature.title}</h3>
                  </div>
                  <h4 className="text-lg font-semibold mb-3 text-muted-foreground">{feature.heading}</h4>
                  <p className="text-muted-foreground mb-6">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.features.map((item, i) => <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>)}
                  </ul>
                </Card>
              </motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-muted/30 dotted-pattern">
        <div className="container mx-auto max-w-7xl">
          <motion.div className="grid md:grid-cols-4 gap-8" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            {[{
            number: "500+",
            label: "Teams Matched",
            icon: Users
          }, {
            number: "95%",
            label: "Success Rate",
            icon: Award
          }, {
            number: "$2.4B+",
            label: "Combined Volume",
            icon: TrendingUp
          }, {
            number: "50+",
            label: "Markets Served",
            icon: Briefcase
          }].map((stat, idx) => <motion.div key={idx} className="text-center" initial={{
            opacity: 0,
            scale: 0.9
          }} whileInView={{
            opacity: 1,
            scale: 1
          }} viewport={{
            once: true
          }} transition={{
            delay: idx * 0.1,
            duration: 0.5
          }}>
                <stat.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <div className="text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>)}
          </motion.div>
        </div>
      </section>

      {/* Video Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="container mx-auto max-w-5xl">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <iframe src="https://player.vimeo.com/video/1132706705?autoplay=1&loop=1&muted=1&background=1&controls=0" className="absolute inset-0 w-full h-full" style={{
            border: 'none',
            pointerEvents: 'none'
          }} allow="autoplay; fullscreen" title="Background Video" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div className="text-center" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Build Your Dream Team?</h2>
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
    </div>;
}