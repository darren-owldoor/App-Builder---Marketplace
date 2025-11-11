import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, TrendingUp, DollarSign, Target, List, LayoutGrid, ArrowLeft } from "lucide-react";
import LeadListItem from "@/components/LeadListItem";
import LeadKanban from "@/components/LeadKanban";
import LeadDetailsModal from "@/components/LeadDetailsModal";

interface Lead {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string | null;
  phone: string | null;
  phone2?: string | null;
  email2?: string | null;
  city: string | null;
  state: string | null;
  cities?: string[] | null;
  states?: string[] | null;
  brokerage: string | null;
  years_experience: number | null;
  transactions: number | null;
  pipeline_stage: string;
  pipeline_type?: string | null;
  qualification_score: number;
  wants?: string[] | null;
  needs: string | null;
  skills: string[] | null;
  designations?: string[] | null;
  languages?: string[] | null;
  license_type?: string | null;
  status: string;
  source?: string | null;
  total_sales?: number | null;
  avg_price?: number | null;
  motivation?: number | null;
  interest?: number | null;
  priority?: string | null;
  image_url?: string | null;
  linkedin_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  website_url?: string | null;
  homes_com_url?: string | null;
  realtor_com_url?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at?: string | null;
  user_id?: string | null;
  match?: {
    id: string;
    status: string;
    matched_at: string;
  };
}

const ClientLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get client profile
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (clientError) throw clientError;

      // Fetch matched leads with full details
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(`
          id,
          status,
          created_at,
          pros:pro_id (*)
        `)
        .eq("client_id", clientData.id)
        .order("created_at", { ascending: false });

      if (matchesError) throw matchesError;

      // Transform the data
      const transformedLeads: Lead[] = matchesData
        .filter(match => match.pros)
        .map(match => ({
          ...(match.pros as any),
          match: {
            id: match.id,
            status: match.status,
            matched_at: match.created_at,
          }
        }));

      setLeads(transformedLeads);
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error",
        description: "Failed to load leads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const statusFilters = [
    { label: "All", value: "all" },
    { label: "New Recruit", value: "new_recruit" },
    { label: "Hot Recruit", value: "hot_recruit" },
    { label: "Booked Appt", value: "booked_appt" },
    { label: "Nurture", value: "nurture" },
    { label: "Hired", value: "hired" },
    { label: "Dead", value: "dead" },
  ];

  const filteredLeads = activeFilter === "all" 
    ? leads.filter(lead => 
        lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm) ||
        lead.city?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : leads.filter(lead => 
        lead.pipeline_stage === activeFilter &&
        (lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm) ||
        lead.city?.toLowerCase().includes(searchTerm.toLowerCase()))
      );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate("/client-dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-primary text-white border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
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
                {leads.filter((l) => l.pipeline_stage === "hot_recruit").length}
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
                {leads.filter((l) => l.pipeline_stage === "booked_appt").length}
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
                {leads.filter((l) => l.pipeline_stage === "hired").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Sold agents</p>
            </CardContent>
          </Card>
        </div>

        {/* View Toggles */}
        <div className="mb-6 flex gap-2 justify-between items-center">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="font-semibold">Map View</span>
          </div>
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
        </div>

        {viewMode === "kanban" ? (
          <LeadKanban 
            leads={filteredLeads} 
            pipelineType="client" 
            onLeadUpdate={fetchLeads}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Agent Pipeline</CardTitle>
              <p className="text-sm text-muted-foreground">Manage and track real estate agents</p>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter Tabs */}
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
              {filteredLeads.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No leads found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "Try adjusting your search criteria" : "You don't have any matched leads yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLeads.map((lead) => (
                    <LeadListItem
                      key={lead.id}
                      lead={lead}
                      onExpand={() => {
                        setSelectedLead(lead);
                        setModalOpen(true);
                      }}
                      showAdminActions={false}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Lead Details Modal - Read Only for Clients */}
        {selectedLead && (
          <LeadDetailsModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            lead={selectedLead}
            onUpdate={fetchLeads}
            readOnly={true}
          />
        )}
      </div>
    </div>
  );
};

export default ClientLeads;
