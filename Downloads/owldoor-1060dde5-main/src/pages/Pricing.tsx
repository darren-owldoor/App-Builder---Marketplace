import { Check, X, Calendar, UserCheck, TrendingUp, Shield, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (priceId: string, tierName: string) => {
    setLoading(priceId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to purchase recruiting packages",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          price_id: priceId,
          tier_name: tierName 
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast({
          title: "Redirecting to Checkout",
          description: "Opening Stripe checkout in a new tab...",
        });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Transparent Recruiting Pricing
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Performance-based recruiting. You only pay for quality candidates who match your needs.
            </p>
          </div>

          {/* Pricing Breakdown Section */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              How We Charge
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Our pricing ranges from <span className="text-primary font-semibold">$200 to $500 per candidate</span>, based on two key factors:
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
              {/* Factor 1: Candidate Quality */}
              <Card className="border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <UserCheck className="h-8 w-8 text-primary" />
                    <CardTitle className="text-2xl">Candidate Quality</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    The level of qualification and experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="font-semibold text-primary min-w-[60px]">$200</div>
                      <div className="text-sm">
                        <strong>Basic Lead:</strong> Contact information, basic interest indicated
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="font-semibold text-primary min-w-[60px]">$150-250</div>
                      <div className="text-sm">
                        <strong>Qualified Candidate:</strong> Verified credentials, relevant experience, strong fit for your market
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="font-semibold text-primary min-w-[60px]">$300-400</div>
                      <div className="text-sm">
                        <strong>Premium Candidate:</strong> Top-tier producer, proven track record, highly competitive profile
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Factor 2: Appointment Status */}
              <Card className="border-2 hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-8 w-8 text-primary" />
                    <CardTitle className="text-2xl">Appointment Status</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Whether a meeting has been scheduled
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <strong>No Appointment:</strong> Candidate information provided, introduction made, but no meeting scheduled yet
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border-2 border-primary/20">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <strong>Appointment Set:</strong> Meeting confirmed with candidate
                        <div className="text-primary font-semibold mt-2">+$100-200 premium</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-primary">
                      Why we charge more for appointments:
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Scheduling meetings requires additional vetting, coordination, and ensures the candidate is genuinely interested and committed to exploring opportunities with you.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Pricing Examples */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Pricing Examples</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <Card className="hover:shadow-lg transition-all">
                <CardHeader className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">$200</div>
                  <CardTitle>Basic Lead</CardTitle>
                  <CardDescription>No Appointment</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Contact information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Basic interest expressed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Initial introduction made</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full" 
                    onClick={() => handlePurchase("price_1SR6d4BDqaZSMCzwdcoeubBh", "Basic Lead")}
                    disabled={loading === "price_1SR6d4BDqaZSMCzwdcoeubBh"}
                  >
                    {loading === "price_1SR6d4BDqaZSMCzwdcoeubBh" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Purchase Now"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all border-2 border-primary">
                <CardHeader className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">$300</div>
                  <CardTitle>Qualified Candidate</CardTitle>
                  <CardDescription>With Appointment</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Verified credentials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Relevant experience</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Strong market fit</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Meeting scheduled</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full" 
                    onClick={() => handlePurchase("price_1SR6dHBDqaZSMCzw0Zz52Xar", "Qualified Candidate")}
                    disabled={loading === "price_1SR6dHBDqaZSMCzw0Zz52Xar"}
                  >
                    {loading === "price_1SR6dHBDqaZSMCzw0Zz52Xar" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Purchase Now"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all">
                <CardHeader className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">$500</div>
                  <CardTitle>Premium Candidate</CardTitle>
                  <CardDescription>With Appointment</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Top-tier producer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Proven track record</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Competitive profile</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Meeting confirmed</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full" 
                    onClick={() => handlePurchase("price_1SR6dkBDqaZSMCzwLNhxMHom", "Premium Candidate")}
                    disabled={loading === "price_1SR6dkBDqaZSMCzwLNhxMHom"}
                  >
                    {loading === "price_1SR6dkBDqaZSMCzwLNhxMHom" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Purchase Now"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Why Our Pricing Works</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Performance-Based</h3>
                  <p className="text-muted-foreground text-sm">
                    You only pay for results. No upfront fees, no retainers—just quality candidates.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
                  <p className="text-muted-foreground text-sm">
                    Every candidate is vetted and qualified before you're charged. No spam, no time-wasters.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <UserCheck className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Fair & Transparent</h3>
                  <p className="text-muted-foreground text-sm">
                    Clear pricing tiers based on value delivered. You know exactly what you're paying for.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20">
              <CardContent className="pt-8 pb-8">
                <h2 className="text-3xl font-bold mb-4">Ready to Start Recruiting?</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Join hundreds of brokerages finding top talent with performance-based pricing
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    onClick={() => navigate("/apply")}
                    className="text-lg"
                  >
                    Get Started
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate("/auth")}
                    className="text-lg"
                  >
                    Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
