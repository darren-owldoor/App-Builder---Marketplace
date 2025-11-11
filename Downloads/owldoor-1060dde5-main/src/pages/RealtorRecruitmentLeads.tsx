import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet";
import {
  CheckCircle,
  TrendingUp,
  Users,
  Target,
  Zap,
  Award,
  BarChart,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Star,
  DollarSign,
  Shield
} from "lucide-react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const RealtorRecruitmentLeads = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    city: "",
    state: ""
  });
  const [loading, setLoading] = useState(false);

  const benefits = [
    {
      icon: Target,
      title: "Pre-Qualified Agents",
      description: "Connect with agents actively looking for new opportunities"
    },
    {
      icon: TrendingUp,
      title: "Higher Close Rates",
      description: "85% of our leads result in meaningful conversations"
    },
    {
      icon: Users,
      title: "Quality Over Quantity",
      description: "Vetted professionals ready to make a move"
    },
    {
      icon: Zap,
      title: "Instant Notifications",
      description: "Be the first to reach out to new prospects"
    },
    {
      icon: DollarSign,
      title: "Cost-Effective",
      description: "Lower cost per hire than traditional recruiting"
    },
    {
      icon: Shield,
      title: "Compliance Ready",
      description: "All leads meet licensing and regulatory requirements"
    }
  ];

  const stats = [
    { number: "2,800+", label: "Active Agents" },
    { number: "150+", label: "Brokerages Hiring" },
    { number: "85%", label: "Response Rate" },
    { number: "30 Days", label: "Avg. Time to Hire" }
  ];

  const features = [
    "Instant lead notifications via email and SMS",
    "Detailed agent profiles with experience and production data",
    "Geographic filtering for market-specific recruiting",
    "CRM integration for seamless workflow",
    "Dedicated account manager support",
    "Performance analytics and reporting dashboard"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const digitsOnly = formData.phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('agent-directory-signup', {
        body: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          specialization: "real_estate",
          account_type: "team",
          city: formData.city || "Not specified",
          state: formData.state || "Not specified",
          company: formData.company
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Thank you! We'll be in touch shortly.");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          company: "",
          city: "",
          state: ""
        });
        
        // Optional: redirect to thank you page
        setTimeout(() => {
          navigate("/application-pending");
        }, 2000);
      } else {
        throw new Error(data?.error || 'Failed to submit request');
      }
    } catch (error: any) {
      console.error("Error:", error);
      // Show user-friendly message for duplicate email
      if (error.message?.includes('already exists') || error.message?.includes('EMAIL_EXISTS')) {
        toast.error(error.message || "This email is already registered. Please sign in instead.");
      } else {
        toast.error(error.message || "Failed to submit. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Realtor Recruitment Leads | Quality Real Estate Agent Recruiting</title>
        <meta name="description" content="Get high-quality realtor recruitment leads from agents actively seeking new opportunities. Connect with pre-qualified real estate professionals ready to join your brokerage." />
        <meta name="keywords" content="realtor recruitment, real estate agent leads, brokerage recruiting, agent recruitment, hire realtors, real estate recruiting" />
        <link rel="canonical" href="https://owldoor.com/realtor-recruitment-leads" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Realtor Recruitment Leads | Quality Real Estate Agent Recruiting" />
        <meta property="og:description" content="Get high-quality realtor recruitment leads from agents actively seeking new opportunities. Connect with pre-qualified real estate professionals ready to join your brokerage." />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Realtor Recruitment Leads | Quality Real Estate Agent Recruiting" />
        <meta name="twitter:description" content="Get high-quality realtor recruitment leads from agents actively seeking new opportunities." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Content */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                  #1 Platform for Real Estate Recruiting
                </Badge>
                
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                  Quality Realtor <br />
                  <span className="text-primary">Recruitment Leads</span>
                </h1>
                
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Stop wasting time on cold outreach. Connect with pre-qualified real estate agents actively seeking better opportunities at top brokerages like yours.
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    "Agents with proven track records",
                    "Actively looking for new opportunities",
                    "Interested in your specific market"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-lg">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-primary/20 border-2 border-background"></div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground">Trusted by 150+ brokerages</p>
                  </div>
                </div>
              </motion.div>

              {/* Right Column - Lead Form */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="shadow-2xl border-2">
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold mb-2">Get Started Today</h2>
                    <p className="text-muted-foreground mb-6">Fill out the form below and start receiving qualified leads</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Input
                            placeholder="First Name *"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="h-12"
                            required
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="Last Name *"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="h-12"
                            required
                          />
                        </div>
                      </div>

                      <Input
                        type="email"
                        placeholder="Work Email *"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-12"
                        required
                      />

                      <Input
                        type="tel"
                        placeholder="Phone Number *"
                        value={formData.phone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData({ ...formData, phone: digits });
                        }}
                        className="h-12"
                        maxLength={10}
                        required
                      />

                      <Input
                        placeholder="Company/Brokerage Name"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="h-12"
                      />

                      <div className="grid md:grid-cols-2 gap-4">
                        <Input
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="h-12"
                        />
                        <Input
                          placeholder="State"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="h-12"
                          maxLength={2}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
                        disabled={loading}
                      >
                        {loading ? "Submitting..." : "Get Quality Leads Now"}
                        {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        By submitting, you agree to receive communications about our services. 
                        No spam, unsubscribe anytime.
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.number}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Why Choose Our Realtor Leads?
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                We connect you with agents who are actively looking, not just browsing
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                        <benefit.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Everything You Need to Recruit Top Talent
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4"
                >
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <p className="text-lg">{feature}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto bg-primary text-primary-foreground rounded-3xl p-12 text-center"
          >
            <Award className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Start Recruiting Smarter Today
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join 150+ brokerages who've transformed their recruiting with our platform
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 h-14"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Get Your First Leads Free <ArrowRight className="ml-2" />
            </Button>
          </motion.div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default RealtorRecruitmentLeads;
