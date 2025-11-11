import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Users, Shield, Star, Globe, Zap, TrendingUp, Plus, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import usaMapNetwork from "@/assets/usa-map-network.png";
import { HomeSignUpForm } from "@/components/HomeSignUpForm";
import { MortgageMarketChecker } from "@/components/MortgageMarketChecker";
import LiveMatching from "@/components/LiveMatching";
const HomeAlt = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const features = [{
    icon: Shield,
    title: "Verified Professionals",
    description: "Every agent and brokerage is thoroughly vetted"
  }, {
    icon: Zap,
    title: "Instant Matching",
    description: "Connect with qualified professionals in real-time"
  }, {
    icon: Globe,
    title: "Nationwide Coverage",
    description: "Access to agents across all 50 states"
  }];
  const services = [{
    title: "For Brokerages",
    description: "Find top talent, expand your team, and grow your reach across markets"
  }, {
    title: "For Agents",
    description: "Discover brokerages that align with your goals and career aspirations"
  }, {
    title: "For Teams",
    description: "Build powerful partnerships and scale your business nationwide"
  }, {
    title: "For Mortgage",
    description: "Build powerful partnerships and scale your business nationwide"
  }];
  const faqs = [{
    question: "How does OwlDoor verify professionals?",
    answer: "We conduct thorough background checks, license verification, and reference validation for all registered professionals."
  }, {
    question: "What markets do you cover?",
    answer: "OwlDoor operates across all 50 states with a network of over 2,800 verified agents and 150+ brokerages."
  }, {
    question: "What Does OwlDoor for Real Estate Pros?",
    answer: "We help connect Agents and Loan Officers with Top Teams willing to offer them more compensation and/or resources like leads, tech, etc. We also connect Agents with Referral Networks including our own that provides Thousands of Connections."
  }, {
    question: "Is It Also Free For Brokerages, Teams and Companies?",
    answer: "We offer both Free and Paid options. You choose what suits you best. Paid platform is invite only or on an approval basis as we only accept the best of the best to keep our platform's integrity."
  }];
  return <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 relative overflow-hidden">
        {/* Dotted Background */}
        <div className="absolute inset-0 opacity-100" style={{
        backgroundImage: "radial-gradient(circle, rgba(53, 168, 126, 0.27) 3px, transparent 3px)",
        backgroundSize: "20px 20px"
      }}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
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
              <h1 className="sm:text-6xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-4 w-full tracking-tight text-4xl">
                Connecting Top <span className="text-primary">Real Estate Pros</span>
              </h1>
              <p className="text-muted-foreground mb-8 leading-tight text-base sm:text-xl md:text-2xl lg:text-3xl font-normal w-full whitespace-nowrap overflow-hidden text-ellipsis">
                {" "}
                With Better Opportunities and Networks
              </p>

              {/* Inline Join Form */}
              <div className="rounded-2xl p-8 border-0 shadow-xl mb-8 bg-primary transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <HomeSignUpForm />
              </div>

              {/* For Real Estate Agents */}
              <div className="bg-card rounded-2xl p-8 border shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
                backgroundSize: "20px 20px"
              }}></div>
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Star className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-3xl font-bold text-foreground">For Real Estate Agents</h3>
                  </div>
                  <p className="mb-6 text-muted-foreground font-medium text-left text-2xl">
                    OwlDoor is a Place to Find Opportunity in Referral Partnerships, Lender Partnerships and See What
                    Teams Would Offer You to Join. It's Always a Goof Idea to Explore Your Options. Our Average Agent
                    Finds at least one opportunity that grows their business and network. It's Free to Join too!{" "}
                  </p>
                  <Link to="/for-agents">
                    <Button size="lg" className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-2xl">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Sidebar */}
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
              {/* Used by teams card */}
              <div className="bg-card rounded-2xl p-8 border shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <div className="mb-6">
                  <img src={usaMapNetwork} alt="USA Network Map" className="w-full h-auto rounded-lg" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">We Help Top Teams to Find Top Pros To Join</h3>
                <Link to="/teams">
                  <Button className="w-full rounded-lg bg-primary text-xl">
                    Is Your Team Hiring Real Estate Pros?
                  </Button>
                </Link>
              </div>

              {/* Agent and Mortgage Sign Up Cards */}
              <div className="space-y-6">
                {/* Video Section */}
                <div className="rounded-2xl overflow-hidden border shadow-xl bg-card transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                  <div className="relative w-full" style={{
                  paddingBottom: "56.25%"
                }}>
                    <iframe src="https://player.vimeo.com/video/1132706705?h=0&badge=0&autopause=0&loop=1&player_id=0&app_id=58479" className="absolute top-0 left-0 w-full h-full" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write" title="OwlDoor Video" />
                  </div>
                </div>

                {/* For Loan Officers */}
                <div className="bg-card rounded-2xl p-8 border shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                  <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
                  backgroundSize: "20px 20px"
                }}></div>
                  <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-3xl font-bold text-foreground">For Loan Officers</h3>
                    </div>
                    <p className="mb-6 font-medium text-muted-foreground text-center text-2xl">
                      Find a New Referral Partners, Opportunities, or a Better Branch That Provides What You Are Worth
                    </p>
                    <Link to="/for-mortgage">
                      <Button size="lg" className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-2xl">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mortgage Market Checker Section */}
      <MortgageMarketChecker />

      {/* How OwlDoor Works Section */}

      {/* For Agents and Brokerages Section */}

      {/* Features Grid */}

      {/* CTA Cards Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Dotted Background */}
        <div className="absolute inset-0 opacity-100" style={{
        backgroundImage: "radial-gradient(circle, rgba(53, 168, 126, 0.27) 3px, transparent 3px)",
        backgroundSize: "20px 20px"
      }}></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Join Referral Network Card */}
            <motion.div initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="bg-card rounded-2xl p-8 border shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                  SJ
                </div>

                <div className="flex-1">
                  <h4 className="text-xl font-bold mb-1">Sarah Johnson</h4>
                  <p className="text-sm text-muted-foreground mb-2">Stark Industries Realty</p>
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => <Star key={i} className={`h-4 w-4 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />)}
                    <span className="text-sm font-semibold">4.8</span>
                    <span className="text-sm text-muted-foreground">(120 reviews)</span>
                  </div>
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                    Verified Pro
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-xs text-muted-foreground mb-1">REFERRAL</div>
                  <div className="font-bold text-primary">25%</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-xs text-muted-foreground mb-1">EXPERIENCE</div>
                  <div className="font-bold">12y</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-xs text-muted-foreground mb-1">DEALS</div>
                  <div className="font-bold">95</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-xs text-muted-foreground mb-1">VOLUME</div>
                  <div className="font-bold">$50M</div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Left Column: Service Areas & Specialties */}
                <div className="space-y-4">
                  {/* Service Areas */}
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">SERVICE AREAS</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-background border border-border rounded-full text-xs">
                        San Diego, CA
                      </span>
                      <span className="px-3 py-1 bg-background border border-border rounded-full text-xs">
                        La Jolla, CA
                      </span>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">SPECIALTIES</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
                        Luxury Properties
                      </span>
                      <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
                        First-time Buyers
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Bio */}
                <div className="p-3 bg-muted/30 rounded flex items-center">
                  <p className="text-sm">
                    Top-producing agent with 12+ years of experience in the San Diego luxury market. Dedicated to
                    providing exceptional service and building lasting relationships.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <Link to="/join">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                  Search Network
                </Button>
              </Link>
            </motion.div>

            {/* For Brokerages Card */}
            <motion.div initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.1
          }} viewport={{
            once: true
          }} className="bg-card rounded-2xl p-8 border shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold mb-3 text-foreground text-5xl">100% Free To Join Referral Network</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Find Real Estate Agents, Teams and Lenders Who Need Someone to Work a Deal For Them. Relocations, Out of
                Market or Just Not Your Specialty. You Can Find A Great Professional To Send a Client To Absolutely Free
                on OwlDoor.com. Join Today and Make New Connections, Find Better Opportunities & Level Up Your Business.
              </p>
              <Link to="/join">
                <Button variant="outline" className="w-full border-primary rounded-lg bg-slate-950 hover:bg-slate-800 text-zinc-50">
                  Join Free
                  <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-primary">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-bold text-stone-50 text-5xl">Common questions</h2>
            <Button variant="link" className="text-primary">
              Visit our Help Center <ArrowRight className="ml-2" />
            </Button>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.1
          }} viewport={{
            once: true
          }} className="bg-card rounded-xl border overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors">
                  <span className="font-semibold flex items-center gap-3">
                    <span className="text-muted-foreground">{index + 1}.</span>
                    {faq.question}
                  </span>
                  <Plus className={`w-5 h-5 transition-transform ${openFaq === index ? "rotate-45" : ""}`} />
                </button>
                {openFaq === index && <div className="px-6 pb-4 text-muted-foreground">{faq.answer}</div>}
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Find A Better Team Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Dotted Background */}
        <div className="absolute inset-0 opacity-100" style={{
        backgroundImage: "radial-gradient(circle, rgba(53, 168, 126, 0.27) 3px, transparent 3px)",
        backgroundSize: "20px 20px"
      }}></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Find A Better Team or Partnership</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{
            icon: Star,
            title: "Quality",
            subtitle: "Top-Tier Brokerages Only",
            description: "We only show you vetted, high-performing brokerages with proven support systems.",
            items: ["Top-rated brokerages", "Verified support systems", "Proven success records"]
          }, {
            icon: Shield,
            title: "Culture",
            subtitle: "Cultural Fit Analysis",
            description: "AI evaluates brokerage culture, values, and work environment to ensure your success.",
            items: ["Culture evaluation", "Values alignment", "Environment compatibility"]
          }, {
            icon: TrendingUp,
            title: "Growth",
            subtitle: "Career Growth Opportunities",
            description: "Find brokerages offering the resources, training, and support you need to level up.",
            items: ["Lead generation programs", "Training & mentorship", "Growth resources"]
          }, {
            icon: Shield,
            title: "Trust",
            subtitle: "Verified & Trusted",
            description: "All brokerages are verified and screened to ensure they deliver on their promises.",
            items: ["Verified credentials", "Agent testimonials", "Performance tracking"]
          }].map((feature, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.1
          }} viewport={{
            once: true
          }} className="bg-card rounded-2xl p-8 border shadow-xl group cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                <div>
                  <feature.icon className="w-12 h-12 mb-4 text-muted-foreground" />
                  <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm font-semibold text-muted-foreground mb-4">{feature.subtitle}</p>
                  <p className="text-sm text-muted-foreground mb-6">{feature.description}</p>
                  <div className="space-y-2">
                    {feature.items.map((item, i) => <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </div>)}
                  </div>
                </div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <motion.div initial={{
        opacity: 0,
        scale: 0.95
      }} whileInView={{
        opacity: 1,
        scale: 1
      }} viewport={{
        once: true
      }} className="max-w-4xl mx-auto text-primary-foreground rounded-3xl p-12 text-center bg-primary shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
          <TrendingUp className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-6 text-white/[0.91] md:text-6xl">Ready to grow your network?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of real estate professionals who trust OwlDoor to make the right connections.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/join">
              <Button size="lg" variant="secondary" className="rounded-lg text-lg px-8">
                Sign Up <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="rounded-lg text-lg px-8 bg-primary-foreground/10 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Sign In
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Live Matching CRM Section */}
      <LiveMatching />

      <Footer />
    </div>;
};
export default HomeAlt;