import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CampaignAssignModalProps {
  open: boolean;
  onClose: () => void;
  template: any;
}

const CampaignAssignModal = ({ open, onClose, template }: CampaignAssignModalProps) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  
  // Filter states
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [zipFilter, setZipFilter] = useState("");
  const [minMatchScore, setMinMatchScore] = useState("");

  useEffect(() => {
    if (open) {
      fetchLeads();
    }
  }, [open]);

  const fetchLeads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user is staff or client
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isStaff = roles?.some(r => r.role === "staff");

      if (isStaff) {
        // Staff: Get all pros that match the target pipeline stages
        const { data, error } = await supabase
          .from("pros")
          .select("*")
          .in("pipeline_stage", template.target_pipeline_stages || []);

        if (error) throw error;
        
        // Add a default match score for staff view
        const leadsWithScores = (data || []).map(lead => ({
          ...lead,
          match_score: 0
        }));
        
        setLeads(leadsWithScores);
      } else {
        // Client: Get their purchased leads with match scores
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!clientData) {
          setLeads([]);
          setLoading(false);
          return;
        }

        // Get purchased pros with match scores
        const { data: matches } = await supabase
          .from("matches")
          .select("pro_id, match_score")
          .eq("client_id", clientData.id)
          .eq("status", "purchased");

        const leadIds = matches?.map(m => m.pro_id) || [];

        if (leadIds.length === 0) {
          setLeads([]);
          setLoading(false);
          return;
        }

        // Get pros
        const { data, error } = await supabase
          .from("pros")
          .select("*")
          .in("id", leadIds);

        if (error) throw error;
        
        // Merge match scores with pro data
        const leadsWithScores = (data || []).map(lead => {
          const match = matches?.find(m => m.pro_id === lead.id);
          return { ...lead, match_score: match?.match_score || 0 };
        });
        
        setLeads(leadsWithScores);
      }
    } catch (error: any) {
      toast.error("Failed to load leads");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLead = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  // Filter leads based on criteria
  const filteredLeads = leads.filter(lead => {
    if (cityFilter && !lead.cities?.some((c: string) => c.toLowerCase().includes(cityFilter.toLowerCase()))) {
      return false;
    }
    if (stateFilter && !lead.states?.some((s: string) => s.toLowerCase().includes(stateFilter.toLowerCase()))) {
      return false;
    }
    if (countyFilter && !lead.counties?.some((c: string) => c.toLowerCase().includes(countyFilter.toLowerCase()))) {
      return false;
    }
    if (zipFilter && !lead.zip_codes?.some((z: string) => z.includes(zipFilter))) {
      return false;
    }
    if (minMatchScore && lead.match_score < parseInt(minMatchScore)) {
      return false;
    }
    return true;
  });

  const handleAssign = async () => {
    if (selectedLeads.length === 0) {
      toast.error("Please select at least one lead");
      return;
    }

    setAssigning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get first step to calculate next_send_at
      const { data: steps } = await supabase
        .from("campaign_steps")
        .select("*")
        .eq("campaign_template_id", template.id)
        .order("step_order")
        .limit(1);

      const firstStep = steps?.[0];
      let nextSendAt = new Date();
      if (firstStep) {
        const delayMs =
          (firstStep.delay_days * 24 * 60 * 60 * 1000) +
          (firstStep.delay_hours * 60 * 60 * 1000) +
          (firstStep.delay_minutes * 60 * 1000);
        nextSendAt = new Date(Date.now() + delayMs);
      }

      const assignments = selectedLeads.map(leadId => ({
        pro_id: leadId,
        campaign_template_id: template.id,
        assigned_by: user.id,
        status: "active",
        current_step: 0,
        next_send_at: nextSendAt.toISOString(),
      }));

      const { error } = await supabase
        .from("campaign_assignments")
        .insert(assignments);

      if (error) throw error;

      toast.success(`Campaign assigned to ${selectedLeads.length} lead(s)`);
      onClose();
    } catch (error: any) {
      toast.error("Failed to assign campaign");
      console.error(error);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Campaign: {template.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No leads available to assign this campaign.
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs mb-1.5 block">City</Label>
                  <Input
                    placeholder="Filter by city..."
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">State</Label>
                  <Input
                    placeholder="Filter by state..."
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">County</Label>
                  <Input
                    placeholder="Filter by county..."
                    value={countyFilter}
                    onChange={(e) => setCountyFilter(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Zip Code</Label>
                  <Input
                    placeholder="Filter by zip..."
                    value={zipFilter}
                    onChange={(e) => setZipFilter(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Min Match %</Label>
                  <Input
                    type="number"
                    placeholder="0-100"
                    value={minMatchScore}
                    onChange={(e) => setMinMatchScore(e.target.value)}
                    className="h-9"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCityFilter("");
                      setStateFilter("");
                      setCountyFilter("");
                      setZipFilter("");
                      setMinMatchScore("");
                    }}
                    className="h-9 w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[400px] border rounded-md p-4">
                <div className="space-y-3">
                  {filteredLeads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No leads match the current filters.
                    </div>
                  ) : (
                    filteredLeads.map((lead) => (
                      <div key={lead.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                        <Checkbox
                          id={lead.id}
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={() => toggleLead(lead.id)}
                        />
                        <Label htmlFor={lead.id} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{lead.full_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {lead.email} • {lead.pipeline_stage}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {lead.cities?.join(", ") || "No cities"}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-primary">
                              {lead.match_score}% match
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {selectedLeads.length} lead(s) selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleAssign} disabled={assigning}>
                    {assigning ? "Assigning..." : "Assign Campaign"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignAssignModal;