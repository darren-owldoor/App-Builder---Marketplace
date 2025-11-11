import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Users, TrendingUp, DollarSign, Target, LogOut, Settings, List, Map, Search, ChevronDown } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { BackupSyncPanel } from "@/components/admin/BackupSyncPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LayoutGrid } from "lucide-react";
import LeadListItem from "@/components/LeadListItem";
import LeadDetailsModal from "@/components/LeadDetailsModal";
import LeadAssignModal from "@/components/admin/LeadAssignModal";
import ClientAnalytics from "@/components/ClientAnalytics";
import LeadKanban from "@/components/LeadKanban";
import UserManagement from "@/components/admin/UserManagement";
import { UserTypeManagement } from "@/components/admin/UserTypeManagement";
import { FieldManagement } from "@/components/admin/FieldManagement";
import { MatchingRules } from "@/components/admin/MatchingRules";
import { GenerateMatches } from "@/components/admin/GenerateMatches";
import { ZapierIntegration } from "@/components/admin/ZapierIntegration";
import { AdminPhoneNumberManager } from "@/components/admin/AdminPhoneNumberManager";
import { SupportTicketsAdmin } from "@/components/admin/SupportTicketsAdmin";
import { ManualStaffCreation } from "@/components/admin/ManualStaffCreation";
import { AdminAIChatBubble } from "@/components/admin/AdminAIChatBubble";
import SignupLinkManager from "@/components/admin/SignupLinkManager";
import ClientList from "@/components/admin/ClientList";
import TeamsList from "@/components/admin/TeamsList";
import AgentMapView from "@/components/AgentMapView";
import { AutoMatchTrigger } from "@/components/admin/AutoMatchTrigger";
import { ZipRadiusGeocoder } from "@/components/admin/ZipRadiusGeocoder";
import { MatchPreview } from "@/components/admin/MatchPreview";
import { SystemLimitsManager } from "@/components/admin/SystemLimitsManager";
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
  cities?: string[] | null;
  states?: string[] | null;
  zip_codes?: string[] | null;
  counties?: string[] | null;
}

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const activeView = (searchParams.get("view") as "pipeline" | "analytics" | "users" | "settings" | "zapier" | "phones" | "support" | "clients" | "onboarding" | "geocoder" | "limits") || "pipeline";
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "map">("list");
  const [industryFilter, setIndustryFilter] = useState<"real_estate" | "mortgage">("real_estate");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
    fetchUsers();
  }, [industryFilter]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-operations', {
        body: { action: 'listUsers' }
      });
      
      if (error) throw error;
      setUsers(data.users || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchLeads = async () => {
    try {
      // Fetch based on industry filter
      const query = supabase
        .from("pros")
        .select(`
          *,
          matches!left(
            client_id,
            status,
            clients(contact_name, company_name)
          )
        `);

      // Apply pro_type filter based on industry
      if (industryFilter === "real_estate") {
        query.eq("pro_type", "real_estate_agent");
      } else {
        query.eq("pro_type", "mortgage_officer");
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

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

  const handleGenerateMagicLink = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-magic-link', {
        body: { targetUserId: userId }
      });

      if (error) throw error;

      // Copy to clipboard
      await navigator.clipboard.writeText(data.magicLink);
      
      toast({
        title: "Magic Link Generated",
        description: `Link copied to clipboard! Valid for 24 hours. Target: ${data.targetUserEmail}`,
      });
    } catch (error: any) {
      console.error("Generate magic link error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate magic link",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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

  const filteredLeads = leads
    .filter((lead) => activeFilter === "all" || lead.pipeline_stage === activeFilter)
    .filter((lead) => lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchTerm]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Full System Access & Management</p>
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
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="text-white border-0" style={{ backgroundColor: '#64b57f' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total {industryFilter === "real_estate" ? "Agents" : "Loan Officers"}
              </CardTitle>
              <Users className="h-4 w-4 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{leads.length}</div>
              <p className="text-xs opacity-70 mt-1">Active pipeline</p>
            </CardContent>
          </Card>

          <Card className="text-white border-0" style={{ backgroundColor: '#64b57f' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Qualified</CardTitle>
              <Target className="h-4 w-4 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {leads.filter((l) => l.pipeline_stage === "qualified" || l.pipeline_stage === "match_ready").length}
              </div>
              <p className="text-xs opacity-70 mt-1">Ready to match</p>
            </CardContent>
          </Card>

          <Card className="text-white border-0" style={{ backgroundColor: '#64b57f' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Matches</CardTitle>
              <TrendingUp className="h-4 w-4 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {leads.filter((l) => l.pipeline_stage === "matched").length}
              </div>
              <p className="text-xs opacity-70 mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card className="text-white border-0" style={{ backgroundColor: '#64b57f' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Purchased</CardTitle>
              <DollarSign className="h-4 w-4 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {leads.filter((l) => l.pipeline_stage === "purchased").length}
              </div>
              <p className="text-xs opacity-70 mt-1">Sold agents</p>
            </CardContent>
          </Card>
        </div>

        {/* View Mode Toggle (only for pipeline) */}
        {activeView === "pipeline" && (
          <div className="mb-6 flex gap-2 justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={viewMode === "map" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("map")}
              >
                <Map className="mr-2 h-4 w-4" />
                Map View
              </Button>
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
        )}

        {activeView === "onboarding" ? (
          <SignupLinkManager />
        ) : activeView === "geocoder" ? (
          <ZipRadiusGeocoder />
        ) : activeView === "limits" ? (
          <SystemLimitsManager />
        ) : activeView === "support" ? (
          <SupportTicketsAdmin />
        ) : activeView === "clients" ? (
          <TeamsList onLoginAs={handleGenerateMagicLink} />
        ) : activeView === "phones" ? (
          <AdminPhoneNumberManager />
        ) : activeView === "zapier" ? (
          <ZapierIntegration />
        ) : activeView === "settings" ? (
          <div className="space-y-6">
            <BackupSyncPanel />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AutoMatchTrigger />
              <GenerateMatches />
              <UserTypeManagement />
            </div>
            <MatchPreview />
            <FieldManagement />
            <MatchingRules />
          </div>
        ) : activeView === "users" ? (
          <UserManagement />
        ) : activeView === "analytics" ? (
          <ClientAnalytics />
        ) : viewMode === "map" ? (
          <AgentMapView 
            agents={filteredLeads}
            onAgentClick={(agent) => {
              const lead = filteredLeads.find(l => l.id === agent.id);
              if (lead) {
                setSelectedLead(lead);
                setDetailsModalOpen(true);
              }
            }}
          />
        ) : viewMode === "kanban" ? (
          <LeadKanban 
            leads={filteredLeads} 
            pipelineType="staff" 
            onLeadUpdate={fetchLeads}
            onLoginAs={handleGenerateMagicLink}
            showAdminActions={true}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {industryFilter === "real_estate" ? "Agent Pipeline" : "Loan Officer Pipeline"}
              </CardTitle>
              <CardDescription>
                Manage and track {industryFilter === "real_estate" ? "real estate agents" : "mortgage loan officers"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search Box */}
              <div className="relative max-w-sm mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
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

              {/* Agent List */}
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading agents...</div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No agents found for this filter
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedLeads.map((lead) => (
                      <LeadListItem
                        key={lead.id}
                        lead={lead}
                        onLoginAs={handleGenerateMagicLink}
                        showAdminActions={true}
                        onExpand={() => {
                          setSelectedLead(lead);
                          setDetailsModalOpen(true);
                        }}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between border-t pt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredLeads.length)} of {filteredLeads.length} agents
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-10"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
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
      
      {/* AI Training Chat Bubble */}
      <AdminAIChatBubble />
    </div>
  );
};

export default AdminDashboard;
