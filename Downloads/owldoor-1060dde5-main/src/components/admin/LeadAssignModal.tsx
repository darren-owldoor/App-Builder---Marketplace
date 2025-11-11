import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Filter, X, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  onAssignSuccess?: () => void;
}

interface Client {
  id: string;
  contact_name: string;
  company_name: string;
  email: string;
  brokerage: string | null;
  cities: string[] | null;
  states: string[] | null;
  client_type: string;
}

const LeadAssignModal = ({ open, onOpenChange, leadId, leadName, onAssignSuccess }: LeadAssignModalProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [comboOpen, setComboOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filterCompany, setFilterCompany] = useState("");
  const [filterBrokerage, setFilterBrokerage] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterClientType, setFilterClientType] = useState("");

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  useEffect(() => {
    applyFilters();
  }, [clients, filterCompany, filterBrokerage, filterCity, filterState, filterClientType]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("active", true)
        .order("company_name");

      if (error) throw error;
      setClients(data || []);
      setFilteredClients(data || []);
    } catch (error: any) {
      toast.error("Failed to load clients");
      console.error(error);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    if (filterCompany) {
      filtered = filtered.filter(c => 
        c.company_name?.toLowerCase().includes(filterCompany.toLowerCase())
      );
    }

    if (filterBrokerage) {
      filtered = filtered.filter(c => 
        c.brokerage?.toLowerCase().includes(filterBrokerage.toLowerCase())
      );
    }

    if (filterCity) {
      filtered = filtered.filter(c => 
        c.cities?.some(city => city.toLowerCase().includes(filterCity.toLowerCase()))
      );
    }

    if (filterState) {
      filtered = filtered.filter(c => 
        c.states?.some(state => state.toLowerCase().includes(filterState.toLowerCase()))
      );
    }

    if (filterClientType) {
      filtered = filtered.filter(c => c.client_type === filterClientType);
    }

    setFilteredClients(filtered);
  };

  const clearFilters = () => {
    setFilterCompany("");
    setFilterBrokerage("");
    setFilterCity("");
    setFilterState("");
    setFilterClientType("");
  };

  const handleAssign = async () => {
    if (!selectedClientId) {
      toast.error("Please select a client");
      return;
    }

    setLoading(true);
    try {
      // Create a match between the lead and client
      const { error } = await supabase
        .from("matches")
        .insert({
          pro_id: leadId,
          client_id: selectedClientId,
          status: "pending",
          match_score: 0,
        });

      if (error) throw error;

      toast.success("Lead assigned successfully");
      onOpenChange(false);
      onAssignSuccess?.();
    } catch (error: any) {
      toast.error("Failed to assign lead");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const hasActiveFilters = filterCompany || filterBrokerage || filterCity || filterState || filterClientType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Lead to Client
          </DialogTitle>
          <DialogDescription>
            Manually assign "{leadName}" to a client
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters Section - Always Expanded */}
          <Card className="p-4 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <h3 className="font-semibold text-sm">Filter Clients</h3>
                {hasActiveFilters && (
                  <Badge variant="secondary">
                    {[filterCompany, filterBrokerage, filterCity, filterState, filterClientType]
                      .filter(Boolean).length}
                  </Badge>
                )}
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  placeholder="Search company..."
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                />
              </div>

              <div>
                <Label>Brokerage</Label>
                <Input
                  placeholder="Search brokerage..."
                  value={filterBrokerage}
                  onChange={(e) => setFilterBrokerage(e.target.value)}
                />
              </div>

              <div>
                <Label>City</Label>
                <Input
                  placeholder="Search city..."
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                />
              </div>

              <div>
                <Label>State</Label>
                <Input
                  placeholder="Search state..."
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                />
              </div>

              <div className="col-span-2">
                <Label>Client Type</Label>
                <Select value={filterClientType} onValueChange={setFilterClientType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="broker">Broker</SelectItem>
                    <SelectItem value="team_lead">Team Lead</SelectItem>
                    <SelectItem value="recruiter">Recruiter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {filteredClients.length} of {clients.length} clients
            </div>
          </Card>

          <Separator />

          {/* Client Selection */}
          <div>
            <Label>Select Client</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="w-full justify-between mt-2"
                >
                  {selectedClient
                    ? `${selectedClient.company_name} - ${selectedClient.contact_name}`
                    : "Search and select client..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search clients..." />
                  <CommandList>
                    <CommandEmpty>No clients found.</CommandEmpty>
                    <CommandGroup>
                      {filteredClients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={`${client.company_name} ${client.contact_name} ${client.email}`}
                          onSelect={() => {
                            setSelectedClientId(client.id);
                            setComboOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedClientId === client.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex-1">
                            <div className="font-semibold">{client.company_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {client.contact_name} • {client.email}
                            </div>
                            {client.brokerage && (
                              <div className="text-xs text-muted-foreground">
                                {client.brokerage}
                              </div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Selected Client Preview */}
          {selectedClient && (
            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-2">Selected Client</h3>
              <div className="space-y-1 text-sm">
                <div><strong>Company:</strong> {selectedClient.company_name}</div>
                <div><strong>Contact:</strong> {selectedClient.contact_name}</div>
                <div><strong>Email:</strong> {selectedClient.email}</div>
                {selectedClient.brokerage && (
                  <div><strong>Brokerage:</strong> {selectedClient.brokerage}</div>
                )}
                {selectedClient.cities && selectedClient.cities.length > 0 && (
                  <div><strong>Cities:</strong> {selectedClient.cities.join(", ")}</div>
                )}
                {selectedClient.states && selectedClient.states.length > 0 && (
                  <div><strong>States:</strong> {selectedClient.states.join(", ")}</div>
                )}
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={loading || !selectedClientId}>
              {loading ? "Assigning..." : "Assign Lead"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadAssignModal;
