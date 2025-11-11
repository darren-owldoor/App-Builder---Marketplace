import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Eye } from "lucide-react";
import { toast } from "sonner";
import CampaignAssignModal from "@/components/campaigns/CampaignAssignModal";
import CampaignResponsesModal from "@/components/campaigns/CampaignResponsesModal";

const ClientCampaigns = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [responsesModalOpen, setResponsesModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("campaign_templates")
        .select(`
          *,
          campaign_steps(count)
        `)
        .eq("shared_with_clients", true)
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast.error("Failed to load campaigns");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = (template: any) => {
    setSelectedTemplate(template);
    setAssignModalOpen(true);
  };

  const handleViewResponses = (template: any) => {
    setSelectedTemplate(template);
    setResponsesModalOpen(true);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/office")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Campaign Library</h1>
        </div>

        {templates.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No campaigns available yet.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
                    {template.description && (
                      <p className="text-muted-foreground mb-3">{template.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{template.campaign_steps?.[0]?.count || 0} steps</span>
                      {template.target_pipeline_stages && template.target_pipeline_stages.length > 0 && (
                        <span>
                          Suggested for: {template.target_pipeline_stages.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResponses(template)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Responses
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAssign(template)}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Use Campaign
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedTemplate && (
        <>
          <CampaignAssignModal
            open={assignModalOpen}
            onClose={() => setAssignModalOpen(false)}
            template={selectedTemplate}
          />
          <CampaignResponsesModal
            open={responsesModalOpen}
            onClose={() => setResponsesModalOpen(false)}
            templateId={selectedTemplate.id}
          />
        </>
      )}
    </div>
  );
};

export default ClientCampaigns;