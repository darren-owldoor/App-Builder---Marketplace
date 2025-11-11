import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, Settings2 } from "lucide-react";
import { AILeadCard } from "./AILeadCard";
import { Button } from "@/components/ui/button";

interface AILead {
  id: string;
  pro_id: string;
  client_id: string;
  stage: string;
  status: string;
  next_action?: string | null;
  engagement_score?: number | null;
  is_hot?: boolean | null;
  ai_message_count?: number | null;
  last_message_at?: string | null;
  pros?: {
    full_name: string;
    email?: string | null;
    phone?: string | null;
    cities?: string[] | null;
    states?: string[] | null;
    experience?: number | null;
    transactions?: number | null;
    total_sales?: number | null;
    image_url?: string | null;
    wants?: string[] | null;
    brokerage?: string | null;
  };
}

interface AILeadKanbanProps {
  leads: AILead[];
  clientId: string;
  onLeadUpdate?: () => void;
  onOpenCardBuilder?: () => void;
  cardLayout?: any;
}

const AI_STAGES = [
  { value: "new_lead", label: "New Lead", color: "bg-blue-500" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { value: "interested", label: "Interested", color: "bg-purple-500" },
  { value: "appointment_set", label: "Appointment Set", color: "bg-green-500" },
  { value: "hired", label: "Hired", color: "bg-emerald-600" },
  { value: "dead", label: "Dead", color: "bg-gray-500" },
];

export const AILeadKanban = ({ 
  leads, 
  clientId, 
  onLeadUpdate, 
  onOpenCardBuilder,
  cardLayout 
}: AILeadKanbanProps) => {
  const [draggedLead, setDraggedLead] = useState<AILead | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLeads = leads.filter(lead => 
    lead.pros?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragStart = (lead: AILead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stage: string) => {
    if (!draggedLead) return;

    try {
      const { error } = await supabase
        .from("ai_leads")
        .update({ stage })
        .eq("id", draggedLead.id);

      if (error) throw error;

      toast.success(`Moved ${draggedLead.pros?.full_name} to ${AI_STAGES.find(s => s.value === stage)?.label}`);
      onLeadUpdate?.();
    } catch (error: any) {
      toast.error("Failed to update lead stage");
      console.error(error);
    } finally {
      setDraggedLead(null);
    }
  };

  const getLeadsByStage = (stage: string) => {
    return filteredLeads.filter((lead) => lead.stage === stage);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCardBuilder}
          className="gap-2"
        >
          <Settings2 className="h-4 w-4" />
          Customize Cards
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {AI_STAGES.map((stage) => {
          const stageLeads = getLeadsByStage(stage.value);
          return (
            <div
              key={stage.value}
              className="flex-shrink-0 w-[380px]"
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
                          <AILeadCard lead={lead} layout={cardLayout} />
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
