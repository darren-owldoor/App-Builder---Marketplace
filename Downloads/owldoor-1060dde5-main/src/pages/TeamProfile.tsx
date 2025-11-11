import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { Star, MapPin, Users, TrendingUp, Mail, Phone, Globe, Share2, Zap, Award, GraduationCap, BarChart, Handshake, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import owlDoorLogo from "@/assets/owldoor-logo-new.png";

const TeamProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setClientData(data);
    } catch (error) {
      console.error("Error fetching client data:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/company/${clientData?.id}`;
    if (navigator.share) {
      await navigator.share({ title: clientData?.company_name, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/client-dashboard")}>
              <img src={owlDoorLogo} alt="OwlDoor" className="h-10" />
            </div>
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 rounded-2xl bg-card flex items-center justify-center text-primary font-bold text-3xl border-4 border-primary-foreground shadow-xl">
              {clientData?.company_name?.substring(0, 2).toUpperCase() || 'TR'}
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{clientData?.company_name || 'Your Team'}</h1>
              <Badge variant="secondary" className="mb-2">Real Estate Brokerage</Badge>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{clientData?.states?.[0] || 'California'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            <span>{clientData?.team_size || 1} Team Member{(clientData?.team_size || 1) > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ratings Section */}
            <Card>
              <CardHeader>
                <CardTitle>Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center pb-6 border-b">
                  <div className="text-5xl font-bold mb-2">4.7</div>
                  <div className="flex justify-center mb-2">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Based on 24 reviews</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Commission Splits', score: 4.5 },
                    { label: 'Leadership', score: 4.8 },
                    { label: 'Training & Support', score: 4.4 },
                    { label: 'Lead Quality', score: 4.2 },
                    { label: 'Culture & Values', score: 4.6 },
                    { label: 'Work/Life Balance', score: 4.3 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-lg font-bold">{item.score}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">86%</div>
                    <div className="text-sm text-muted-foreground">Would Recommend</div>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">95%</div>
                    <div className="text-sm text-muted-foreground">Leadership Approval</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What We Offer */}
            <Card>
              <CardHeader>
                <CardTitle>What We Offer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold">Commission Split</h4>
                    </div>
                    <p className="text-2xl font-bold">80/20</p>
                    <p className="text-sm text-muted-foreground">One of the highest splits in the industry with low caps</p>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold">Qualified Leads</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Pre-qualified buyer and seller leads delivered monthly to help you grow your business.</p>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold">Weekly Training</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Industry experts teach proven strategies every week to sharpen your skills.</p>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold">Premium Tech Stack</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Access to best-in-class CRM, marketing automation, and transaction management tools.</p>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold">Marketing Support</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Professional photography, video tours, social media content, and branded materials.</p>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Handshake className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold">Transaction Coordinator</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Dedicated TC to handle paperwork so you can focus on closing more deals.</p>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold">Team Culture</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Collaborative environment with monthly team events and peer mentorship.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Reviews */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Agent Reviews</CardTitle>
                <Button variant="outline" size="sm">View All Reviews</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { initials: 'JD', rating: 5, time: '2 years with team', review: 'Best decision I ever made! The leads are high quality, the training is phenomenal, and the leadership genuinely cares about your success. I\'ve tripled my production since joining.', date: '3 weeks ago' },
                  { initials: 'MR', rating: 4, time: '6 months with team', review: 'Great culture and excellent support system. The commission split is very competitive. Only wish there were more advanced training options for experienced agents.', date: '1 month ago' },
                  { initials: 'SK', rating: 5, time: '1 year with team', review: 'The tech stack alone is worth joining. Everything is streamlined and professional. Leadership is responsive and always looking for ways to help us succeed.', date: '2 months ago' },
                ].map((review, idx) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                          {review.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">Current Agent</Badge>
                            <div className="flex">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{review.time}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <p className="text-sm">{review.review}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Coverage Areas */}
            <Card>
              <CardHeader>
                <CardTitle>Coverage Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="font-semibold mb-3">Cities We Serve</h4>
                  <div className="flex flex-wrap gap-2">
                    {(clientData?.cities || ['Agoura Hills', 'Calabasas', 'Camarillo', 'Canoga Park', 'Encino']).map((city: string) => (
                      <Badge key={city} variant="secondary">{city}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <CardContent className="pt-6 text-center">
                <h3 className="text-2xl font-bold mb-2">Ready to Join?</h3>
                <p className="mb-6 opacity-90">Take the next step in your real estate career with a team that invests in your success</p>
                <Button size="lg" className="bg-card text-foreground hover:bg-card/90">Apply Now</Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Sales</span>
                  <span className="text-lg font-bold">${((clientData?.yearly_sales || 10000000) / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg. Sale Price</span>
                  <span className="text-lg font-bold">${((clientData?.avg_sale || 1200000) / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Experience</span>
                  <span className="text-lg font-bold">{clientData?.years_experience || 2} Years</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Team Size</span>
                  <span className="text-lg font-bold">{clientData?.team_size || 1} Member{(clientData?.team_size || 1) > 1 ? 's' : ''}</span>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2" 
                  onClick={() => { if (clientData?.email) window.location.href = `mailto:${clientData.email}` }}
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2" 
                  onClick={() => { if (clientData?.phone) window.location.href = `tel:${clientData.phone}` }}
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </Button>
                {clientData?.website_url && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2" 
                    onClick={() => window.open(clientData.website_url, '_blank')}
                  >
                    <Globe className="w-4 h-4" />
                    Visit Website
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamProfile;
