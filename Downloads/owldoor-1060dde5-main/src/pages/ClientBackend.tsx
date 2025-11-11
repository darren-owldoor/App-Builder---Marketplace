import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CreditCard, 
  Users, 
  Eye, 
  DollarSign, 
  Loader2,
  AlertCircle,
  Target,
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Home,
  Settings as SettingsIcon,
  Bot,
  LogOut,
  Save,
  Search,
} from "lucide-react";
import { PaymentMethodManager } from "@/components/client/PaymentMethodManager";
import { AutoChargeSettings } from "@/components/client/AutoChargeSettings";
import { MonthlyMaximumSettings } from "@/components/client/MonthlyMaximumSettings";
import { CreditPurchaseForm } from "@/components/client/CreditPurchaseForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BidFilterCard } from "@/components/client/BidFilterCard";
import { useToast } from "@/hooks/use-toast";
import { ClientAIChat } from "@/components/client/ClientAIChat";
import { DetailedRecruitCard } from "@/components/client/DetailedRecruitCard";
import { CRMLayout } from "@/components/layout/CRMLayout";
import owlDoorLogo from "@/assets/owldoor-logo-new.png";

interface ClientData {
  id: string;
  user_id: string;
  contact_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  company?: string;
  brokerage?: string;
  credits_balance: number;
  credits_used: number;
  current_month_spend: number;
  monthly_spend_maximum: number;
  has_payment_method: boolean;
  auto_charge_enabled: boolean;
  created_at: string;
  client_type: string;
  [key: string]: any; // Allow additional properties from DB
}

interface Match {
  id: string;
  created_at: string;
  match_score: number;
  purchased: boolean;
  cost: number;
  pricing_tier: string;
  pros: {
    full_name: string;
    email: string;
    phone: string;
    cities: string[];
    states: string[];
    brokerage: string;
    qualification_score: number;
  };
}

interface BidFilter {
  id: string;
  name: string;
  maxBid: number;
  maxWeeklySpend: number;
  currentSpend: number;
  filters: {
    minTransactions?: number;
    maxTransactions?: number;
    minExperience?: number;
    locations?: string[];
    fullPartTime?: 'full' | 'part' | 'both';
    motivationMin?: number;
    targetBrokerages?: string[];
    exclusive?: boolean;
  };
}

interface Conversation {
  id: string;
  message_content: string;
  message_type: string;
  created_at: string;
  pro_id?: string;
  sender_name?: string;
}

