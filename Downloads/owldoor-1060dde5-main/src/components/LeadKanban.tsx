import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import LeadPipelineCard from "./LeadPipelineCard";

interface Lead {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string | null;
  phone: string | null;
  pipeline_stage: string;
  qualification_score: number;
  company?: string | null;
  brokerage?: string | null;
  cities?: string[] | null;
  states?: string[] | null;
  status: string;
  source?: string | null;
  total_sales?: number | null;
  transactions?: number | null;
  experience?: number | null;
  skills?: string[] | null;
  wants?: string[] | null;
  motivation?: number | null;
  image_url?: string | null;
  purchased_client?: string | null;
  user_id?: string | null;
}

interface LeadKanbanProps {
  leads: Lead[];
  pipelineType: "staff" | "client";
  onLeadUpdate?: () => void;
  onLoginAs?: (userId: string) => void;
  showAdminActions?: boolean;
}

const STAFF_STAGES = [
  { value: "new", label: "New", color: "bg-blue-500" },
  { value: "qualifying", label: "Qualifying", color: "bg-yellow-500" },
  { value: "qualified", label: "Qualified", color: "bg-green-500" },
  { value: "match_ready", label: "Match Ready", color: "bg-purple-500" },
  { value: "matched", label: "Matched", color: "bg-orange-500" },
  { value: "purchased", label: "Purchased", color: "bg-emerald-600" },
];

const CLIENT_STAGES = [
  { value: "new_recruit", label: "New Recruit", color: "bg-blue-500" },
  { value: "hot_recruit", label: "Hot Recruit", color: "bg-red-500" },
  { value: "booked_appt", label: "Booked Appt", color: "bg-orange-500" },
  { value: "nurture", label: "Nurture", color: "bg-yellow-500" },
  { value: "hired", label: "Hired", color: "bg-green-500" },
  { value: "dead", label: "Dead", color: "bg-gray-500" },
];

const LeadKanban = ({ leads, pipelineType, onLeadUpdate, onLoginAs, showAdminActions = false }: LeadKanbanProps) => {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const stages = pipelineType === "staff" ? STAFF_STAGES : CLIENT_STAGES;

  const filteredLeads = leads.filter(lead => 
    lead.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stage: string) => {
    if (!draggedLead) return;

    try {
      const { error} = await supabase
        .from("pros")
        .update({ pipeline_stage: stage })
        .eq("id", draggedLead.id);

      if (error) throw error;

      toast.success(`Moved ${draggedLead.full_name} to ${stages.find(s => s.value === stage)?.label}`);
      onLeadUpdate?.();
    } catch (error: any) {
      toast.error("Failed to update lead stage");
      console.error(error);
    } finally {
      setDraggedLead(null);
    }
  };

  const getLeadsByStage = (stage: string) => {
    return filteredLeads.filter((lead) => lead.pipeline_stage === stage);
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageLeads = getLeadsByStage(stage.value);
        return (
          <div
            key={stage.value}
            className="flex-shrink-0 w-[416px]"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.value)}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    {stage.label}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {stageLeads.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-3">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead)}
                        className="cursor-move"
                      >
                        <LeadPipelineCard 
                          lead={lead} 
                          onLoginAs={onLoginAs}
                          showAdminActions={showAdminActions}
                        />
                      </div>
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No leads
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default LeadKanban;
