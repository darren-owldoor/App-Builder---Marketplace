import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, MapPin, ArrowRight, Building, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { HomeSignUpForm } from "@/components/HomeSignUpForm";
import realtorLenderNetwork from "@/assets/realtor-lender-network.jpg";
import { MortgageMarketChecker } from "@/components/MortgageMarketChecker";
import { LiveCRMDemo } from "@/components/LiveCRMDemo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function RealEstateReferrals() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Headline and Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-center lg:text-left">
                Meet New Agents<br />
                <span className="text-primary">Fund More Deals</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mb-8 text-center lg:text-left">
                Network, Connect Or Find A Better Branch
              </p>
              
              <div className="bg-[#35a87e] p-6 rounded-xl">
                <HomeSignUpForm />
              </div>

              <Card className="p-8 text-center bg-card mt-6">
                <h3 className="text-xl font-bold mb-6">We Help Top Teams to Find Top Pros To Join</h3>
                <Button 
                  size="lg" 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => navigate("/for-brokerages")}
                >
                  Hiring Real Estate Pros?
                </Button>
              </Card>
            </motion.div>

            {/* Right: Network Map and Cards */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="relative">
                <img 
                  src={realtorLenderNetwork} 
                  alt="Realtor Lender Network Map" 
                  className="w-full h-auto rounded-lg"
                />
              </div>

              <div className="grid gap-6">
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <Star className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-lg mb-2">For Real Estate Agents</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Explore Your Options. Our Average Agent Finds a Better Team
                      </p>
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => navigate("/for-agents")}
                      >
                        Learn More
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-lg mb-2">For Loan Officers</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Find a Better Branch That Provides What You Are Worth
                      </p>
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => navigate("/for-mortgage")}
                      >
                        Sign Up
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live CRM Demo */}
      <LiveCRMDemo />

      {/* Join Referral Network & For Brokerages */}
      <section className="py-16 px-4 dotted-pattern">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <Star className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-4">Join Referral Network</h3>
              <p className="text-muted-foreground mb-6">
                For Real Estate Agents and Lenders
              </p>
              <Button 
                size="lg" 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => navigate("/matching")}
              >
                Explore Opportunities <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow">
              <Building className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-4">For Brokerages</h3>
              <p className="text-muted-foreground mb-6">
                Recruit top-performing agents who fit your culture and vision.
              </p>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/for-brokerages")}
              >
                Find Top Talent <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-primary">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary-foreground">
            Common questions
          </h2>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-background rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                1. How does OwlDoor verify professionals?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We verify all professionals through a comprehensive process including license verification, 
                background checks, and performance reviews. Each professional is thoroughly vetted before 
                joining our network to ensure quality matches.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-background rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                2. What markets do you cover?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                OwlDoor operates nationwide across all 50 states. We have active professionals and 
                opportunities in major metropolitan areas as well as smaller markets. Use our market 
                availability checker above to see specific coverage in your area.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-background rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                3. What Does OwlDoor for Real Estate Pros?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                OwlDoor connects real estate agents with better opportunities, including teams that offer 
                higher splits, better support, more leads, and improved technology. We also facilitate 
                referral networks between agents and loan officers to help grow your business.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-background rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                4. Is It Also Free For Brokerages, Teams and Companies?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! OwlDoor is free for professionals to explore opportunities. For brokerages, teams, 
                and companies looking to recruit, we offer various partnership plans. Contact us to learn 
                more about how we can help you find top talent.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="text-center mt-8">
            <p className="text-primary-foreground/80 mb-4">Visit our Help Center</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
