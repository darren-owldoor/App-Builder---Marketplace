import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface CampaignResponsesModalProps {
  open: boolean;
  onClose: () => void;
  templateId: string;
}

const CampaignResponsesModal = ({ open, onClose, templateId }: CampaignResponsesModalProps) => {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchResponses();
    }
  }, [open, templateId]);

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from("campaign_responses")
        .select(`
          *,
          leads (full_name, email),
          campaign_assignments (
            campaign_templates (name)
          )
        `)
        .eq("campaign_assignments.campaign_template_id", templateId)
        .order("received_at", { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (error: any) {
      console.error("Failed to load responses:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Campaign Responses</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="text-center py-8">Loading responses...</div>
          ) : responses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No responses yet.
            </div>
          ) : (
            <div className="space-y-4">
              {responses.map((response) => (
                <Card key={response.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold">
                        {response.leads?.full_name || "Unknown Lead"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {response.leads?.email}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {format(new Date(response.received_at), "MMM d, yyyy h:mm a")}
                    </Badge>
                  </div>
                  <p className="text-sm mt-2">{response.response_text}</p>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignResponsesModal;