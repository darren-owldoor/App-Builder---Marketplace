import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Building2, Mail, Phone, User, Plus, MapPin, ChevronDown, Download, ListPlus, Eye, EyeOff, CreditCard, Copy, Check, Trash2, Edit } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ManualClientCreation } from "./ManualClientCreation";
import { AdminEditModal } from "./AdminEditModal";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Client {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  user_id: string;
  client_type: string;
  active: boolean;
  created_at: string;
  cities: string[] | null;
  states: string[] | null;
  zip_codes: string[] | null;
  current_package_id: string | null;
  custom_package_id: string | null;
  has_payment_method: boolean;
  credits_balance: number;
  hide_bids: boolean;
  zapier_webhook: string | null;
}

interface ClientListProps {
  onLoginAs: (userId: string) => void;
}

const ClientList = ({ onLoginAs }: ClientListProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  // Filter states
  const [locationFilter, setLocationFilter] = useState("");
  const [packageFilter, setPackageFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<string[]>([]);
  const [creditsFilter, setCreditsFilter] = useState<string[]>([]);
  
  // Collapsible states
  const [locationOpen, setLocationOpen] = useState(true);
  const [packageOpen, setPackageOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const toggleHideBids = async (clientId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("clients")
        .update({ hide_bids: !currentValue })
        .eq("id", clientId);

      if (error) throw error;
      
      toast.success(`Bids ${!currentValue ? 'hidden' : 'visible'} for this client`);
      fetchClients();
    } catch (error) {
      console.error("Error toggling hide_bids:", error);
      toast.error("Failed to update bids visibility");
    }
  };

  const generatePaymentLink = async (clientId: string) => {
    try {
      setGeneratingLink(clientId);
      const { data, error } = await supabase.functions.invoke("generate-payment-link", {
        body: { client_id: clientId },
      });

      if (error) throw error;

      await navigator.clipboard.writeText(data.link);
      setCopiedLink(clientId);
      toast.success("Payment link copied to clipboard!");
      
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error: any) {
      console.error("Error generating payment link:", error);
      toast.error(error.message || "Failed to generate payment link");
    } finally {
      setGeneratingLink(null);
    }
  };

  const toggleClientSelection = (clientId: string) => {
    const newSelection = new Set(selectedClients);
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId);
    } else {
      newSelection.add(clientId);
    }
    setSelectedClients(newSelection);
  };

  const toggleAllClients = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map(c => c.id)));
    }
  };

  const filteredClients = clients.filter((client) => {
    // Text search filter
    const matchesSearch =
      client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Location filter
    const matchesLocation = locationFilter === "" || 
      (client.states?.some(s => s.toLowerCase().includes(locationFilter.toLowerCase()))) ||
      (client.cities?.some(c => c.toLowerCase().includes(locationFilter.toLowerCase()))) ||
      (client.zip_codes?.some(z => z.includes(locationFilter)));

    // Package filter
    const hasPackage = client.current_package_id || client.custom_package_id;
    const matchesPackage = packageFilter.length === 0 ||
      (packageFilter.includes("has_package") && hasPackage) ||
      (packageFilter.includes("no_package") && !hasPackage);

    // Status filter
    const matchesStatus = statusFilter.length === 0 ||
      (statusFilter.includes("active") && client.active) ||
      (statusFilter.includes("inactive") && !client.active);

    // Payment filter
    const matchesPayment = paymentFilter.length === 0 ||
      (paymentFilter.includes("has_card") && client.has_payment_method) ||
      (paymentFilter.includes("needs_card") && !client.has_payment_method);

    // Credits filter
    const matchesCredits = creditsFilter.length === 0 ||
      (creditsFilter.includes("has_credits") && client.credits_balance > 0) ||
      (creditsFilter.includes("no_credits") && client.credits_balance <= 0);

    return matchesSearch && matchesLocation && matchesPackage && matchesStatus && matchesPayment && matchesCredits;
  });

  const activeFilterCount = 
    packageFilter.length + 
    statusFilter.length + 
    paymentFilter.length + 
    creditsFilter.length + 
    (locationFilter ? 1 : 0);

  const clearAllFilters = () => {
    setLocationFilter("");
    setPackageFilter([]);
    setStatusFilter([]);
    setPaymentFilter([]);
    setCreditsFilter([]);
  };

  const toggleFilter = (filterArray: string[], setFilter: (val: string[]) => void, value: string) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter(v => v !== value));
    } else {
      setFilter([...filterArray, value]);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getEligibilityStatus = (client: Client) => {
    const reasons = [];
    
    // Check if active
    if (!client.active) {
      reasons.push("Inactive account");
    }
    
    // Check credits
    if (client.credits_balance <= 0) {
      reasons.push("No credits");
    }
    
    // Check payment method
    if (!client.has_payment_method) {
      reasons.push("No payment method");
    }
    
    // GREEN = active AND has credits (payment method optional if they have credits)
    const isEligible = client.active && client.credits_balance > 0;
    
    return {
      eligible: isEligible,
      reasons: reasons.length > 0 ? reasons : ["Ready for auto-buy"],
      color: isEligible ? "text-green-500" : "text-red-500",
      bgColor: isEligible ? "bg-green-500/10" : "bg-red-500/10"
    };
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar Filters */}
      <div className="w-72 border-r border-border bg-card p-4 space-y-3 overflow-y-auto">
        <div className="space-y-1 mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="w-full justify-start text-xs h-8"
            >
              Clear ({activeFilterCount})
            </Button>
          )}
        </div>

        {/* Location Filter */}
        <Collapsible open={locationOpen} onOpenChange={setLocationOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">Location</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${locationOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Input
              placeholder="City, State, or Zip"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-9"
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Package Filter */}
        <Collapsible open={packageOpen} onOpenChange={setPackageOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="text-sm font-medium">Package</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${packageOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={packageFilter.includes("has_package")}
                onCheckedChange={() => toggleFilter(packageFilter, setPackageFilter, "has_package")}
              />
              <span className="text-sm">Has Package</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={packageFilter.includes("no_package")}
                onCheckedChange={() => toggleFilter(packageFilter, setPackageFilter, "no_package")}
              />
              <span className="text-sm">No Package</span>
            </label>
          </CollapsibleContent>
        </Collapsible>

        {/* Status Filter */}
        <Collapsible open={statusOpen} onOpenChange={setStatusOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={statusFilter.includes("active")}
                onCheckedChange={() => toggleFilter(statusFilter, setStatusFilter, "active")}
              />
              <span className="text-sm">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={statusFilter.includes("inactive")}
                onCheckedChange={() => toggleFilter(statusFilter, setStatusFilter, "inactive")}
              />
              <span className="text-sm">Inactive</span>
            </label>
          </CollapsibleContent>
        </Collapsible>

        {/* Payment Filter */}
        <Collapsible open={paymentOpen} onOpenChange={setPaymentOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-medium">Payment Method</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${paymentOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={paymentFilter.includes("has_card")}
                onCheckedChange={() => toggleFilter(paymentFilter, setPaymentFilter, "has_card")}
              />
              <span className="text-sm">Has Card</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={paymentFilter.includes("needs_card")}
                onCheckedChange={() => toggleFilter(paymentFilter, setPaymentFilter, "needs_card")}
              />
              <span className="text-sm">Needs Card</span>
            </label>
          </CollapsibleContent>
        </Collapsible>

        {/* Credits Filter */}
        <Collapsible open={creditsOpen} onOpenChange={setCreditsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-medium">Credits</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${creditsOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={creditsFilter.includes("has_credits")}
                onCheckedChange={() => toggleFilter(creditsFilter, setCreditsFilter, "has_credits")}
              />
              <span className="text-sm">Has Credits</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={creditsFilter.includes("no_credits")}
                onCheckedChange={() => toggleFilter(creditsFilter, setCreditsFilter, "no_credits")}
              />
              <span className="text-sm">No Credits</span>
            </label>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Client</DialogTitle>
                </DialogHeader>
                <ManualClientCreation
                  onSuccess={() => {
                    setIsAddDialogOpen(false);
                    fetchClients();
                    toast.success("Client created successfully");
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={selectedClients.size === 0}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
              <Button variant="outline" size="sm" disabled={selectedClients.size === 0}>
                <ListPlus className="h-4 w-4 mr-2" />
                Add to List
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedClients.size > 0 && `${selectedClients.size} selected • `}
              {filteredClients.length} of {clients.length} clients
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading clients...</div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">No clients found</div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr className="border-b border-border">
                  <th className="p-4 text-left w-12">
                    <Checkbox
                      checked={selectedClients.size === filteredClients.length}
                      onCheckedChange={toggleAllClients}
                    />
                  </th>
                  <th className="p-4 text-left text-sm font-medium">Name</th>
                  <th className="p-4 text-left text-sm font-medium">Contact</th>
                  <th className="p-4 text-left text-sm font-medium">Company</th>
                  <th className="p-4 text-left text-sm font-medium">Email</th>
                  <th className="p-4 text-left text-sm font-medium">Status</th>
                  <th className="p-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const eligibility = getEligibilityStatus(client);
                  return (
                    <tr 
                      key={client.id} 
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={selectedClients.has(client.id)}
                          onCheckedChange={() => toggleClientSelection(client.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                              {getInitials(client.contact_name || client.company_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{client.contact_name}</div>
                            {client.phone && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{client.contact_name}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{client.company_name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{client.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <Badge variant={client.active ? "default" : "secondary"} className="text-xs w-fit">
                            {client.active ? "Active" : "Inactive"}
                          </Badge>
                          {eligibility.eligible && (
                            <Badge variant="default" className="text-xs w-fit bg-green-600">
                              Auto-Buy Ready
                            </Badge>
                          )}
                          {client.credits_balance > 0 && (
                            <Badge variant="secondary" className="text-xs w-fit">
                              ${client.credits_balance}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedClientId(client.id);
                              setEditModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generatePaymentLink(client.id)}
                            disabled={generatingLink === client.id}
                          >
                            {copiedLink === client.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedClientId && (
        <AdminEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          type="client"
          recordId={selectedClientId}
          onSuccess={() => {
            fetchClients();
            setEditModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ClientList;