const ClientBackend = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [bidFilters, setBidFilters] = useState<BidFilter[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [coverageAreas, setCoverageAreas] = useState<any[]>([]);
  const [zipRadiusInput, setZipRadiusInput] = useState({ centerZip: '', radius: '25' });
  const [loadingZipRadius, setLoadingZipRadius] = useState(false);
  const [zipRadiusResults, setZipRadiusResults] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load client data
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (clientError) throw clientError;
      setClientData(client);

      // Load matches
      const { data: matchData } = await supabase
        .from("matches")
        .select(`
          *,
          pros:pro_id (
            full_name,
            email,
            phone,
            cities,
            states,
            brokerage,
            qualification_score
          )
        `)
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });

      setMatches(matchData || []);

      // Load conversations
      const { data: convData } = await supabase
        .from("conversations")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      setConversations(convData || []);

      // Load coverage areas
      const { data: coverageData } = await supabase
        .from("market_coverage")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false});

      setCoverageAreas(coverageData || []);

      // Mock bid filters for now
      setBidFilters([]);

    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFindZipsInRadius = async () => {
    setLoadingZipRadius(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-zip-radius', {
        body: { 
          centerZip: zipRadiusInput.centerZip,
          radiusMiles: parseInt(zipRadiusInput.radius)
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to find ZIP codes');

      setZipRadiusResults(data);
      toast({
        title: "Success",
        description: `Found ${data.zipsFound} ZIP codes`,
      });
    } catch (error: any) {
      console.error("Error finding ZIPs:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to find ZIP codes",
        variant: "destructive",
      });
    } finally {
      setLoadingZipRadius(false);
    }
  };

  const handleSaveZipRadiusCoverage = async () => {
    if (!zipRadiusResults) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        });
        return;
      }

      // Extract unique cities, states, and zip codes
      const uniqueZips = [...new Set(zipRadiusResults.results.map((r: any) => r.zipCode))];
      const uniqueCities = [...new Set(zipRadiusResults.results.map((r: any) => r.city))];
      const uniqueStates = [...new Set(zipRadiusResults.results.map((r: any) => r.state))];

      const { error } = await supabase
        .from("market_coverage")
        .insert([{
          user_id: user.id,
          name: `${zipRadiusResults.centerCity}, ${zipRadiusResults.centerState} (${zipRadiusResults.radiusMiles}mi)`,
          coverage_type: "radius",
          data: {
            centerZip: zipRadiusResults.centerZip,
            centerCity: zipRadiusResults.centerCity,
            centerState: zipRadiusResults.centerState,
            centerCoordinates: zipRadiusResults.centerCoordinates,
            radiusMiles: zipRadiusResults.radiusMiles,
            zipsFound: zipRadiusResults.zipsFound,
            zipCodes: Array.from(uniqueZips),
            cities: Array.from(uniqueCities),
            states: Array.from(uniqueStates),
            results: zipRadiusResults.results
          } as any
        }]);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Coverage area saved!",
      });
      setZipRadiusResults(null);
      setZipRadiusInput({ centerZip: '', radius: '25' });
      loadData();
    } catch (error: any) {
      console.error("Error saving coverage:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save coverage",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handlePurchaseRecruit = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from("matches")
        .update({ purchased: true })
        .eq("id", matchId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Recruit purchased successfully!",
      });
      loadData();
    } catch (error: any) {
      console.error("Error purchasing recruit:", error);
      toast({
        title: "Error",
        description: "Failed to purchase recruit",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBidFilter = (filter: BidFilter) => {
    setBidFilters(prev => prev.map(f => f.id === filter.id ? filter : f));
    toast({
      title: "Success",
      description: "Bid filter updated",
    });
  };

  const handleDeleteBidFilter = (id: string) => {
    setBidFilters(prev => prev.filter(f => f.id !== id));
    toast({
      title: "Success",
      description: "Bid filter deleted",
    });
  };

  const handleAddBidFilter = () => {
    const newFilter: BidFilter = {
      id: Date.now().toString(),
      name: 'New Bid Filter',
      maxBid: 300,
      maxWeeklySpend: 1000,
      currentSpend: 0,
      filters: {
        locations: [],
        fullPartTime: 'both'
      }
    };
    setBidFilters(prev => [...prev, newFilter]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>No client account found</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fix filter logic: available = not purchased, purchased = already purchased
  const availableMatches = matches.filter(m => !m.purchased);
  const purchasedMatches = matches.filter(m => m.purchased);
  
  // Get 4-8 most recent matches for dashboard overview
  const recentMatches = matches.slice(0, Math.min(8, Math.max(4, matches.length)));

  return (
    <CRMLayout 
      userEmail={clientData.email}
      userId={clientData.user_id.substring(0, 8)}
      companyName={clientData.company_name || clientData.company || clientData.brokerage}
      className="max-w-7xl mx-auto px-6 py-8"
    >
      <ClientAIChat />
      
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {clientData.contact_name}!
        </h1>
        <p className="text-muted-foreground">
          Manage your recruits, billing, and settings
        </p>
      </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Credits Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                ${typeof clientData.credits_balance === 'number' 
                  ? clientData.credits_balance.toFixed(2) 
                  : '0.00'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ${typeof clientData.credits_used === 'number' 
                  ? clientData.credits_used.toFixed(2) 
                  : '0.00'} spent • Auto-refills $200 every $200
              </p>
            </CardContent>
          </Card>

          {/* Available Recruits - HIDDEN */}
          {/* 
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Available Recruits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{availableMatches.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Ready to purchase</p>
            </CardContent>
          </Card>
          */}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Purchased Recruits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{purchasedMatches.length}</p>
              <p className="text-xs text-muted-foreground mt-1">In your network</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Month Spend</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${clientData.current_month_spend || clientData.monthly_spend || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Max: ${clientData.monthly_spend_maximum || 1000}</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method Alert */}
        {!clientData.has_payment_method && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>Action Required:</strong> Add a payment method to purchase recruits and enable auto-charge
              </span>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("billing")}>
                Add Payment Method →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <Home className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="recruits">
              <Users className="h-4 w-4 mr-2" />
              Recruits ({availableMatches.length})
            </TabsTrigger>
            <TabsTrigger value="purchased">
              <Eye className="h-4 w-4 mr-2" />
              Purchased ({purchasedMatches.length})
            </TabsTrigger>
            {/* Bids tab hidden for now */}
            <TabsTrigger value="conversations">
              <Mail className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="settings">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription>Account information</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate("/client-profile")}
                  >
                    Edit Profile
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {clientData.company_name || clientData.company || clientData.brokerage}
                      </p>
                      <p className="text-xs text-muted-foreground">Company</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{clientData.email}</p>
                      <p className="text-xs text-muted-foreground">Email</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{clientData.phone || "Not provided"}</p>
                      <p className="text-xs text-muted-foreground">Phone</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {clientData.client_type?.replace('_', ' ') || 'Real Estate'}
                      </p>
                      <p className="text-xs text-muted-foreground">Account Type</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("recruits")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Available Recruits
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("purchased")}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Purchased Recruits
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => setActiveTab("conversations")}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    View Messages
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Recruits - Show 4-8 */}
            {recentMatches.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">Recent Recruits</h3>
                  <p className="text-sm text-muted-foreground">
                    Your latest {recentMatches.length} recruit matches
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {recentMatches.map((match) => (
                    <DetailedRecruitCard
                      key={match.id}
                      match={match}
                      onPurchase={handlePurchaseRecruit}
                      hasPaymentMethod={clientData?.has_payment_method}
                      isPurchased={match.purchased}
                    />
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab(availableMatches.length > 0 ? "recruits" : "purchased")}
                >
                  View All Recruits ({matches.length})
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Recruits Tab */}
          <TabsContent value="recruits" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Available Recruits</h2>
              <p className="text-muted-foreground mb-6">
                {availableMatches.length} recruits ready to purchase
              </p>
            </div>
            {availableMatches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>No recruits available</p>
                  <p className="text-sm mt-2">Check back soon for new matches</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {availableMatches.map((match) => (
                  <DetailedRecruitCard
                    key={match.id}
                    match={match}
                    onPurchase={handlePurchaseRecruit}
                    hasPaymentMethod={clientData?.has_payment_method}
                    isPurchased={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Purchased Tab */}
          <TabsContent value="purchased" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Purchased Recruits</h2>
              <p className="text-muted-foreground mb-6">
                {purchasedMatches.length} recruits in your network
              </p>
            </div>
            {purchasedMatches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <Eye className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>No purchased recruits yet</p>
                  <p className="text-sm mt-2">Purchase recruits to build your network</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {purchasedMatches.map((match) => (
                  <DetailedRecruitCard
                    key={match.id}
                    match={match}
                    hasPaymentMethod={clientData?.has_payment_method}
                    isPurchased={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Bids Tab - HIDDEN FOR NOW */}
          {/* 
          <TabsContent value="bids" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Bid Filters</h2>
                <p className="text-muted-foreground">
                  Create automated filters to match and purchase recruits
                </p>
              </div>
              <Button onClick={handleAddBidFilter}>
                <Plus className="mr-2 h-4 w-4" />
                Add Bid Filter
              </Button>
            </div>

            {bidFilters.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No bid filters created yet</p>
                  <Button onClick={handleAddBidFilter}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Bid Filter
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {coverageAreas.length > 0 && (
                  <Alert>
                    <MapPin className="h-4 w-4" />
                    <AlertDescription>
                      You have {coverageAreas.length} coverage area(s) defined. Bid filters use these areas to match recruits.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-6 md:grid-cols-2">
                  {bidFilters.map((filter) => (
                    <BidFilterCard
                      key={filter.id}
                      filter={filter}
                      onUpdate={handleUpdateBidFilter}
                      onDelete={handleDeleteBidFilter}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          */}

          {/* Conversations Tab */}
          <TabsContent value="conversations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
                <CardDescription>
                  View and manage conversations with recruits
                </CardDescription>
              </CardHeader>
              <CardContent>
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No conversations yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {conversations.slice(0, 10).map((conv) => (
                      <div key={conv.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">{conv.sender_name || 'Unknown'}</p>
                          <Badge variant="outline">{conv.message_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {conv.message_content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conv.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={() => navigate("/conversations")}>
                      View All Conversations
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Email Notifications</p>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">New recruit matches</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Purchase confirmations</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Weekly summary reports</span>
                  </label>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Account Actions</p>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/user-settings")}>
                    Change Password
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Support</p>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/support")}>
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </CRMLayout>
  );
};

export default ClientBackend;
