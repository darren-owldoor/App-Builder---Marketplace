import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface QualificationRule {
  id?: string;
  rule_name: string;
  rule_type: string;
  field_name?: string;
  operator: string;
  value: string;
  target_stage: string;
  active: boolean;
  priority: number;
}

interface QualificationRulesProps {
  templateId: string;
  pipelineType: "staff" | "client";
}

const QualificationRules = ({ templateId, pipelineType }: QualificationRulesProps) => {
  const [rules, setRules] = useState<QualificationRule[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);

  const pipelineStages = pipelineType === "staff" ? STAFF_PIPELINE_STAGES : CLIENT_PIPELINE_STAGES;

  useEffect(() => {
    fetchRules();
    fetchCustomFields();
  }, [templateId]);

  const fetchRules = async () => {
    const { data, error } = await supabase
      .from("campaign_qualification_rules")
      .select("*")
      .eq("campaign_template_id", templateId)
      .order("priority", { ascending: false });

    if (error) {
      console.error("Error fetching rules:", error);
      return;
    }

    setRules(data || []);
  };

  const fetchCustomFields = async () => {
    const { data, error } = await supabase
      .from("custom_fields")
      .select("*")
      .eq("active", true);

    if (error) {
      console.error("Error fetching custom fields:", error);
      return;
    }

    setCustomFields(data || []);
  };

  const addRule = () => {
    setRules([
      ...rules,
      {
        rule_name: `Rule ${rules.length + 1}`,
        rule_type: "field_match",
        operator: "equals",
        value: "",
        target_stage: pipelineStages[0].value,
        active: true,
        priority: rules.length,
      },
    ]);
  };

  const updateRule = (index: number, field: string, value: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const removeRule = async (index: number) => {
    const rule = rules[index];
    if (rule.id) {
      const { error } = await supabase
        .from("campaign_qualification_rules")
        .delete()
        .eq("id", rule.id);

      if (error) {
        toast.error("Failed to delete rule");
        return;
      }
    }

    setRules(rules.filter((_, i) => i !== index));
    toast.success("Rule removed");
  };

  const saveRules = async () => {
    try {
      for (const rule of rules) {
        if (rule.id) {
          const { error } = await supabase
            .from("campaign_qualification_rules")
            .update({
              rule_name: rule.rule_name,
              rule_type: rule.rule_type,
              field_name: rule.field_name,
              operator: rule.operator,
              value: rule.value,
              target_stage: rule.target_stage,
              active: rule.active,
              priority: rule.priority,
            })
            .eq("id", rule.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("campaign_qualification_rules")
            .insert({
              campaign_template_id: templateId,
              ...rule,
            });

          if (error) throw error;
        }
      }

      toast.success("Rules saved successfully");
      fetchRules();
    } catch (error) {
      console.error("Error saving rules:", error);
      toast.error("Failed to save rules");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Auto-Qualification Rules</h3>
          <p className="text-sm text-muted-foreground">
            Automatically move leads to different pipeline stages based on criteria
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={addRule} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </div>
      </div>

      {rules.map((rule, index) => (
        <Card key={index} className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Input
              value={rule.rule_name}
              onChange={(e) => updateRule(index, "rule_name", e.target.value)}
              className="max-w-xs font-medium"
              placeholder="Rule name"
            />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Label>Active</Label>
                <Switch
                  checked={rule.active}
                  onCheckedChange={(checked) =>
                    updateRule(index, "active", checked)
                  }
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRule(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Rule Type</Label>
              <Select
                value={rule.rule_type}
                onValueChange={(value) => updateRule(index, "rule_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field_match">Field Match</SelectItem>
                  <SelectItem value="response_match">Response Match</SelectItem>
                  <SelectItem value="score_threshold">Score Threshold</SelectItem>
                  <SelectItem value="time_based">Time Based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {rule.rule_type === "field_match" && (
              <div>
                <Label>Field</Label>
                <Select
                  value={rule.field_name || ""}
                  onValueChange={(value) => updateRule(index, "field_name", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_name">Full Name</SelectItem>
                    <SelectItem value="first_name">First Name</SelectItem>
                    <SelectItem value="last_name">Last Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="brokerage">Brokerage</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="license">License</SelectItem>
                    <SelectItem value="license_type">License Type</SelectItem>
                    <SelectItem value="city">City</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="county">County</SelectItem>
                    <SelectItem value="zip_code">Zip Code</SelectItem>
                    <SelectItem value="experience">Experience</SelectItem>
                    <SelectItem value="transactions">Transactions</SelectItem>
                    <SelectItem value="total_sales">Total Sales</SelectItem>
                    <SelectItem value="qualification_score">Qualification Score</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="source">Source</SelectItem>
                    <SelectItem value="pipeline_stage">Pipeline Stage</SelectItem>
                    <SelectItem value="pipeline_type">Pipeline Type</SelectItem>
                    {customFields.map((field) => (
                      <SelectItem key={field.id} value={field.field_name}>
                        {field.field_name} (Custom)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Operator</Label>
              <Select
                value={rule.operator}
                onValueChange={(value) => updateRule(index, "operator", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="is_present">Is Present</SelectItem>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Value</Label>
              <Input
                value={rule.value}
                onChange={(e) => updateRule(index, "value", e.target.value)}
                placeholder="Enter value to match"
              />
            </div>

            <div>
              <Label>Move to Stage</Label>
              <Select
                value={rule.target_stage}
                onValueChange={(value) => updateRule(index, "target_stage", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pipelineStages.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Input
                type="number"
                value={rule.priority}
                onChange={(e) =>
                  updateRule(index, "priority", parseInt(e.target.value) || 0)
                }
                placeholder="Higher runs first"
              />
            </div>
          </div>
        </Card>
      ))}

      {rules.length > 0 && (
        <Button onClick={saveRules} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Save All Rules
        </Button>
      )}

      {rules.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No qualification rules yet. Add rules to automatically move leads through your pipeline.
        </div>
      )}
    </div>
  );
};

export default QualificationRules;
