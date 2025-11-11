import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bot, Users, MessageSquare, Settings } from "lucide-react";
import { TwilioAccountSelector } from "./TwilioAccountSelector";

interface AIQualificationCampaignProps {
  onSave: () => void;
}

export const AIQualificationCampaign = ({ onSave }: AIQualificationCampaignProps) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    campaignName: "AI Lead Qualification",
    systemPrompt: `You are an AI assistant helping to qualify real estate agent leads for recruitment. 
Your goal is to gather key information and assess their fit:

1. Current brokerage and role
2. Years of experience
3. Recent transaction volume
4. Primary market areas
5. Motivation for considering a move
6. What they're looking for in a new opportunity

Be conversational, friendly, and professional. Ask one question at a time. 
Listen actively and follow up on their responses. Show genuine interest.

When you have enough information to assess qualification (typically 5-7 exchanges), 
notify the client team so they can take over the conversation.`,
    initialMessage: "Hi {lead_name}! Thanks for your interest. I'm here to learn more about you and see how we might work together. What's your current role in real estate?",
    notifyEmail: true,
    notifySms: true,
    clientCanTakeOver: true,
    twilioAccountId: "",
    phoneNumber: "",
  });

  const handleSave = async () => {
    if (!formData.campaignName.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create the AI campaign template
      const { data: template, error: templateError } = await supabase
        .from("campaign_templates")
        .insert({
          name: formData.campaignName,
          description: "AI-powered lead qualification campaign",
          active: true,
          shared_with_clients: true,
          shared_with_staff: false,
          created_by: user.id,
          ai_fallback_enabled: true,
          ai_fallback_notify_email: formData.notifyEmail,
          ai_fallback_notify_sms: formData.notifySms,
          lead_types: ["agent"],
          pricing_model: "per_action",
          per_action_cost: 0.50,
          ai_system_prompt: formData.systemPrompt,
          ai_initial_message: formData.initialMessage,
          ai_enabled: true,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create the initial SMS step with AI handoff
      const { error: stepError } = await supabase
        .from("campaign_steps")
        .insert({
          campaign_template_id: template.id,
          step_order: 0,
          step_type: "sms",
          sms_template: formData.initialMessage,
          delay_days: 0,
          delay_hours: 0,
          delay_minutes: 0,
          twilio_account_id: formData.twilioAccountId || null,
          phone_number: formData.phoneNumber || null,
          ai_enabled: true,
        });

      if (stepError) throw stepError;

      toast.success("AI Qualification Campaign created successfully!");
      onSave();
    } catch (error: any) {
      console.error("Error creating AI campaign:", error);
      toast.error(error.message || "Failed to create AI campaign");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>AI Lead Qualification Campaign</CardTitle>
              <CardDescription>
                Create an AI-powered campaign to automatically qualify agent leads and hand off to clients
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="campaignName">Campaign Name</Label>
            <Input
              id="campaignName"
              value={formData.campaignName}
              onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
              placeholder="e.g., AI Agent Qualification"
            />
          </div>

          <div>
            <Label htmlFor="systemPrompt">AI System Prompt</Label>
            <Textarea
              id="systemPrompt"
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              rows={8}
              placeholder="Define how the AI should interact with leads..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              This defines the AI's personality, goals, and conversation approach
            </p>
          </div>

          <div>
            <Label htmlFor="initialMessage">Initial Message Template</Label>
            <Textarea
              id="initialMessage"
              value={formData.initialMessage}
              onChange={(e) => setFormData({ ...formData, initialMessage: e.target.value })}
              rows={3}
              placeholder="Hi {lead_name}! Thanks for your interest..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              The first message sent to the lead. Use {"{lead_name}"} and other merge fields.
            </p>
          </div>

          <TwilioAccountSelector
            selectedAccountId={formData.twilioAccountId}
            selectedPhoneNumber={formData.phoneNumber}
            onAccountChange={(accountId) => setFormData({ ...formData, twilioAccountId: accountId })}
            onPhoneNumberChange={(phoneNumber) => setFormData({ ...formData, phoneNumber })}
          />

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Client Handoff Settings
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="clientCanTakeOver">Allow Client Takeover</Label>
                <p className="text-xs text-muted-foreground">
                  Clients can take over the AI conversation at any time
                </p>
              </div>
              <Switch
                id="clientCanTakeOver"
                checked={formData.clientCanTakeOver}
                onCheckedChange={(checked) => setFormData({ ...formData, clientCanTakeOver: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notifyEmail">Notify Client via Email</Label>
              <Switch
                id="notifyEmail"
                checked={formData.notifyEmail}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyEmail: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notifySms">Notify Client via SMS</Label>
              <Switch
                id="notifySms"
                checked={formData.notifySms}
                onCheckedChange={(checked) => setFormData({ ...formData, notifySms: checked })}
              />
            </div>
          </div>

            <div className="border-t pt-4">
              <div className="flex items-start gap-2 p-4 bg-primary/5 rounded-lg">
                <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">How It Works</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                    <li>• AI engages with leads via SMS to gather qualification information</li>
                    <li>• After gathering key data, client is notified to review the conversation</li>
                    <li>• Client can take over the conversation at any time</li>
                    <li>• All conversations are logged and tracked for quality control</li>
                    <li>• Add qualification rules after creation to define when to notify clients</li>
                  </ul>
                </div>
              </div>
            </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? "Creating Campaign..." : "Create AI Campaign"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};