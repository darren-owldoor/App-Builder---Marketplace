import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Users, TrendingUp, DollarSign, Target, LogOut, LayoutGrid, List, ChevronDown, Settings } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LeadPipelineCard from "@/components/LeadPipelineCard";
import LeadListItem from "@/components/LeadListItem";
import LeadDetailsModal from "@/components/LeadDetailsModal";
import LeadAssignModal from "@/components/admin/LeadAssignModal";
import ClientAnalytics from "@/components/ClientAnalytics";
import LeadKanban from "@/components/LeadKanban";
import ClientList from "@/components/admin/ClientList";
import owlDoorLogo from "@/assets/owldoor-icon-green.png";

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  status: string;
  pipeline_stage: string;
  qualification_score: number;
  created_at: string;
  purchased_client?: string | null;
  user_id?: string | null;
}

const StaffDashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeView, setActiveView] = useState<"leads" | "clients" | "analytics">("leads");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [industryFilter, setIndustryFilter] = useState<"real_estate" | "mortgage">("real_estate");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    verifyStaffRole();
    fetchLeads();
  }, []);

  const verifyStaffRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check for staff role OR admin role (for login-as functionality)
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["staff", "admin"]);

    if (!roleData || roleData.length === 0) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page. Please contact support.",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("pros")
        .select(`
          *,
          matches!left(
            client_id,
            status,
            clients(contact_name, company_name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Process data to include purchased client info
      const processedLeads = data?.map((lead: any) => {
        const purchasedMatch = lead.matches?.find((m: any) => m.status === "purchased");
        return {
          ...lead,
          purchased_client: purchasedMatch?.clients?.company_name || purchasedMatch?.clients?.contact_name,
        };
      });

      setLeads(processedLeads || []);
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

  const handleLoginAs = async (userId: string, userEmail: string) => {
    try {
      // Get user roles first to determine redirect
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) throw rolesError;

      const roles = rolesData?.map(r => r.role) || [];
      
      // Generate magic link via edge function
      const { data, error } = await supabase.functions.invoke('admin-user-operations', {
        body: { 
          action: 'generateMagicLink',
          email: userEmail
        }
      });

      if (error) throw error;
      
      if (data?.data?.properties?.hashed_token) {
        // Sign out current staff session
        await supabase.auth.signOut();
        
        // Sign in with the generated token
        const { error: signInError } = await supabase.auth.verifyOtp({
          token_hash: data.data.properties.hashed_token,
          type: 'magiclink',
        });

        if (signInError) throw signInError;

        toast({
          title: "Success",
          description: `Logged in as ${userEmail}`,
        });

        // Determine redirect based on role priority
        let redirectPath = "/";
        if (roles.includes("client" as any)) {
          redirectPath = "/client";
        } else if (roles.includes("lead" as any) || roles.includes("agent" as any)) {
          redirectPath = "/lead";
        }

        // Wait a moment for auth to process, then navigate
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 1000);
      }
    } catch (error: any) {
      console.error("Login as error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to login as user",
        variant: "destructive",
      });
    }
  };

  const statusFilters = [
    { label: "All", value: "all" },
    { label: "New", value: "new" },
    { label: "Qualifying", value: "qualifying" },
    { label: "Qualified", value: "qualified" },
    { label: "Match Ready", value: "match_ready" },
    { label: "Matched", value: "matched" },
    { label: "Purchased", value: "purchased" },
  ];

  const filteredLeads =
    activeFilter === "all" ? leads : leads.filter((lead) => lead.status === activeFilter);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/staff">
              <img src={owlDoorLogo} alt="OwlDoor" className="h-12 cursor-pointer hover:opacity-80 transition-opacity" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Staff Dashboard</h1>
              <p className="text-sm text-muted-foreground">Real Estate Agent Recruiting CRM</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {industryFilter === "real_estate" ? "Real Estate" : "Mortgage"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Industry Filter</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIndustryFilter("real_estate")}>
                  Real Estate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIndustryFilter("mortgage")}>
                  Mortgage
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-primary text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{leads.length}</div>
              <p className="text-xs opacity-70 mt-1">Active pipeline</p>
            </CardContent>
          </Card>

          <Card className="text-white border-0" style={{ backgroundColor: 'hsl(142deg 21.91% 54.75%)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Qualified</CardTitle>
              <Target className="h-4 w-4 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {leads.filter((l) => l.status === "qualified" || l.status === "match_ready").length}
              </div>
              <p className="text-xs opacity-70 mt-1">Ready to match</p>
            </CardContent>
          </Card>

          <Card className="text-white border-0" style={{ backgroundColor: 'hsl(142deg 21.91% 54.75%)' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Matches</CardTitle>
              <TrendingUp className="h-4 w-4 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {leads.filter((l) => l.status === "matched").length}
              </div>
              <p className="text-xs opacity-70 mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card className="border-success/20 bg-success/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-success">Purchased</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {leads.filter((l) => l.status === "purchased").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Sold leads</p>
            </CardContent>
          </Card>
        </div>

        {/* Toggle Views */}
        <div className="mb-6 flex gap-2 justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={activeView === "leads" ? "default" : "outline"}
              onClick={() => setActiveView("leads")}
            >
              Lead Pipeline
            </Button>
            <Button
              variant={activeView === "clients" ? "default" : "outline"}
              onClick={() => setActiveView("clients")}
            >
              Clients
            </Button>
            <Button
              variant={activeView === "analytics" ? "default" : "outline"}
              onClick={() => setActiveView("analytics")}
            >
              Analytics
            </Button>
          </div>
          {activeView === "leads" && (
            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="mr-2 h-4 w-4" />
                List
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Kanban
              </Button>
            </div>
          )}
        </div>

        {activeView === "analytics" ? (
          <ClientAnalytics />
        ) : activeView === "clients" ? (
          <ClientList 
            onLoginAs={(userId) => {
              // Get user email from clients table
              supabase
                .from("clients")
                .select("email, user_id")
                .eq("user_id", userId)
                .single()
                .then(({ data }) => {
                  if (data?.email) {
                    handleLoginAs(userId, data.email);
                  }
                });
            }}
          />
        ) : viewMode === "kanban" ? (
          <LeadKanban 
            leads={filteredLeads} 
            pipelineType="staff" 
            onLeadUpdate={fetchLeads}
            showAdminActions={true}
            onLoginAs={(userId) => {
              // Get user email from pros table
              supabase
                .from("pros")
                .select("email")
                .eq("user_id", userId)
                .single()
                .then(({ data }) => {
                  if (data?.email) {
                    handleLoginAs(userId, data.email);
                  }
                });
            }}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Lead Pipeline</CardTitle>
              <CardDescription>Manage and track real estate agent leads</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filter Tabs - Only show in leads view */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {statusFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={activeFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter.value)}
                    className="rounded-full"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              {/* Lead List */}
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading leads...</div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No leads found for this filter
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLeads.map((lead) => (
                    <LeadListItem
                      key={lead.id}
                      lead={lead}
                      onExpand={() => {
                        setSelectedLead(lead);
                        setDetailsModalOpen(true);
                      }}
                      onLoginAs={(userId) => {
                        // Get user email from pros table
                        supabase
                          .from("pros")
                          .select("email, user_id")
                          .eq("id", lead.id)
                          .single()
                          .then(({ data }) => {
                            if (data?.email && data.user_id) {
                              handleLoginAs(data.user_id, data.email);
                            }
                          });
                      }}
                      showAdminActions={true}
                    />
                  ))}
                </div>
              )}

              {!loading && filteredLeads.length > 0 && (
                <div className="mt-6 text-center">
                  <Button variant="outline" size="lg">
                    View All Leads
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        {selectedLead && (
          <>
            <LeadDetailsModal
              open={detailsModalOpen}
              onOpenChange={setDetailsModalOpen}
              lead={selectedLead}
              onUpdate={fetchLeads}
            />
            <LeadAssignModal
              open={assignModalOpen}
              onOpenChange={setAssignModalOpen}
              leadId={selectedLead.id}
              leadName={selectedLead.full_name}
              onAssignSuccess={fetchLeads}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default StaffDashboard;
