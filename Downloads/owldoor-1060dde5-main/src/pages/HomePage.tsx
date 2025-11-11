import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Users, Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import agentDavid from "@/assets/agent-david.jpg";
import forSaleSign from "@/assets/for-sale-sign.png";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";

const matchData = [
  {
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
  },
  {
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
  },
  {
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
  }
];

const HomePage = () => {
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMatchIndex((prev) => (prev + 1) % matchData.length);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const currentMatch = matchData[currentMatchIndex];
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
          >
            When the right people connect,{" "}
            <span className="text-primary">everyone wins</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto"
          >
            OwlDoor is more than recruiting. Our mission is to revolutionize how real estate professionals connect by combining AI-driven insights with human expertise.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Link to="/for-agents">
              <Button size="lg" className="rounded-full">
                For Agents <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/for-brokerages">
              <Button size="lg" variant="secondary" className="rounded-full">
                For Brokerages
              </Button>
            </Link>
          </motion.div>

          {/* Sample Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-20 relative">
            {/* Agent Card */}
            <div className="relative h-[200px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`agent-${currentMatchIndex}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
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
                            {currentMatch.agent.benefits.map((benefit, idx) => (
                              <span key={idx} className="text-muted-foreground">• {benefit}</span>
                            ))}
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
                <motion.div
                  key={`match-${currentMatchIndex}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-48 h-48 rounded-full bg-primary flex items-center justify-center"
                >
                  <div className="text-center text-primary-foreground">
                    <p className="text-6xl font-bold">{currentMatch.matchRate}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Brokerage Card */}
            <div className="relative h-[200px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`brokerage-${currentMatchIndex}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
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
                            {currentMatch.brokerage.benefits.map((benefit, idx) => (
                              <span key={idx} className="text-muted-foreground">{benefit} •</span>
                            ))}
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

      {/* How OwlDoor Works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How OwlDoor Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our AI-powered platform analyzes compatibility across multiple dimensions to create perfect matches
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Process Steps */}
            <div className="space-y-12">
              <div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">A Few Questions. A Lot of Value</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We just need a minute or two to ask a couple questions that help us match any Agent a better brokerage using a variety of breakthrough technologies.
                </p>
              </div>

              <div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">AI + Human Matching Engine</h3>
                <p className="text-muted-foreground leading-relaxed">
                  OwlDoor's matching engine uses big-data scoring to align agents with brokerages that truly fit — then our recruiting experts fine-tune each match by hand.
                </p>
              </div>

              <div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Ranked Matches & Compatibility Insights</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Each match is scored across compatibility pillars: leads, systems, culture, and growth potential — giving you clear, data-backed insight before you connect.
                </p>
              </div>

              <div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">Warm Introduction, Real Connection</h3>
                <p className="text-muted-foreground leading-relaxed">
                  OwlDoor facilitates a warm, qualified intro between you and the agent — with key highlights that make the first conversation meaningful.
                </p>
              </div>
            </div>

            {/* Right Column - Agent Profile Card */}
            <div className="lg:sticky lg:top-32">
              <Card className="overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5"></div>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-6 -mt-16">
                    <img 
                      src={agentDavid} 
                      alt="Priya Patel" 
                      className="w-24 h-24 rounded-full border-4 border-background object-cover"
                    />
                    <div className="mt-16">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">Priya Patel</h3>
                        <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">WARM</span>
                      </div>
                      <p className="text-sm text-muted-foreground">eXp Realty · Austin</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Gross/yr</p>
                      <p className="text-lg font-bold">$200k</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Sales/yr</p>
                      <p className="text-lg font-bold">$5.2M</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Sales/total</p>
                      <p className="text-lg font-bold">42</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold mb-2">Experience</p>
                      <p className="text-sm text-muted-foreground">5 Years</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Buyers</p>
                        <p className="text-sm font-semibold">70%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Sellers</p>
                        <p className="text-sm font-semibold">30%</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-primary/10 text-sm rounded-full">• Social Media</span>
                        <span className="px-3 py-1 bg-primary/10 text-sm rounded-full">• Marketing</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-2">Lead Details</p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Wants</p>
                          <ul className="text-sm space-y-1">
                            <li>• Coaching</li>
                            <li>• Free Leads</li>
                            <li>• Remote Work</li>
                          </ul>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Motivation</p>
                            <p className="text-sm font-semibold">8/10</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Interest</p>
                            <p className="text-sm font-semibold">7/10</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-5xl font-bold mb-2">10K+</p>
            <p className="text-muted-foreground">Successful Matches</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <p className="text-5xl font-bold mb-2">95%</p>
            <p className="text-muted-foreground">Match Accuracy</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <p className="text-5xl font-bold mb-2">50%</p>
            <p className="text-muted-foreground">Less Turnover</p>
          </motion.div>
        </div>
      </section>

      {/* CTA Cards */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-8">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-4">For Agents</h3>
              <p className="text-muted-foreground mb-6">
                Find brokerages that match your goals, values, and growth trajectory.
              </p>
              <Link to="/for-agents">
                <Button className="rounded-full">
                  Explore Opportunities <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-8">
              <Building2 className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-4">For Brokerages</h3>
              <p className="text-muted-foreground mb-6">
                Recruit top-performing agents who fit your culture and vision.
              </p>
              <Link to="/for-brokerages">
                <Button className="rounded-full">
                  Find Top Talent <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Matching Process */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Matching Process</h2>
            <p className="text-xl text-muted-foreground">Four steps to finding your perfect match</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                number: "01",
                title: "Profile Analysis",
                description: "We analyze agent experience, goals, and preferences to understand what they're looking for.",
                features: ["Experience level assessment", "Career goals analysis", "Tech preference evaluation"]
              },
              {
                number: "02",
                title: "Brokerage Scanning",
                description: "Our AI scans hundreds of brokerages to find ones that match specific criteria.",
                features: ["247+ brokerages evaluated", "12 matching factors", "Location-based filtering"]
              },
              {
                number: "03",
                title: "Compatibility Scoring",
                description: "Advanced algorithms calculate compatibility scores across multiple dimensions.",
                features: ["Lead generation: 95% match", "Tech support: 98% match", "Culture fit: 92% match"]
              },
              {
                number: "04",
                title: "Perfect Match Found!",
                description: "We present you with your ideal agent match and all the benefits that come with it.",
                features: ["Quality leads included", "Transaction coordinator", "AI-powered social media"]
              }
            ].map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-8">
                    <div className="text-6xl font-bold text-primary/20 mb-4">{step.number}</div>
                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    <ul className="space-y-2">
                      {step.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* See How Much Greener Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">See How Much Greener The Grass Is On The Other Side</h2>
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              Whether you're an agent seeking growth, leads, technology, mentorship, a top team, or better opportunities—or a team looking to hire top talent—OwlDoor connects you with the right people at the right time.
            </p>
            <p>
              You're looking for more than just a track record or a name in your network. You want meaningful business relationships built on shared values, aligned goals, and complementary strengths. You value trust, honesty, and collaboration, and you know success comes from working with people who bring out the best in you—and vice versa.
            </p>
          </div>
        </div>
      </section>

      {/* Effortless Connections Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">Effortless Connections, Powered by AI</h2>
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed mb-12">
            <p>
              At OwlDoor, we make these connections effortless. Our AI-powered platform analyzes thousands of data points and leverages insights from top recruiters across the U.S. to determine what truly makes an Agent/Team match successful. Beyond experience, performance, and cultural fit, we dig into what drives long-term, productive relationships.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <div className="text-center">
                <p className="text-8xl font-bold text-primary mb-4">16%</p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  of agents switched brokerages last year—not because of poor skill, but because their needs weren't met, whether in leads, technology, culture, or reputation. OwlDoor adds AI to the equation to ensure every match is lasting, effective, and filled with opportunity.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-3">For Agents</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Access insights on better opportunities and discover how much more a team or brokerage can offer. Find teams that align with your ambitions, style, and career trajectory.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">For Teams</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Discover professionals who not only have the skills you need but also share your vision and commitment to excellence.
                </p>
              </div>
            </div>
          </div>

          {/* Video Section */}
          <div className="mt-16 flex justify-center">
            <div className="w-full max-w-4xl">
              <div className="relative w-full" style={{ padding: '56.25% 0 0 0' }}>
                <iframe 
                  src="https://player.vimeo.com/video/1132720975?badge=0&amp;autopause=0&amp;loop=1&amp;player_id=0&amp;app_id=58479" 
                  frameBorder="0" 
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write" 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  title="OwlDoor Video"
                  className="rounded-lg shadow-2xl"
                ></iframe>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center space-y-4">
            <p className="text-2xl font-bold">No more blind networking.</p>
            <p className="text-2xl font-bold">No more guesswork.</p>
            <p className="text-2xl font-bold">No more empty promises.</p>
            <p className="text-lg text-muted-foreground mt-6 max-w-3xl mx-auto">
              Just intelligent matching, thoughtful introductions, and the ability to focus on what truly matters—building relationships that drive real growth.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">Ready to grow?</h2>
          <p className="text-xl mb-12 opacity-90">
            Join thousands finding their perfect match with OwlDoor.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="rounded-full text-lg px-8">
              Get Started <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
        <div className="absolute bottom-0 right-0 w-64 h-64 opacity-20">
          <img src={forSaleSign} alt="For Sale" className="w-full h-full object-contain" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 OwlDoor. Connecting real estate professionals.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
