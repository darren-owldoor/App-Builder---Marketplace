import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, TrendingUp, Target, Shield, Award, CheckCircle2, Zap, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { MortgageMarketChecker } from "@/components/MortgageMarketChecker";

const MortgageProfessionals = () => {
  const painPoints = [
    {
      title: "Limited Lead Flow",
      description: "Relying on referrals alone isn't enough to hit your goals consistently."
    },
    {
      title: "Slow Commission Splits",
      description: "Low commission splits limit your earning potential no matter how hard you work."
    },
    {
      title: "Lack of Support",
      description: "Working in isolation without proper training, tech, or mentorship holds you back."
    }
  ];

  const solutions = [
    {
      icon: Target,
      title: "Better Opportunities",
      description: "Connect with top mortgage companies offering higher splits, better support, and more resources."
    },
    {
      icon: TrendingUp,
      title: "More Leads",
      description: "Get access to referral networks and lead generation programs that keep your pipeline full."
    },
    {
      icon: Award,
      title: "Career Growth",
      description: "Find teams that invest in your success with training, technology, and mentorship."
    }
  ];

  const benefits = [
    "Higher commission splits (75-100%)",
    "Access to exclusive lead sources",
    "Modern technology stack included",
    "Ongoing training and support",
    "Flexible work environment",
    "Team collaboration opportunities"
  ];

  return (
    <div className="min-h-screen bg-background" data-theme="trust-green">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(53, 168, 126, 0.3) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-6">
              <span className="text-sm font-semibold text-primary">For Mortgage Professionals</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Maximize Income,<br />
              <span className="text-primary">Minimize Frustration.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Find mortgage companies that offer better splits, more leads, and the support you need to thrive. Join loan officers who've already made the leap to better opportunities.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/join">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 h-14">
                  Find Your Next Branch <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <Link to="/companies">
                <Button size="lg" variant="outline" className="border-2 text-lg px-8 h-14">
                  Compare Companies
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Market Checker Section */}
      <MortgageMarketChecker />

      {/* Pain Points Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="w-16 h-1 bg-primary mx-auto mb-6"></div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Say Goodbye to the Grind
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Working harder shouldn't be the only answer. If these challenges sound familiar, it's time for a change.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {painPoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card p-8 rounded-2xl border-2 hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                  <div className="w-6 h-6 bg-destructive/20 rounded-full"></div>
                </div>
                <h3 className="text-2xl font-bold mb-3">{point.title}</h3>
                <p className="text-muted-foreground">{point.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              The Solution You've Been Looking For
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              OwlDoor connects you with mortgage companies that value your expertise and want to help you succeed.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card p-8 rounded-2xl border hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <solution.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{solution.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{solution.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
              What You Get With Better Companies
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4"
                >
                  <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-medium">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: "2,800+", label: "Loan Officers Connected" },
              { number: "150+", label: "Mortgage Companies" },
              { number: "85%", label: "Found Better Opportunities" },
              { number: "$50K+", label: "Average Income Increase" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-5xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground text-lg">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-muted/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-card rounded-3xl p-12 text-center border-2 shadow-xl"
        >
          <Zap className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Level Up Your Career?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of loan officers who've found better opportunities through OwlDoor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/join">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 h-14">
                Get Started Free <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-2 text-lg px-8 h-14">
                Sign In
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default MortgageProfessionals;
