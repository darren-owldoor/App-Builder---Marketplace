import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { 
  LogOut, 
  Settings, 
  MapPin, 
  DollarSign, 
  Users, 
  TrendingUp,
  Bot,
  CreditCard,
  Phone,
  Mail,
  Building2,
  Target,
  Info,
  Plus,
  Eye,
  Home,
  Briefcase
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import owlDoorLogo from "@/assets/owldoor-icon-green.png";
import { PasswordChangeModal } from "@/components/client/PasswordChangeModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ButtonOnboarding } from "@/components/client/ButtonOnboarding";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentMethodManager } from "@/components/client/PaymentMethodManager";
import { BidCreationModal } from "@/components/client/BidCreationModal";
import { RecruitDetailModal } from "@/components/client/RecruitDetailModal";
import { AllRecruitsModal } from "@/components/client/AllRecruitsModal";
import { InteractiveProfileCompletion } from "@/components/client/InteractiveProfileCompletion";
import { DetailedRecruitsList } from "@/components/client/DetailedRecruitsList";
import { CardLayoutBuilder } from "@/components/ai-recruiter/CardLayoutBuilder";
import { MessageSquare } from "lucide-react";
import { ClientProfileOverview } from "@/components/client/ClientProfileOverview";

interface Match {
  id: string;
  status: string;
  match_score: number;
  created_at: string;
  cost?: number;
  pricing_tier?: string;
  pros: {
    full_name: string;
    email: string;
    phone: string;
    cities: string[] | null;
    states: string[] | null;
    qualification_score: number;
    pro_type: string;
    total_volume_12mo?: number;
    transactions_12mo?: number;
    experience?: number;
    brokerage?: string;
    wants?: string[];
  };
}

interface Bid {
  id: string;
  bid_amount: number;
  max_leads_per_month: number;
  active: boolean;
  cities: string[] | null;
  states: string[] | null;
  zip_codes: string[] | null;
  min_experience: number;
  min_transactions: number;
}

interface MarketCoverage {
  id: string;
  coverage_type: string;
  name: string;
  data: any;
}

const ClientDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [coverages, setCoverages] = useState<MarketCoverage[]>([]);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showButtonOnboarding, setShowButtonOnboarding] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showRecruitDetail, setShowRecruitDetail] = useState(false);
  const [showAllRecruits, setShowAllRecruits] = useState(false);
  const [selectedRecruit, setSelectedRecruit] = useState<Match | null>(null);
  const [biddingEnabled, setBiddingEnabled] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(60);
  const [cardBuilderOpen, setCardBuilderOpen] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has client role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["client", "admin"]);

      if (!roleData || roleData.length === 0) {
        const { data: clientCheck } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (!clientCheck) {
          toast({
            title: "Access Denied",
            description: "You do not have permission to access this page.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
      }

      // Fetch client data
      const { data: client } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!client) {
        navigate("/auth");
        return;
      }

      setClientId(client.id);
      setClientData(client);

      // Calculate profile completion
      const calculateCompletion = () => {
        const fields = [
          client.company_name,
          client.email,
          client.phone,
          client.contact_name,
          client.provides
        ];
        const filledFields = fields.filter(f => f && f !== '').length;
        return Math.round((filledFields / fields.length) * 100);
      };
      setProfileCompletion(calculateCompletion());

      // Check password change requirement
      if (client.password_change_required) {
        setShowPasswordChange(true);
        setLoading(false);
        return;
      }

      // Skip onboarding checks - go straight to dashboard

      // Fetch all data in parallel
      await Promise.all([
        fetchMatches(client.id),
        fetchBids(client.id),
        fetchCoverages(user.id),
        checkPaymentMethod(),
        checkBiddingEnabled()
      ]);

    } catch (error: any) {
      console.error("Dashboard initialization error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async (clientId: string) => {
    const { data, error } = await supabase
      .from("matches")
      .select(`
        *,
        pros:pro_id (
          full_name,
          email,
          phone,
          cities,
          states,
          qualification_score,
          pro_type,
          total_volume_12mo,
          transactions_12mo,
          experience,
          brokerage
        )
      `)
      .eq("client_id", clientId)
      .order("match_score", { ascending: false });

    if (!error && data) {
      setMatches(data);
    }
  };

  const fetchBids = async (clientId: string) => {
    const { data, error } = await supabase
      .from("bids")
      .select("*")
      .eq("client_id", clientId)
      .eq("active", true);

    if (!error && data) {
      setBids(data);
    }
  };

  const fetchCoverages = async (userId: string) => {
    const { data, error } = await supabase
      .from("market_coverage")
      .select("*")
      .eq("user_id", userId);

    if (!error && data) {
      setCoverages(data);
    }
  };

  const checkPaymentMethod = async () => {
    try {
      setCheckingPayment(true);
      const { data, error } = await supabase.functions.invoke("check-payment-method");
      
      if (!error && data) {
        setHasPaymentMethod(data.has_payment_method || false);
      }
    } catch (error) {
      console.error("Error checking payment method:", error);
    } finally {
      setCheckingPayment(false);
    }
  };

  const checkBiddingEnabled = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "bidding_enabled")
        .single();
      
      if (!error && data) {
        setBiddingEnabled(data.setting_value === true || data.setting_value === 'true');
      }
    } catch (error) {
      console.error("Error checking bidding status:", error);
      setBiddingEnabled(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handlePasswordChanged = () => {
    setShowPasswordChange(false);
    initializeDashboard();
  };

  // Show password change modal if required
  if (showPasswordChange && clientData?.password_change_required) {
    return (
      <PasswordChangeModal 
        open={showPasswordChange}
        onOpenChange={(open) => !open && handlePasswordChanged()}
        requiresChange={true}
        currentPassword={clientData?.password}
      />
    );
  }

  // AI onboarding removed - clients go straight to dashboard

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show 4-8 recruits based on how many we have
  const recentMatches = matches.slice(0, Math.min(8, Math.max(4, matches.length)));
  const totalCredits = clientData?.credits_balance || 0;
  const creditsUsed = clientData?.credits_used || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white dark:bg-card sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to="/office">
                <img src={owlDoorLogo} alt="OwlDoor" className="h-10 cursor-pointer hover:opacity-80 transition-opacity" />
              </Link>
            
            <Button variant="ghost" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Top Section - 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Column - Avatar & Welcome */}
          <div className="lg:col-span-3 space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-primary/20">
                  <AvatarImage src={clientData?.image_url} alt={clientData?.contact_name} />
                  <AvatarFallback className="text-3xl font-bold bg-muted text-foreground">
                    {`${clientData?.first_name?.[0] || ''}${clientData?.last_name?.[0] || ''}`.toUpperCase() || 
                     clientData?.company_name?.substring(0, 2).toUpperCase() || 'CL'}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Plus className="h-8 w-8 text-white" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) throw new Error("Not authenticated");
                        const fileExt = file.name.split('.').pop();
                        const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;
                        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
                        if (uploadError) throw uploadError;
                        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                        await supabase.from("clients").update({ image_url: publicUrl }).eq("id", clientData.id);
                        toast({ title: "Success", description: "Profile picture updated" });
                        initializeDashboard();
                      } catch (error) {
                        toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
                      }
                    }}
                  />
                </label>
              </div>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => document.getElementById('avatar-upload')?.click()}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
            </div>

            {/* Welcome Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">
                Welcome back,<br />
                {clientData?.contact_name || clientData?.company_name}!
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your recruits, billing, and settings
              </p>
            </div>

            {/* Payment Warning */}
            {!checkingPayment && !hasPaymentMethod && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <span className="font-semibold">Missing</span> Credit Card. Add Now To Activate Account
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Middle Column - Profile Completion */}
          <div className="lg:col-span-5">
            <Card className="bg-primary text-primary-foreground border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold">Let's Complete Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm opacity-95">Your profile is {profileCompletion}% complete</p>
                    <span className="text-3xl font-bold">{profileCompletion}%</span>
                  </div>
                  <Progress value={profileCompletion} className="h-2 bg-white/30" />
                </div>

                <div>
                  <p className="text-sm font-semibold opacity-90 mb-2">What skills/services do you provide?</p>
                  <p className="text-xs opacity-80 mb-3">Select all that apply:</p>
                  
                  <div className="bg-white/15 rounded-xl p-4 mb-4">
                    <InteractiveProfileCompletion 
                      clientId={clientId!} 
                      completion={profileCompletion}
                      onUpdate={() => initializeDashboard()}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Your Profile */}
          <div className="lg:col-span-4">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Your Profile</CardTitle>
                <p className="text-xs text-muted-foreground">Account information</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{clientData?.company || clientData?.brokerage || 'Not Set'}</div>
                    <div className="text-xs text-muted-foreground">Company</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{clientData?.email}</div>
                    <div className="text-xs text-muted-foreground">Email</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{clientData?.phone || 'Not Set'}</div>
                    <div className="text-xs text-muted-foreground">Phone</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Target className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {clientData?.client_type === 'real_estate' ? 'Real Estate' : 
                       clientData?.client_type === 'mortgage' ? 'Mortgage' : 'Client'}
                    </div>
                    <div className="text-xs text-muted-foreground">Account Type</div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate("/client-profile")}
                >
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Row - 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium">Credits Balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">${totalCredits.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ${creditsUsed.toFixed(2)} spent • Auto-refills $200 every $200
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium">Purchased Recruits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {matches.filter(m => {
                  const hasCredits = (clientData?.credits_balance || 0) > 0;
                  return m.status === 'purchased' || hasCredits;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">In your network</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-medium">Month Spend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground mt-1">Max: $10000</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full bg-muted/50 p-1 grid grid-cols-8 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="recruits" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">
                Recruits ({matches.filter(m => {
                  const hasCredits = (clientData?.credits_balance || 0) > 0;
                  return m.status !== 'purchased' && !hasCredits;
                }).length})
              </span>
              <span className="sm:hidden">
                ({matches.filter(m => {
                  const hasCredits = (clientData?.credits_balance || 0) > 0;
                  return m.status !== 'purchased' && !hasCredits;
                }).length})
              </span>
            </TabsTrigger>
            <TabsTrigger value="purchased" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">
                Purchased ({matches.filter(m => {
                  const hasCredits = (clientData?.credits_balance || 0) > 0;
                  return m.status === 'purchased' || hasCredits;
                }).length})
              </span>
              <span className="sm:hidden">
                ({matches.filter(m => {
                  const hasCredits = (clientData?.credits_balance || 0) > 0;
                  return m.status === 'purchased' || hasCredits;
                }).length})
              </span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="coverage" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Coverage</span>
            </TabsTrigger>
            {biddingEnabled && (
              <TabsTrigger value="bids" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Bids</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Recent Recruits */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Recruits</CardTitle>
                <CardDescription>Your latest 8 recruit matches</CardDescription>
              </CardHeader>
              <CardContent>
                {recentMatches.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recruits yet. Set up your bids and locations to start matching!</p>
                  </div>
                 ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentMatches.map((match) => {
                      // Show as purchased if client has credits OR if actually purchased
                      const hasCredits = (clientData?.credits_balance || 0) > 0;
                      const isPurchased = match.status === 'purchased' || hasCredits;
                      const cost = match.cost || 
                        (match.pricing_tier === 'premium' ? 500 : 
                         match.pricing_tier === 'qualified' ? 300 : 200);
                      
                      return (
                        <Card key={match.id} className={`border-2 ${isPurchased ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-300'}`}>
                          <CardContent className="pt-6">
                            {isPurchased && (
                              <Badge className="mb-3 bg-emerald-500 text-white">
                                ✓ Purchased
                              </Badge>
                            )}
                            
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isPurchased ? 'bg-emerald-600' : 'bg-emerald-100'}`}>
                                    <div className="text-center">
                                      <div className={`text-lg font-bold ${isPurchased ? 'text-white' : 'text-emerald-700'}`}>
                                        {match.match_score}/10
                                      </div>
                                      <div className={`text-xs ${isPurchased ? 'text-emerald-100' : 'text-emerald-600'}`}>
                                        Match
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <div className="font-bold flex items-center gap-2">
                                    {isPurchased ? (
                                      match.pros.full_name || 'No Name'
                                    ) : (
                                      <>🔒 Name Hidden</>
                                    )}
                                    <Badge variant="secondary" className={isPurchased ? "bg-emerald-600 text-white" : "bg-emerald-500 text-white"}>
                                      {match.match_score}% Match
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {isPurchased ? (
                                      match.pros.brokerage || 'Independent Agent'
                                    ) : (
                                      '🔒 Purchase to Unlock Full Details'
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3 mb-4">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span>Email</span>
                                </div>
                                <div className={isPurchased ? "truncate font-medium" : "text-muted-foreground"}>
                                  {isPurchased ? match.pros.email || 'N/A' : '🔒 Hidden'}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span>Phone</span>
                                </div>
                                <div className={isPurchased ? "font-medium" : "text-muted-foreground"}>
                                  {isPurchased ? match.pros.phone || 'N/A' : '🔒 Hidden'}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>Location</span>
                                </div>
                                <div className="text-muted-foreground">
                                  {match.pros.cities?.[0] || 'N/A'}, {match.pros.states?.[0] || 'TX'}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-muted-foreground" />
                                  <span>Qualification</span>
                                </div>
                                <div className="text-muted-foreground">{match.pros.qualification_score || 60}%</div>
                              </div>

                              {match.pros.wants && match.pros.wants.length > 0 && (
                                <div className="border-t pt-3">
                                  <div className="font-semibold text-sm mb-2">Wants What You Provide:</div>
                                  <div className="text-sm text-muted-foreground">
                                    {match.pros.wants.join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              {!isPurchased && (
                                <>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      🔒 <strong>Unlock Full Profile: ${cost}</strong>
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {match.pricing_tier || 'basic'} tier • Includes Name, Email, Phone, Brokerage & Full Details
                                  </div>
                                </>
                              )}
                              
                              <Button 
                                className={`w-full ${isPurchased ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600'} text-white`}
                                onClick={() => {
                                  setSelectedRecruit(match);
                                  setShowRecruitDetail(true);
                                }}
                              >
                                {isPurchased ? 'View Full Profile' : (hasPaymentMethod ? `Purchase for $${cost}` : 'Add Payment Method First')}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchased Tab */}
          <TabsContent value="purchased" className="space-y-6">
            <DetailedRecruitsList 
              matches={matches.filter(m => {
                const hasCredits = (clientData?.credits_balance || 0) > 0;
                return m.status === 'purchased' || hasCredits;
              })}
              clientId={clientId || undefined}
              onOpenCardBuilder={() => setCardBuilderOpen(true)}
            />
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Payment</CardTitle>
                <CardDescription>Manage your payment methods and billing settings</CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentMethodManager 
                  hasPaymentMethod={hasPaymentMethod}
                  onUpdate={() => checkPaymentMethod()}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coverage Tab */}
          <TabsContent value="coverage" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>About Market Coverage</AlertTitle>
              <AlertDescription>
                Market coverage defines where you want to find and match with professionals.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Your Market Coverage Areas</CardTitle>
                <CardDescription>
                  Manage the geographic areas where you recruit professionals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {coverages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No market coverage areas set up yet</p>
                    <Button className="mt-4" onClick={() => navigate("/location-tool")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Coverage Area
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {coverages.map((coverage) => (
                      <div key={coverage.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">{coverage.name}</div>
                            <div className="text-sm text-muted-foreground">{coverage.coverage_type}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={() => navigate("/location-tool")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Coverage Area
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
                <CardDescription>Coming soon - message your recruits directly</CardDescription>
              </CardHeader>
              <CardContent className="py-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Messaging feature coming soon!</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bids Tab */}
          <TabsContent value="bids" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>About Auto-Purchase Bids</AlertTitle>
              <AlertDescription>
                Bids allow you to automatically purchase and match with professionals who meet your criteria:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>Set Your Budget:</strong> Define how much you're willing to pay per recruit</li>
                  <li><strong>Filter Criteria:</strong> Specify experience, transactions, locations, and more</li>
                  <li><strong>Auto-Matching:</strong> Professionals matching your criteria are automatically purchased</li>
                  <li><strong>Monthly Limits:</strong> Control spending with maximum leads per month settings</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Your Active Bids</CardTitle>
                <CardDescription>
                  Auto-purchase filters for recruiting professionals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bids.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No active bids</h3>
                    <p className="text-muted-foreground mb-6">
                      Create your first bid to start auto-purchasing recruits that match your criteria
                    </p>
                    <Button onClick={() => setShowBidModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Bid
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bids.map((bid) => (
                      <Card key={bid.id} className="border-2">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                ${bid.bid_amount} per recruit
                              </CardTitle>
                              <CardDescription>
                                Max {bid.max_leads_per_month} leads per month
                              </CardDescription>
                            </div>
                            <Badge variant={bid.active ? "default" : "secondary"}>
                              {bid.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {(bid.cities || bid.states || bid.zip_codes) && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {[
                                    ...(bid.cities || []),
                                    ...(bid.states || []),
                                    ...(bid.zip_codes || [])
                                  ].join(", ")}
                                </span>
                              </div>
                            )}
                            <div className="flex gap-4 text-sm">
                              {bid.min_experience > 0 && (
                                <div>Min Experience: {bid.min_experience} yrs</div>
                              )}
                              {bid.min_transactions > 0 && (
                                <div>Min Transactions: {bid.min_transactions}</div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button variant="outline" className="w-full" onClick={() => setShowBidModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Bid
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recruits Tab */}
          <TabsContent value="recruits" className="space-y-6">
            {matches.filter(m => {
              const hasCredits = (clientData?.credits_balance || 0) > 0;
              return m.status !== 'purchased' && !hasCredits;
            }).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {(clientData?.credits_balance || 0) > 0 
                      ? "All recruits are unlocked!" 
                      : "No available recruits"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {(clientData?.credits_balance || 0) > 0
                      ? "You have credits! All matched recruits are automatically unlocked. Check the 'Purchased' tab to see them."
                      : "Once you set up bids and locations, matched professionals will appear here"}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setActiveTab("coverage")}>
                      <MapPin className="h-4 w-4 mr-2" />
                      Add Locations
                    </Button>
                    {biddingEnabled && (
                      <Button onClick={() => setShowBidModal(true)}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Create Bid
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <DetailedRecruitsList 
                matches={matches.filter(m => {
                  const hasCredits = (clientData?.credits_balance || 0) > 0;
                  return m.status !== 'purchased' && !hasCredits;
                })} 
                clientId={clientId || undefined} 
              />
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="font-medium">Company Information</div>
                    <div className="text-sm text-muted-foreground">
                      <div><strong>Company:</strong> {clientData?.company_name || "Not set"}</div>
                      <div><strong>Contact:</strong> {clientData?.contact_name || "Not set"}</div>
                      <div><strong>Email:</strong> {clientData?.email || "Not set"}</div>
                      <div><strong>Phone:</strong> {clientData?.phone || "Not set"}</div>
                    </div>
                  </div>
                  
                  {/* AI Assistant button removed - feature disabled */}
                  
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/client-billing")}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing & Credits
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/client/recruits")}>
                    <Users className="h-4 w-4 mr-2" />
                    View All Recruits
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/client/conversations")}>
                    <Mail className="h-4 w-4 mr-2" />
                    View Conversations
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" onClick={() => setShowPasswordChange(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal 
        open={showPasswordChange && !clientData?.password_change_required}
        onOpenChange={(open) => setShowPasswordChange(open)}
        requiresChange={false}
      />

      {/* Button-Based Onboarding Modal */}
      <Dialog open={showButtonOnboarding} onOpenChange={setShowButtonOnboarding}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Quick Setup</DialogTitle>
          </DialogHeader>
          <ButtonOnboarding 
            onComplete={() => {
              setShowButtonOnboarding(false);
              setOnboardingComplete(true);
              initializeDashboard();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Bid Creation Modal */}
      {showBidModal && clientId && (
        <BidCreationModal
          open={showBidModal}
          onOpenChange={setShowBidModal}
          clientId={clientId}
          onSuccess={() => {
            initializeDashboard();
            setActiveTab("bids");
          }}
        />
      )}

      {/* Recruit Detail Modal */}
      {selectedRecruit && clientId && (
        <RecruitDetailModal
          open={showRecruitDetail}
          onOpenChange={setShowRecruitDetail}
          recruit={selectedRecruit}
          clientId={clientId}
        />
      )}

      {/* All Recruits Modal */}
      <AllRecruitsModal
        open={showAllRecruits}
        onOpenChange={setShowAllRecruits}
        recruits={matches}
        clientId={clientId}
      />

      {/* Card Layout Builder */}
      <CardLayoutBuilder
        open={cardBuilderOpen}
        onOpenChange={setCardBuilderOpen}
        clientId={clientId || ''}
        viewType="list"
      />
    </div>
  );
};

export default ClientDashboard;
