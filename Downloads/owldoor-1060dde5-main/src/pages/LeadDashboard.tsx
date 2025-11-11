import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Building2, LogOut, MapPin, Star, Settings } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";

interface Match {
  id: string;
  status: string;
  match_score: number;
  created_at: string;
  clients: {
    company_name: string;
    contact_name: string;
    email: string;
    cities: string[] | null;
    states: string[] | null;
    client_type: string;
  };
}

interface Pro {
  id: string;
  pro_type: string;
  full_name: string;
  // Real Estate fields
  total_volume_12mo?: number;
  transactions_12mo?: number;
  experience?: number;
  // Mortgage fields
  nmls_id?: string;
  purchase_percentage?: number;
  avg_close_time_days?: number;
  lender_name?: string;
}

const LeadDashboard = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [pro, setPro] = useState<Pro | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    verifyLeadRole();
    fetchMatches();
  }, []);

  const verifyLeadRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "lead")
      .maybeSingle();

    // Check for lead role OR admin role (for login-as functionality)
    const { data: allRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["lead", "admin"]);

    if (!roleData && (!allRoles || allRoles.length === 0)) {
      // Also check if they have a pro record (might be legacy user)
      const { data: proData } = await supabase
        .from("pros")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (!proData) {
        toast({
          title: "Access Denied",
          description: "You do not have permission to access this page. Please contact support.",
          variant: "destructive",
        });
        navigate("/");
      }
    }
  };

  const fetchMatches = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Get the pro record with type-specific fields
      const { data: proData } = await supabase
        .from("pros")
        .select("id, pro_type, full_name, total_volume_12mo, transactions_12mo, experience, nmls_id, purchase_percentage, avg_close_time_days, lender_name")
        .eq("user_id", userData.user.id)
        .single();

      if (!proData) return;
      
      setPro(proData);

      // Get matches with client type info
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          clients:client_id (
            company_name,
            contact_name,
            email,
            cities,
            states,
            client_type
          )
        `)
        .eq("pro_id", proData.id)
        .order("match_score", { ascending: false });

      if (error) throw error;
      setMatches(data || []);
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/lead">
              <img src={owlDoorLogo} alt="OwlDoor" className="h-12 cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Agent Dashboard</h1>
              <p className="text-sm text-muted-foreground">Your Brokerage Matches</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8 bg-gradient-primary text-white border-0">
          <CardHeader>
            <CardTitle className="text-2xl">
              Welcome, {pro?.pro_type === 'mortgage_officer' ? 'Loan Officer' : 'Real Estate Agent'}
            </CardTitle>
            <CardDescription className="text-white/80">
              {pro?.pro_type === 'mortgage_officer' 
                ? "We've found lenders and mortgage companies that match your goals" 
                : "We've found brokerages that match your preferences and goals"}
            </CardDescription>
            {pro && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {pro.pro_type === 'real_estate_agent' ? (
                  <>
                    {pro.experience && (
                      <div>
                        <div className="opacity-70">Experience</div>
                        <div className="font-semibold">{pro.experience} years</div>
                      </div>
                    )}
                    {pro.transactions_12mo && (
                      <div>
                        <div className="opacity-70">Transactions (12mo)</div>
                        <div className="font-semibold">{pro.transactions_12mo}</div>
                      </div>
                    )}
                    {pro.total_volume_12mo && (
                      <div>
                        <div className="opacity-70">Volume (12mo)</div>
                        <div className="font-semibold">${(pro.total_volume_12mo / 1000000).toFixed(1)}M</div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {pro.nmls_id && (
                      <div>
                        <div className="opacity-70">NMLS ID</div>
                        <div className="font-semibold">{pro.nmls_id}</div>
                      </div>
                    )}
                    {pro.lender_name && (
                      <div>
                        <div className="opacity-70">Current Lender</div>
                        <div className="font-semibold">{pro.lender_name}</div>
                      </div>
                    )}
                    {pro.purchase_percentage && (
                      <div>
                        <div className="opacity-70">Purchase Focus</div>
                        <div className="font-semibold">{pro.purchase_percentage}%</div>
                      </div>
                    )}
                    {pro.avg_close_time_days && (
                      <div>
                        <div className="opacity-70">Avg Close Time</div>
                        <div className="font-semibold">{pro.avg_close_time_days} days</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Matches</CardTitle>
            <CardDescription>
              Brokerages and teams interested in recruiting you
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading matches...</div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No matches yet. We're working on finding the perfect fit for you!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matches.map((match) => (
                  <Card key={match.id} className="hover:shadow-glow transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-gradient-secondary flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {match.clients.company_name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {match.clients.contact_name}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-gradient-accent text-white border-0">
                          <Star className="h-3 w-3 mr-1" />
                          {match.match_score}% Match
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {match.clients.cities && match.clients.cities.length > 0 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm font-medium">Locations</p>
                            <p className="text-sm text-muted-foreground">
                              {match.clients.cities.slice(0, 3).join(", ")}
                              {match.clients.cities.length > 3 &&
                                ` +${match.clients.cities.length - 3} more`}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="pt-4 border-t">
                        <Badge
                          variant="outline"
                          className={
                            match.status === "pending"
                              ? "border-warning text-warning"
                              : "border-success text-success"
                          }
                        >
                          {match.status === "pending" ? "Under Review" : "Active"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                          Matched on {new Date(match.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LeadDashboard;
