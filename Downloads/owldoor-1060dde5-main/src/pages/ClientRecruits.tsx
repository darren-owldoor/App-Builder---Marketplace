import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { LogOut, Search, MapPin, TrendingUp, Briefcase, Phone, Mail, Clock, CheckCircle, ArrowUpRight, MessageSquare, User, Eye, DollarSign, Lock, Star, Percent, Loader2, CreditCard } from "lucide-react";
import owlDoorLogo from "@/assets/owldoor-logo-new.png";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProDetailModal } from "@/components/client/ProDetailModal";
import { formatNumber } from "@/lib/utils";
import { RecruitDetailModal } from "@/components/client/RecruitDetailModal";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface Lead {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string | null;
  phone: string | null;
  pipeline_stage: string;
  qualification_score: number;
  company?: string | null;
  brokerage?: string | null;
  cities?: string[] | null;
  states?: string[] | null;
  status: string;
  source?: string | null;
  total_sales?: number | null;
  transactions?: number | null;
  experience?: number | null;
  skills?: string[] | null;
  wants?: string[] | null;
  motivation?: number | null;
  image_url?: string | null;
  purchased_client?: string | null;
  user_id?: string | null;
  purchased?: boolean;
  match_id?: string;
  pricing_tier?: 'basic' | 'qualified' | 'premium';
}

