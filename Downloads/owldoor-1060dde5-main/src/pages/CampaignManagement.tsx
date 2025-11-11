import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import CampaignTemplateList from "@/components/campaigns/CampaignTemplateList";
import CampaignTemplateForm from "@/components/campaigns/CampaignTemplateForm";

const CampaignManagement = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowForm(true);
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Button>
            <h1 className="text-3xl font-bold">Campaign Management</h1>
          </div>
          {!showForm && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          )}
        </div>

        {showForm ? (
          <CampaignTemplateForm
            template={editingTemplate}
            onClose={handleFormClose}
          />
        ) : (
          <CampaignTemplateList
            onEdit={handleEdit}
            refreshTrigger={refreshTrigger}
          />
        )}
      </div>
    </div>
  );
};

export default CampaignManagement;