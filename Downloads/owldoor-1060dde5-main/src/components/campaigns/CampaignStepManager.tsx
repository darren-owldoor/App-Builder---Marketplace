import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import StepConditionBuilder from "./StepConditionBuilder";
import FieldSelector from "./FieldSelector";
import { TwilioAccountSelector } from "./TwilioAccountSelector";

interface CampaignStepManagerProps {
  templateId: string;
  pipelineType?: "staff" | "client";
}

const CampaignStepManager = ({ templateId, pipelineType = "staff" }: CampaignStepManagerProps) => {
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSteps();
  }, [templateId]);

  const fetchSteps = async () => {
    try {
      const { data, error } = await supabase
        .from("campaign_steps")
        .select("*")
        .eq("campaign_template_id", templateId)
        .order("step_order");

      if (error) throw error;
      setSteps(data || []);
    } catch (error: any) {
      toast.error("Failed to load steps");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addStep = () => {
    const newStep = {
      id: `temp-${Date.now()}`,
      step_order: steps.length,
      step_type: "sms",
      sms_template: "",
      email_subject: "",
      email_template: "",
      delay_days: 0,
      delay_hours: 0,
      delay_minutes: 0,
      twilio_account_id: null,
      phone_number: null,
      isNew: true,
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const insertFieldIntoTemplate = (index: number, field: string, templateField: string) => {
    const step = steps[index];
    const currentValue = step[templateField] || "";
    const newValue = currentValue + field;
    updateStep(index, templateField, newValue);
  };

  const deleteStep = async (index: number, stepId: string) => {
    if (!stepId.startsWith("temp-")) {
      try {
        const { error } = await supabase
          .from("campaign_steps")
          .delete()
          .eq("id", stepId);
        if (error) throw error;
      } catch (error: any) {
        toast.error("Failed to delete step");
        console.error(error);
        return;
      }
    }
    
    const updated = steps.filter((_, i) => i !== index);
    updated.forEach((step, i) => {
      step.step_order = i;
    });
    setSteps(updated);
  };

  const saveSteps = async () => {
    try {
      for (const step of steps) {
        const stepData = {
          campaign_template_id: templateId,
          step_order: step.step_order,
          step_type: step.step_type,
          sms_template: step.sms_template,
          email_subject: step.email_subject,
          email_template: step.email_template,
          delay_days: parseInt(step.delay_days) || 0,
          delay_hours: parseInt(step.delay_hours) || 0,
          delay_minutes: parseInt(step.delay_minutes) || 0,
          twilio_account_id: step.twilio_account_id || null,
          phone_number: step.phone_number || null,
        };

        if (step.isNew || step.id.startsWith("temp-")) {
          const { error } = await supabase
            .from("campaign_steps")
            .insert(stepData);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("campaign_steps")
            .update(stepData)
            .eq("id", step.id);
          if (error) throw error;
        }
      }
      
      toast.success("Steps saved successfully");
      fetchSteps();
    } catch (error: any) {
      toast.error("Failed to save steps");
      console.error(error);
    }
  };

  if (loading) return <div>Loading steps...</div>;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Campaign Steps</h3>
        <Button onClick={addStep} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Step
        </Button>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <Card key={step.id} className="p-4 border-2">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                {step.step_type === "sms" ? (
                  <MessageSquare className="h-5 w-5" />
                ) : (
                  <Mail className="h-5 w-5" />
                )}
                <span className="font-semibold">Step {index + 1}</span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteStep(index, step.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={step.step_type}
                    onValueChange={(value) => updateStep(index, "step_type", value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldSelector 
                    onInsert={(field) => insertFieldIntoTemplate(
                      index, 
                      field, 
                      step.step_type === "sms" ? "sms_template" : "email_template"
                    )} 
                  />
                </div>
              </div>

              {step.step_type === "sms" && (
                <>
                  <TwilioAccountSelector
                    selectedAccountId={step.twilio_account_id}
                    selectedPhoneNumber={step.phone_number}
                    onAccountChange={(accountId) => updateStep(index, "twilio_account_id", accountId)}
                    onPhoneNumberChange={(phoneNumber) => updateStep(index, "phone_number", phoneNumber)}
                  />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>SMS Message</Label>
                      <FieldSelector 
                        onInsert={(field) => insertFieldIntoTemplate(index, field, "sms_template")} 
                      />
                    </div>
                    <Textarea
                      value={step.sms_template}
                      onChange={(e) => updateStep(index, "sms_template", e.target.value)}
                      placeholder="Hi {lead_name}, welcome to our program!"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {step.step_type === "email" && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Subject</Label>
                      <FieldSelector 
                        onInsert={(field) => insertFieldIntoTemplate(index, field, "email_subject")} 
                      />
                    </div>
                    <Input
                      value={step.email_subject}
                      onChange={(e) => updateStep(index, "email_subject", e.target.value)}
                      placeholder="Welcome to our program"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Email Body</Label>
                      <FieldSelector 
                        onInsert={(field) => insertFieldIntoTemplate(index, field, "email_template")} 
                      />
                    </div>
                    <Textarea
                      value={step.email_template}
                      onChange={(e) => updateStep(index, "email_template", e.target.value)}
                      placeholder="Hi {lead_name}, we're excited to have you..."
                      rows={5}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Delay (Days)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={step.delay_days}
                    onChange={(e) => updateStep(index, "delay_days", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Delay (Hours)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={step.delay_hours}
                    onChange={(e) => updateStep(index, "delay_hours", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Delay (Minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={step.delay_minutes}
                    onChange={(e) => updateStep(index, "delay_minutes", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {!step.id.startsWith("temp-") && step.id && (
              <>
                <Separator className="my-4" />
                <StepConditionBuilder 
                  stepId={step.id} 
                  pipelineType={pipelineType}
                />
              </>
            )}
          </Card>
        ))}

        {steps.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No steps yet. Click "Add Step" to create your first campaign step.
          </div>
        )}

        {steps.length > 0 && (
          <Button onClick={saveSteps} className="w-full">
            Save All Steps
          </Button>
        )}
      </div>
    </Card>
  );
};

export default CampaignStepManager;