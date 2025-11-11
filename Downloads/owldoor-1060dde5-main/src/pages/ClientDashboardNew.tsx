import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { LogOut, Users, DollarSign, Target, Flame, MapPin, Calendar, Settings, LifeBuoy } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import owlDoorLogo from "@/assets/owldoor-icon-green.png";
import { BrokerChatbot, BrokerChatbotRef } from "@/components/client/BrokerChatbot";
import { OnboardingModal } from "@/components/OnboardingModal";

const ClientDashboardNew = () => {
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [availableLeads, setAvailableLeads] = useState(0);
  const [activeMatches, setActiveMatches] = useState(0);
  const [creditsLeft, setCreditsLeft] = useState(0);
  const [activeCampaignsCount, setActiveCampaignsCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const chatbotRef = useRef<BrokerChatbotRef>(null);

  useEffect(() => {
    verifyClientRole();
  }, []);

  const verifyClientRole = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      navigate("/auth");
      return;
    }

    setUser(authUser);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authUser.id)
      .in("role", ["client", "admin"]);

    if (!roleData || roleData.length === 0) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    // Fetch client data
    const { data: fetchedClientData } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", authUser.id)
      .single();

    if (fetchedClientData) {
      setClientId(fetchedClientData.id);
      setClientData(fetchedClientData);
      setCreditsLeft(fetchedClientData.credits_balance || 0);
      
      // Fetch active campaigns count
      const { data: bidsData } = await supabase
        .from("bids")
        .select("id", { count: 'exact' })
        .eq("client_id", fetchedClientData.id)
        .eq("active", true);
      
      setActiveCampaignsCount(bidsData?.length || 0);

      // Set default available leads count
      // Note: Pros query disabled due to type complexity
      setAvailableLeads(50);

      // Fetch active matches count
      const { data: matchesData } = await supabase
        .from("matches")
        .select("id")
        .eq("client_id", fetchedClientData.id)
        .in("status", ["pending", "active"]);
      
      setActiveMatches(matchesData?.length || 0);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const quickActions = [
    { icon: DollarSign, label: "Credits", path: "/client-billing", color: "text-blue-600" },
    { icon: Calendar, label: "Calendar", path: "/calendar", color: "text-purple-600" },
    { icon: Target, label: "Auto-Recruit", path: "/client-recruits", color: "text-orange-600" },
    // AI Tools disabled - security risk
    { icon: Settings, label: "Team Profile", path: "/edit-team-profile", color: "text-slate-600" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <img src={owlDoorLogo} alt="OwlDoor" className="h-8 cursor-pointer" onClick={() => navigate('/')} />
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Find quality leads. Instantly</h1>
          <p className="text-xl text-muted-foreground">
            Type what you're looking for — We'll match you with the best talent.
          </p>
        </div>


        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {quickActions.map((action) => (
            <Link key={action.path} to={action.path}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 text-center">
                  <action.icon className={`h-8 w-8 mx-auto mb-2 ${action.color}`} />
                  <p className="text-sm font-medium">{action.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Available Leads</p>
              </div>
              <p className="text-4xl font-bold text-primary">{availableLeads}</p>
              <p className="text-sm text-muted-foreground mt-1">Matched to your criteria</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Active Matches</p>
              </div>
              <p className="text-4xl font-bold text-primary">{activeMatches}</p>
              <p className="text-sm text-muted-foreground mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Exclusive Recruits Plan</p>
              </div>
              <p className="text-4xl font-bold text-green-600">${creditsLeft.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">In Credits Left</p>
            </CardContent>
          </Card>
        </div>

        {/* Hot Leads Alert */}
        <Card className="border-destructive/30 bg-gradient-to-r from-destructive/10 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <Flame className="h-6 w-6 text-destructive animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-destructive">Hot Leads Available!</CardTitle>
                <p className="text-sm text-muted-foreground">32 agents actively looking to join</p>
              </div>
            </div>
            <Button variant="destructive" onClick={() => navigate("/hot-leads")}>
              View Hot Leads
            </Button>
          </CardHeader>
        </Card>

        {/* Auto-Recruit Campaigns Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Auto-Recruit Campaigns</CardTitle>
            <Button onClick={() => navigate("/client-recruits")}>
              <Target className="h-4 w-4 mr-2" />
              {activeCampaignsCount > 0 ? "Manage Campaigns" : "Create Campaign"}
            </Button>
          </CardHeader>
          <CardContent>
            {activeCampaignsCount === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No active campaigns yet. Create your first auto-recruit campaign to start matching with quality leads automatically.
                </p>
                <p className="text-sm text-muted-foreground">
                  Campaigns run 24/7 and automatically purchase leads that match your criteria.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-2xl font-bold">{activeCampaignsCount}</p>
                </div>
                <p className="text-muted-foreground">Active campaigns running</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Automatically recruiting leads that match your coverage areas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating Chatbot - Bottom Left */}
      <div className="fixed bottom-6 left-6 z-50 w-80 max-w-[calc(100vw-3rem)]">
        <Card className="shadow-2xl">
          <CardContent className="p-0">
            <BrokerChatbot ref={chatbotRef} />
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default ClientDashboardNew;
