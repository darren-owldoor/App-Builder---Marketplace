import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X, Plus, Bot } from "lucide-react";
import { toast } from "sonner";
import CampaignStepManager from "./CampaignStepManager";
import QualificationRules from "./QualificationRules";
import { Checkbox } from "@/components/ui/checkbox";
import { AIQualificationCampaign } from "./AIQualificationCampaign";

const STAFF_PIPELINE_STAGES = [
  { value: "new", label: "New" },
  { value: "qualifying", label: "Qualifying" },
  { value: "qualified", label: "Qualified" },
  { value: "match_ready", label: "Match Ready" },
  { value: "matched", label: "Matched" },
  { value: "purchased", label: "Purchased" },
];

const CLIENT_PIPELINE_STAGES = [
  { value: "new_recruit", label: "New Recruit" },
  { value: "hot_recruit", label: "Hot Recruit" },
  { value: "booked_appt", label: "Booked Appt" },
  { value: "nurture", label: "Nurture" },
  { value: "hired", label: "Hired" },
  { value: "dead", label: "Dead" },
];

interface CampaignTemplateFormProps {
  template?: any;
  onClose: () => void;
}

const CampaignTemplateForm = ({ template, onClose }: CampaignTemplateFormProps) => {
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [active, setActive] = useState(template?.active ?? true);
  const [sharedWithStaff, setSharedWithStaff] = useState(template?.shared_with_staff || false);
  const [sharedWithClients, setSharedWithClients] = useState(template?.shared_with_clients || false);
  const [targetStages, setTargetStages] = useState<string[]>(template?.target_pipeline_stages || []);
  const [saving, setSaving] = useState(false);
  const [templateId, setTemplateId] = useState(template?.id);
  const [aiFallbackEnabled, setAiFallbackEnabled] = useState(template?.ai_fallback_enabled || false);
  const [aiFallbackEmail, setAiFallbackEmail] = useState(template?.ai_fallback_notify_email ?? true);
  const [aiFallbackSms, setAiFallbackSms] = useState(template?.ai_fallback_notify_sms || false);
  const [leadTypes, setLeadTypes] = useState<string[]>(template?.lead_types || []);
  const [pricingModel, setPricingModel] = useState(template?.pricing_model || "free");
  const [monthlyCost, setMonthlyCost] = useState(template?.monthly_cost || 0);
  const [perActionCost, setPerActionCost] = useState(template?.per_action_cost || 0);
  const [showAIBuilder, setShowAIBuilder] = useState(false);

  const pipelineType = sharedWithClients ? "client" : "staff";

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const templateData = {
        name: name.trim(),
        description: description.trim(),
        active,
        shared_with_staff: sharedWithStaff,
        shared_with_clients: sharedWithClients,
        target_pipeline_stages: targetStages,
        created_by: user.id,
        ai_fallback_enabled: aiFallbackEnabled,
        ai_fallback_notify_email: aiFallbackEmail,
        ai_fallback_notify_sms: aiFallbackSms,
        lead_types: leadTypes,
        pricing_model: pricingModel,
        monthly_cost: monthlyCost,
        per_action_cost: perActionCost,
      };

      if (templateId) {
        const { error } = await supabase
          .from("campaign_templates")
          .update(templateData)
          .eq("id", templateId);
        if (error) throw error;
        toast.success("Campaign updated");
      } else {
        const { data, error } = await supabase
          .from("campaign_templates")
          .insert(templateData)
          .select()
          .single();
        if (error) throw error;
        setTemplateId(data.id);
        toast.success("Campaign created");
      }
    } catch (error: any) {
      toast.error("Failed to save campaign");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const toggleStage = (stage: string) => {
    setTargetStages(prev =>
      prev.includes(stage)
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  };

  const toggleLeadType = (type: string) => {
    setLeadTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const allStages = sharedWithStaff ? STAFF_PIPELINE_STAGES : CLIENT_PIPELINE_STAGES;

  if (showAIBuilder) {
    return (
      <AIQualificationCampaign
        onSave={() => {
          setShowAIBuilder(false);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {template ? "Edit Campaign" : "Create Campaign"}
          </h2>
          {!template && (
            <Button
              onClick={() => setShowAIBuilder(true)}
              variant="outline"
              className="gap-2"
            >
              <Bot className="h-4 w-4" />
              Create AI Campaign
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., New Lead Welcome Series"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this campaign"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={active}
                onCheckedChange={setActive}
              />
              <Label htmlFor="active">Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="staff"
                checked={sharedWithStaff}
                onCheckedChange={setSharedWithStaff}
              />
              <Label htmlFor="staff">Staff Campaign</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="clients"
                checked={sharedWithClients}
                onCheckedChange={setSharedWithClients}
              />
              <Label htmlFor="clients">Client Campaign</Label>
            </div>
          </div>

          <div>
            <Label>Target Pipeline Stages</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {allStages.map((stage) => (
                <div key={stage.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={stage.value}
                    checked={targetStages.includes(stage.value)}
                    onCheckedChange={() => toggleStage(stage.value)}
                  />
                  <Label htmlFor={stage.value} className="font-normal cursor-pointer">
                    {stage.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Lead Type</h3>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agent"
                  checked={leadTypes.includes("agent")}
                  onCheckedChange={() => toggleLeadType("agent")}
                />
                <Label htmlFor="agent" className="font-normal cursor-pointer">
                  Agent
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mortgage"
                  checked={leadTypes.includes("mortgage")}
                  onCheckedChange={() => toggleLeadType("mortgage")}
                />
                <Label htmlFor="mortgage" className="font-normal cursor-pointer">
                  Mortgage
                </Label>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing Model</h3>
            <RadioGroup value={pricingModel} onValueChange={setPricingModel}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="free" id="free" />
                <Label htmlFor="free" className="font-normal cursor-pointer">
                  Free
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="font-normal cursor-pointer">
                  Monthly Subscription
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="per_action" id="per_action" />
                <Label htmlFor="per_action" className="font-normal cursor-pointer">
                  Per Action
                </Label>
              </div>
            </RadioGroup>

            {pricingModel === "monthly" && (
              <div className="ml-6">
                <Label htmlFor="monthly_cost">Monthly Cost ($)</Label>
                <Input
                  id="monthly_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={monthlyCost}
                  onChange={(e) => setMonthlyCost(parseFloat(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>
            )}

            {pricingModel === "per_action" && (
              <div className="ml-6">
                <Label htmlFor="per_action_cost">Cost Per Action ($)</Label>
                <Input
                  id="per_action_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={perActionCost}
                  onChange={(e) => setPerActionCost(parseFloat(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>
            )}
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">If No Rules Are Met</h3>
            <p className="text-sm text-muted-foreground">
              When no qualification rules match, let AI take over the conversation
            </p>

            <div className="flex items-center justify-between">
              <Label htmlFor="ai-fallback">Have AI Take Over</Label>
              <Switch
                id="ai-fallback"
                checked={aiFallbackEnabled}
                onCheckedChange={setAiFallbackEnabled}
              />
            </div>

            {aiFallbackEnabled && (
              <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fallback-email">Notify via Email</Label>
                  <Switch
                    id="fallback-email"
                    checked={aiFallbackEmail}
                    onCheckedChange={setAiFallbackEmail}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="fallback-sms">Notify via SMS</Label>
                  <Switch
                    id="fallback-sms"
                    checked={aiFallbackSms}
                    onCheckedChange={setAiFallbackSms}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : templateId ? "Update Campaign" : "Create Campaign"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>

      {templateId && (
        <Tabs defaultValue="steps" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="steps">Campaign Steps</TabsTrigger>
            <TabsTrigger value="rules">Qualification Rules</TabsTrigger>
          </TabsList>
          
          <TabsContent value="steps">
            <CampaignStepManager 
              templateId={templateId} 
              pipelineType={pipelineType}
            />
          </TabsContent>
          
          <TabsContent value="rules">
            <QualificationRules 
              templateId={templateId}
              pipelineType={pipelineType}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CampaignTemplateForm;