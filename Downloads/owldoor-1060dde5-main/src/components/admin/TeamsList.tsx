import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Building2, Mail, Phone, User, Plus, MapPin, Filter, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ManualClientCreation } from "./ManualClientCreation";
import { TeamManagementModal } from "./TeamManagementModal";
import CustomPackageModal from "./CustomPackageModal";
import { Edit, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Team {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  user_id: string;
  client_type: string;
  active: boolean;
  cities: string[] | null;
  states: string[] | null;
  brokerage: string | null;
  created_at: string;
  license_type: string | null;
  years_experience: number | null;
  avg_sale: number | null;
  yearly_sales: number | null;
  image_url: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  coverage_areas: any;
  skills: string[] | null;
  languages: string[] | null;
  zip_codes: string[] | null;
  county: string | null;
  current_package_id: string | null;
  custom_package_id: string | null;
  has_payment_method: boolean;
  credits_balance: number;
}

interface TeamsListProps {
  onLoginAs: (userId: string) => void;
}

const TeamsList = ({ onLoginAs }: TeamsListProps) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [geoSearchTerm, setGeoSearchTerm] = useState("");
  const [packageFilter, setPackageFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [customPackageTeam, setCustomPackageTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (error: any) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter((team) => {
    // Text search filter
    const matchesSearch =
      team.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.brokerage && team.brokerage.toLowerCase().includes(searchTerm.toLowerCase()));

    // Geographic filter
    const matchesGeo = geoSearchTerm === "" || 
      (team.states?.some(s => s.toLowerCase().includes(geoSearchTerm.toLowerCase()))) ||
      (team.cities?.some(c => c.toLowerCase().includes(geoSearchTerm.toLowerCase()))) ||
      (team.zip_codes?.some(z => z.includes(geoSearchTerm)));

    // Package filter
    const hasPackage = team.current_package_id || team.custom_package_id;
    const matchesPackage = 
      packageFilter === "all" ||
      (packageFilter === "has_package" && hasPackage) ||
      (packageFilter === "no_package" && !hasPackage);

    // Payment method filter
    const matchesPayment = 
      paymentFilter === "all" ||
      (paymentFilter === "has_card" && team.has_payment_method) ||
      (paymentFilter === "needs_card" && !team.has_payment_method);

    // Active filter
    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "active" && team.active) ||
      (activeFilter === "inactive" && !team.active);

    return matchesSearch && matchesGeo && matchesPackage && matchesPayment && matchesActive;
  });
  
  const activeFilterCount = [
    packageFilter !== "all",
    paymentFilter !== "all", 
    activeFilter !== "all",
    geoSearchTerm !== ""
  ].filter(Boolean).length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getClientTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'real_estate': 'Real Estate',
      'mortgage': 'Mortgage',
      'brokerage': 'Brokerage',
      'team': 'Team',
      'independent': 'Independent',
      'franchise': 'Franchise'
    };
    return typeMap[type] || type;
  };

  const calculateCompleteness = (team: Team) => {
    const fields = [
      'company_name', 'contact_name', 'email', 'phone', 'brokerage',
      'client_type', 'license_type', 'years_experience', 'avg_sale',
      'yearly_sales', 'image_url', 'website_url', 'linkedin_url',
      'cities', 'states', 'coverage_areas', 'skills', 'languages', 'zip_codes', 'county'
    ];
    
    let filled = 0;
    fields.forEach(field => {
      const value = team[field as keyof Team];
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          filled++;
        } else if (!Array.isArray(value)) {
          filled++;
        }
      }
    });
    
    return Math.round((filled / fields.length) * 100);
  };

  const getFilledFieldsPreview = (team: Team) => {
    const fields = [];
    if (team.phone) fields.push('Phone');
    if (team.brokerage) fields.push('Brokerage');
    if (team.cities?.length) fields.push(`${team.cities.length} Cities`);
    if (team.years_experience) fields.push(`${team.years_experience}y exp`);
    if (team.website_url) fields.push('Website');
    if (team.linkedin_url) fields.push('LinkedIn');
    return fields.slice(0, 4);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Teams & Companies</CardTitle>
            <CardDescription>View and manage brokerages, teams, and companies</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Team/Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Team/Company</DialogTitle>
              </DialogHeader>
              <ManualClientCreation
                onSuccess={() => {
                  setIsAddDialogOpen(false);
                  fetchTeams();
                  toast.success("Team/Company created successfully");
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="space-y-3">
          {/* Search Row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams/companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by State, City, or Zip..."
                value={geoSearchTerm}
                onChange={(e) => setGeoSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters:</span>
            </div>
            
            <Select value={packageFilter} onValueChange={setPackageFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Package Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Packages</SelectItem>
                <SelectItem value="has_package">Has Package</SelectItem>
                <SelectItem value="no_package">No Package</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment</SelectItem>
                <SelectItem value="has_card">Has Card</SelectItem>
                <SelectItem value="needs_card">Needs Card</SelectItem>
              </SelectContent>
            </Select>

            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Active Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPackageFilter("all");
                  setPaymentFilter("all");
                  setActiveFilter("all");
                  setGeoSearchTerm("");
                }}
                className="h-9"
              >
                <X className="h-4 w-4 mr-1" />
                Clear {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'}
              </Button>
            )}
            
            <div className="ml-auto text-sm text-muted-foreground">
              {filteredTeams.length} of {teams.length} teams
            </div>
          </div>
        </div>

        {/* Teams List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading teams...</div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No teams found</div>
        ) : (
          <div className="space-y-3">
            {filteredTeams.map((team) => (
              <div
                key={team.id}
                className="flex items-center gap-4 p-4 border border-border rounded-lg hover:border-primary/50 transition-all bg-card"
              >
                <Avatar className="h-12 w-12 border-2 border-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(team.company_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground truncate">
                      {team.company_name}
                    </h3>
                    <Badge variant={team.active ? "default" : "secondary"} className="text-xs">
                      {team.active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getClientTypeLabel(team.client_type)}
                    </Badge>
                    {(team.current_package_id || team.custom_package_id) && (
                      <Badge variant="default" className="text-xs bg-green-600">
                        Package Assigned
                      </Badge>
                    )}
                    {!team.has_payment_method && (
                      <Badge variant="destructive" className="text-xs">
                        Needs Card
                      </Badge>
                    )}
                    {team.credits_balance > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {team.credits_balance} Credits
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1 mb-1">
                    {getFilledFieldsPreview(team).map((field) => (
                      <Badge key={field} variant="outline" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                        {field}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{team.contact_name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{team.email}</span>
                    </div>
                    {team.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{team.phone}</span>
                      </div>
                    )}
                    {(team.cities?.length || team.states?.length) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {team.cities?.slice(0, 2).join(", ")}
                          {team.cities && team.cities.length > 2 && ` +${team.cities.length - 2}`}
                          {team.states && ` (${team.states.join(", ")})`}
                        </span>
                      </div>
                    )}
                  </div>
                  {team.brokerage && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Building2 className="h-3 w-3" />
                      <span>Brokerage: {team.brokerage}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setEditModalOpen(true);
                    }}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCustomPackageTeam(team)}
                  >
                    Custom Package
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {selectedTeamId && (
        <TeamManagementModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          teamId={selectedTeamId}
          onSuccess={() => {
            fetchTeams();
          }}
        />
      )}

      {customPackageTeam && (
        <CustomPackageModal
          isOpen={!!customPackageTeam}
          onClose={() => setCustomPackageTeam(null)}
          clientId={customPackageTeam.id}
          clientName={customPackageTeam.company_name}
          onSuccess={() => {
            fetchTeams();
          }}
        />
      )}
    </Card>
  );
};

export default TeamsList;
