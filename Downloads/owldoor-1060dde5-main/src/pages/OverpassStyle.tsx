import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Star, MapPin, TrendingUp, Users, Award, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";

const OverpassStyle = () => {
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

  const agents = [
    { name: "Sarah M.", title: "Top Rated Agent", experience: "8 years", specialization: "Luxury Homes", focus: "Residential" },
    { name: "David L.", title: "Top Rated Broker", experience: "12 years", specialization: "Commercial", focus: "Investment" },
    { name: "Priya K.", title: "Top Rated Agent", experience: "6 years", specialization: "First-Time Buyers", focus: "Residential" },
    { name: "Marcus J.", title: "Top Rated Broker", experience: "15 years", specialization: "Multi-Family", focus: "Commercial" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-primary opacity-20 rounded-bl-[100px]" />
        <div className="absolute bottom-0 left-0 w-1/3 h-2/3 bg-gradient-accent opacity-10 rounded-tr-[100px]" />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <motion.div {...fadeInUp}>
              <h1 className="text-6xl md:text-7xl font-bold mb-6 text-foreground">
                <span className="relative inline-block">
                  Top notch
                  <span className="absolute bottom-2 left-0 w-full h-3 bg-primary/20 -z-10" />
                </span>
                <br />
                <span className="relative inline-block mt-2">
                  agents.
                  <span className="absolute bottom-2 left-0 w-full h-3 bg-accent/20 -z-10" />
                </span>
                <br />
                <span className="relative inline-block mt-2">
                  Simple matching.
                  <span className="absolute bottom-2 left-0 w-full h-3 bg-secondary/20 -z-10" />
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-lg">
                Finding the perfect brokerage or agent should be quick & simple. Browse, match, and connect with qualified professionals on one platform – with guidance from real people as you grow.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/client-signup">
                  <Button size="lg" className="text-lg px-8 group">
                    Find Agents
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/agent-signup">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    Join as Agent
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right Column - Profile Cards */}
            <motion.div 
              className="relative h-[600px]"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Floating Background Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
              
              {/* Floating Tags */}
              <motion.div
                className="absolute top-10 right-10 bg-card border border-border rounded-full px-6 py-3 shadow-lg"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Experience</p>
                    <p className="font-semibold text-foreground">8 years</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute top-40 right-20 bg-card border border-border rounded-full px-6 py-3 shadow-lg"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Specialization</p>
                    <p className="font-semibold text-foreground">Luxury Homes</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute bottom-32 right-5 bg-card border border-border rounded-full px-6 py-3 shadow-lg"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-secondary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Focus</p>
                    <p className="font-semibold text-foreground">Residential</p>
                  </div>
                </div>
              </motion.div>

              {/* Main Profile Card */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80"
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <Card className="p-6 bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-2xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold text-white">
                      SM
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Sarah M.</h3>
                      <p className="text-sm text-muted-foreground">Top Rated Agent</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span>4.9 • 127 successful matches</span>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Scrolling Agent Cards */}
      <section className="py-12 overflow-hidden bg-muted/30">
        <motion.div 
          className="flex gap-6"
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {[...agents, ...agents].map((agent, idx) => (
            <Card key={idx} className="min-w-[300px] p-6 bg-card border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center text-white font-bold">
                  {agent.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{agent.name}</h4>
                  <p className="text-sm text-muted-foreground">{agent.title}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-medium text-foreground">{agent.experience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Specialization</span>
                  <span className="font-medium text-foreground">{agent.specialization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Focus</span>
                  <span className="font-medium text-foreground">{agent.focus}</span>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>
      </section>

      {/* Stack Your Team Section */}
      <section className="py-32 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
              <span className="relative inline-block">
                Stack your team with agents
                <span className="absolute bottom-2 left-0 w-full h-3 bg-primary/20 -z-10" />
              </span>
              <br />
              <span className="relative inline-block mt-2">
                that crush it
                <span className="absolute bottom-2 left-0 w-full h-3 bg-accent/20 -z-10" />
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Thousands of real estate professionals across 40+ markets worldwide with the same skills, qualities, and values as your in-house team? Yup, OwlDoor is the solution you've been searching for.
            </p>
          </motion.div>

          <motion.div 
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8"
          >
            <motion.div variants={fadeInUp}>
              <Link to="/for-agents">
                <Card className="p-8 h-full hover:shadow-xl transition-shadow cursor-pointer group bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
                  <Users className="w-12 h-12 mb-4 text-primary group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-bold mb-3 text-foreground">Agents for growth</h3>
                  <p className="text-muted-foreground mb-4">
                    Scale your brokerage with top-notch agents who have mastered lead conversion and client relationships.
                  </p>
                  <div className="flex items-center text-primary font-semibold group-hover:gap-3 gap-2 transition-all">
                    Learn more <ArrowRight className="w-5 h-5" />
                  </div>
                </Card>
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Link to="/find-brokerage">
                <Card className="p-8 h-full hover:shadow-xl transition-shadow cursor-pointer group bg-gradient-to-br from-accent/5 to-accent/10 border-2 border-accent/20">
                  <Award className="w-12 h-12 mb-4 text-accent group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-bold mb-3 text-foreground">Brokerages for reach</h3>
                  <p className="text-muted-foreground mb-4">
                    With brokerages available nationwide, your location will never hold you back from finding the perfect fit.
                  </p>
                  <div className="flex items-center text-accent font-semibold group-hover:gap-3 gap-2 transition-all">
                    Learn more <ArrowRight className="w-5 h-5" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 text-foreground">
              Simple process. Powerful results.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From discovery to partnership in just a few steps
            </p>
          </motion.div>

          <motion.div 
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-8"
          >
            {[
              { step: "01", title: "Create Profile", desc: "Tell us about your goals and preferences" },
              { step: "02", title: "Get Matched", desc: "Our AI finds your perfect professional partners" },
              { step: "03", title: "Connect", desc: "Review matches and schedule conversations" },
              { step: "04", title: "Grow Together", desc: "Build lasting partnerships and scale" }
            ].map((item, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card className="p-6 text-center h-full bg-card border-border hover:border-primary/50 transition-colors">
                  <div className="text-6xl font-bold text-primary/20 mb-4">{item.step}</div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-4 bg-gradient-primary text-white">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-12 text-center"
          >
            {[
              { number: "10K+", label: "Active Agents" },
              { number: "500+", label: "Brokerages" },
              { number: "50K+", label: "Successful Matches" },
              { number: "98%", label: "Satisfaction Rate" }
            ].map((stat, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <div className="text-5xl md:text-6xl font-bold mb-2">{stat.number}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 text-foreground">
              Everything you need to succeed
            </h2>
          </motion.div>

          <motion.div 
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { icon: CheckCircle2, title: "Verified Professionals", desc: "Every agent and brokerage is thoroughly vetted" },
              { icon: TrendingUp, title: "Smart Matching", desc: "AI-powered algorithm finds your perfect fit" },
              { icon: Users, title: "Dedicated Support", desc: "Real people helping you every step of the way" },
              { icon: Star, title: "Quality First", desc: "Only top-rated professionals in our network" },
              { icon: MapPin, title: "Nationwide Coverage", desc: "Connect with professionals across all markets" },
              { icon: Award, title: "Proven Results", desc: "Track record of successful partnerships" }
            ].map((feature, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card className="p-8 h-full bg-card border-border hover:shadow-lg transition-shadow">
                  <feature.icon className="w-12 h-12 mb-4 text-primary" />
                  <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-4 bg-gradient-accent text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Ready to find your perfect match?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Join thousands of real estate professionals growing their businesses with OwlDoor
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/client-signup">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Get Started
                </Button>
              </Link>
              <Link to="/match">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-white text-white hover:bg-white hover:text-primary">
                  Take Matching Quiz
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OverpassStyle;
