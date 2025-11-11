import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users, Building, BarChart3, Star } from "lucide-react";
import { toast } from "sonner";
import CampaignAnalyticsModal from "./CampaignAnalyticsModal";
import CampaignRatingModal from "./CampaignRatingModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CampaignTemplateListProps {
  onEdit: (template: any) => void;
  refreshTrigger: number;
}

const CampaignTemplateList = ({ onEdit, refreshTrigger }: CampaignTemplateListProps) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [analyticsTemplate, setAnalyticsTemplate] = useState<any>(null);
  const [ratingTemplate, setRatingTemplate] = useState<any>(null);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    checkUserRole();
    fetchTemplates();
  }, [refreshTrigger]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasStaffRole = roles?.some(r => r.role === "staff");
      setIsStaff(hasStaffRole);

      if (!hasStaffRole) {
        // Get client ID for rating functionality
        const { data: client } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .single();
        
        if (client) {
          setCurrentClientId(client.id);
        }
      }
    } catch (error) {
      console.error("Failed to check user role:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("campaign_templates")
        .select(`
          *,
          campaign_steps(count)
        `)
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

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("campaign_templates")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Campaign deleted");
      fetchTemplates();
    } catch (error: any) {
      toast.error("Failed to delete campaign");
      console.error(error);
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading campaigns...</div>;
  }

  if (templates.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No campaigns yet. Create your first campaign to get started.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{template.name}</h3>
                  {!template.active && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  {template.shared_with_staff && (
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      Staff
                    </Badge>
                  )}
                  {template.shared_with_clients && (
                    <Badge variant="outline" className="gap-1">
                      <Building className="h-3 w-3" />
                      Clients
                    </Badge>
                  )}
                </div>
                {template.description && (
                  <p className="text-muted-foreground mb-3">{template.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{template.campaign_steps?.[0]?.count || 0} steps</span>
                  {template.target_pipeline_stages && template.target_pipeline_stages.length > 0 && (
                    <span>
                      Target stages: {template.target_pipeline_stages.join(", ")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {isStaff ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAnalyticsTemplate(template)}
                      title="View Analytics"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRatingTemplate(template)}
                    title="Rate Template"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {analyticsTemplate && (
        <CampaignAnalyticsModal
          templateId={analyticsTemplate.id}
          templateName={analyticsTemplate.name}
          open={!!analyticsTemplate}
          onClose={() => setAnalyticsTemplate(null)}
        />
      )}

      {ratingTemplate && currentClientId && (
        <CampaignRatingModal
          templateId={ratingTemplate.id}
          templateName={ratingTemplate.name}
          clientId={currentClientId}
          open={!!ratingTemplate}
          onClose={() => {
            setRatingTemplate(null);
            fetchTemplates();
          }}
        />
      )}
    </>
  );
};

export default CampaignTemplateList;