const ClientRecruits = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("match");
  const [selectedPro, setSelectedPro] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const [minTransactions, setMinTransactions] = useState(0);
  const [minMatchRating, setMinMatchRating] = useState(0);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const calculatePricingTier = (lead: Lead): { tier: 'basic' | 'qualified' | 'premium', price: number, label: string } => {
    const transactions = lead.transactions || 0;
    const experience = lead.experience || 0;
    const qualificationScore = lead.qualification_score || 0;

    if (transactions >= 30 && experience >= 10 && qualificationScore >= 80) {
      return { tier: 'premium', price: 500, label: 'Premium Candidate' };
    } else if (transactions >= 15 && experience >= 5 && qualificationScore >= 60) {
      return { tier: 'qualified', price: 300, label: 'Qualified Candidate' };
    } else {
      return { tier: 'basic', price: 200, label: 'Basic Lead' };
    }
  };

  const handlePurchaseRecruit = async (lead: Lead) => {
    if (!lead.match_id) {
      toast({
        title: "Error",
        description: "Match ID not found",
        variant: "destructive",
      });
      return;
    }

    setPurchasingId(lead.id);

    try {
      const { data, error } = await supabase.functions.invoke("purchase-recruit", {
        body: {
          recruit_id: lead.id,
          match_id: lead.match_id,
        },
      });

      if (error) {
        // Check if error is about missing payment method
        if (error.message?.includes("payment method")) {
          toast({
            title: "Payment Method Required",
            description: "Please add a payment method in your billing settings first.",
            variant: "destructive",
          });
          navigate("/client-billing");
          return;
        }
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Purchase Successful!",
          description: `You now have access to ${data.recruit_name}. The full contact details are now visible.`,
        });
        
        // Reload the recruits to show purchased status
        fetchLeads();
      } else if (data?.url) {
        window.open(data.url, "_blank");
        const pricingInfo = calculatePricingTier(lead);
        toast({
          title: "Redirecting to Checkout",
          description: `Opening checkout for ${pricingInfo.label} - $${pricingInfo.price}`,
        });
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setPurchasingId(null);
    }
  };

  useEffect(() => {
    verifyClientRole();
    fetchLeads();
  }, []);

  const verifyClientRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["client", "admin"]);

    if (!roleData || roleData.length === 0) {
      const { data: clientData } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (!clientData) {
        toast({
          title: "Access Denied",
          description: "You do not have permission to access this page.",
          variant: "destructive",
        });
        navigate("/");
      }
    }
  };

  const fetchLeads = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: fetchedClientData } = await supabase
        .from("clients")
        .select("id, has_payment_method, credits_balance")
        .eq("user_id", userData.user.id)
        .single();

      if (!fetchedClientData) return;
      
      setClientId(fetchedClientData.id);
      setClientData(fetchedClientData);
      setHasPaymentMethod(fetchedClientData.has_payment_method || false);
      
      // If client has credits, all recruits are unlocked
      const hasCredits = (fetchedClientData.credits_balance || 0) > 0;

      // Fetch matches for this client
      const { data: matchesData, error: matchError } = await supabase
        .from("matches")
        .select("id, pro_id, purchased, pricing_tier, cost, match_score")
        .eq("client_id", fetchedClientData.id);

      if (matchError) throw matchError;

      if (!matchesData || matchesData.length === 0) {
        setLeads([]);
        return;
      }

      // Fetch pros data for matched pro_ids
      const proIds = matchesData.map(m => m.pro_id);
      const { data: prosData, error: prosError } = await supabase
        .from("pros")
        .select("*")
        .in("id", proIds);

      if (prosError) throw prosError;

      // Combine matches with pros data
      const leadsData = matchesData.map((match: any) => {
        const pro = prosData?.find(p => p.id === match.pro_id);
        return {
          ...pro,
          // Show as purchased if client has credits OR if actually purchased
          purchased: hasCredits || match.purchased || false,
          match_id: match.id,
          pricing_tier: match.pricing_tier,
          qualification_score: match.match_score,
        };
      }).filter(lead => lead.id); // Filter out any matches without corresponding pro data
      
      setLeads(leadsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'active': { label: 'Accepted', className: 'bg-[#35a87e] text-white hover:bg-[#35a87e]/90' },
      'pending': { label: 'Pending', className: 'bg-amber-500 text-white hover:bg-amber-500/90' },
      'rejected': { label: 'Rejected', className: 'bg-slate-400 text-white hover:bg-slate-400/90' },
    };
    const config = statusMap[status] || { label: status, className: 'bg-slate-100 text-slate-700' };
    return <Badge className={`${config.className} px-3 py-1`}><CheckCircle className="h-3 w-3 mr-1" />{config.label}</Badge>;
  };

  const getMotivationIndicator = (score: number) => {
    if (score >= 80) return { label: 'High Motivation', color: 'text-[#35a87e]', dot: 'bg-[#35a87e]' };
    if (score >= 50) return { label: 'Medium Motivation', color: 'text-amber-500', dot: 'bg-amber-500' };
    return { label: 'Low Motivation', color: 'text-slate-400', dot: 'bg-slate-400' };
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === "" || 
      lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesLocation = locationFilter === "all" || 
      lead.cities?.some(city => city.toLowerCase().includes(locationFilter.toLowerCase()));
    
    const matchesTransactions = (lead.transactions || 0) >= minTransactions;
    const matchesRating = (lead.qualification_score || 0) >= (minMatchRating * 20); // Convert 0-5 to 0-100
    
    return matchesSearch && matchesStatus && matchesLocation && matchesTransactions && matchesRating;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/office">
            <img src={owlDoorLogo} alt="OwlDoor" className="h-10 cursor-pointer hover:opacity-80 transition-opacity" />
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/office")}>
              Dashboard
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Low Credits Warning - Only show if no credits */}
        {(!clientData?.credits_balance || clientData.credits_balance <= 0) && (
          <Card className="mb-6 border-red-500/50 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Lock className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                    🔒 Recruits Locked - No Credits Available
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                    You need credits to view recruit details. Contact your account manager to add credits to your account. Once you have credits, all recruits will be automatically unlocked.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/client-billing")}
                    className="border-red-600 text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    View Billing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters Card */}
        <Card className="mb-6 p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Minimum Transactions Filter */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Percent className="h-4 w-4 text-primary" />
                  Minimum Transactions
                </Label>
                <Badge variant="outline" className="text-primary font-bold">
                  {minTransactions}
                </Badge>
              </div>
              <Slider
                value={[minTransactions]}
                onValueChange={(value) => setMinTransactions(value[0])}
                max={10}
                step={1}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>10</span>
              </div>
            </div>

            {/* Minimum Match Rating Filter */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Star className="h-4 w-4 text-amber-500" />
                  Minimum Match Rating
                </Label>
                <Badge variant="outline" className="text-amber-500 font-bold">
                  {minMatchRating > 0 ? `${minMatchRating}.0+` : 'Any'} ⭐
                </Badge>
              </div>
              <Slider
                value={[minMatchRating]}
                onValueChange={(value) => setMinMatchRating(value[0])}
                max={5}
                step={0.5}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Any</span>
                <span>5 Stars</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recruits by location, experience, or specialties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Header */}
        <Card className="mb-6 bg-gradient-to-r from-primary/5 via-background to-background">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">Matched Agents</h1>
              <Badge variant="secondary" className="text-base px-3 py-1">
                {filteredLeads.length} agent{filteredLeads.length !== 1 ? 's' : ''} found
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Ranked by expertise, matching & transactions %
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading your recruits...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredLeads.map((lead, index) => {
              const motivation = getMotivationIndicator(lead.motivation || 75);
              const matchScore = lead.qualification_score || 85;
              const isTopMatch = index < 3;
              const pricingInfo = calculatePricingTier(lead);
              
              return (
                <Card key={lead.id} className={`overflow-hidden hover:shadow-lg transition-all ${isTopMatch ? 'border-2 border-primary/30' : ''}`}>
                  <div className="p-6">
                    <div className="flex gap-6">
                      {/* Avatar with Privacy Overlay */}
                      <div className="relative">
                        {!lead.purchased && (
                          <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Lock className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <Avatar className="h-16 w-16 bg-primary text-primary-foreground text-xl font-bold">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {lead.purchased ? getInitials(lead.full_name) : '?'}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1">
                        {/* Header Row */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {isTopMatch && (
                                <Badge className={`${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-500' : 'bg-slate-400'} text-white px-3 py-1 text-sm font-bold`}>
                                  #{index + 1} Top Match
                                </Badge>
                              )}
                              <h3 className={`text-xl font-bold ${!lead.purchased ? 'blur-sm select-none' : ''}`}>
                                {lead.purchased ? lead.full_name : '████ ████████'}
                              </h3>
                              {!lead.purchased && (
                                <Badge variant="outline" className="border-amber-500 text-amber-500">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Locked
                                </Badge>
                              )}
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < Math.floor(matchScore / 20) ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`} 
                                  />
                                ))}
                                <span className="ml-1 font-semibold text-sm">{(matchScore / 20).toFixed(1)}</span>
                                <span className="ml-2 text-primary font-semibold">{matchScore}% Match!</span>
                              </div>
                            </div>
                            <p className={`text-muted-foreground ${!lead.purchased ? 'blur-sm select-none' : ''}`}>
                              {lead.purchased ? (lead.brokerage || 'Independent Agent') : '████████ ███████'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground mb-1">Cost</div>
                            <div className="text-2xl font-bold text-primary">${pricingInfo.price}</div>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {pricingInfo.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <Card className="p-3 bg-primary/5 border-primary/20">
                            <div className="text-xs text-muted-foreground mb-1">Yearly Sales</div>
                            <div className="text-2xl font-bold text-primary">{lead.transactions || 40}</div>
                          </Card>
                          <Card className="p-3 bg-muted/50">
                            <div className="text-xs text-muted-foreground mb-1">Experience</div>
                            <div className="text-2xl font-bold">{lead.experience || 15}y</div>
                          </Card>
                        </div>

                        {/* Service Areas */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                            <MapPin className="h-4 w-4" />
                            SERVICE AREAS
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {lead.cities?.slice(0, 3).map((city, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary">
                                {city} 📍
                              </Badge>
                            ))}
                            {lead.cities && lead.cities.length > 3 && (
                              <Badge variant="outline">+{lead.cities.length - 3} more</Badge>
                            )}
                          </div>
                        </div>

                        {/* Specialties */}
                        {lead.skills && lead.skills.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm font-semibold text-muted-foreground mb-2">SPECIALTIES</div>
                            <div className="flex flex-wrap gap-2">
                              {lead.skills.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="bg-background">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Wants */}
                        {lead.wants && lead.wants.length > 0 && (
                          <div className="p-3 bg-muted/30 rounded-lg border">
                            <div className="text-xs font-semibold text-muted-foreground mb-1">
                              Wants:
                            </div>
                            <div className="text-sm">
                              {lead.wants.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions Column */}
                      <div className="flex flex-col gap-3 min-w-[200px]">
                        {lead.purchased ? (
                          <>
                            <Button 
                              className="w-full bg-primary hover:bg-primary/90"
                              onClick={() => {
                                setSelectedPro(lead);
                                setIsModalOpen(true);
                              }}
                            >
                              View Full Profile
                            </Button>
                            <Button 
                              variant="outline"
                              size="icon"
                              className="w-full"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                              onClick={() => handlePurchaseRecruit(lead)}
                              disabled={purchasingId === lead.id}
                            >
                              {purchasingId === lead.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Purchase for ${pricingInfo.price}
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="outline"
                              size="icon"
                              className="w-full"
                              disabled
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <div className="text-xs text-center text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                              <Lock className="h-3 w-3 inline mr-1" />
                              Purchase to unlock contact
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {filteredLeads.length === 0 && (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No recruits found</p>
                  <p className="text-sm mt-2">Try adjusting your filters or search terms</p>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <ProDetailModal
        pro={selectedPro}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        clientId={clientId}
      />
    </div>
  );
};

export default ClientRecruits;
