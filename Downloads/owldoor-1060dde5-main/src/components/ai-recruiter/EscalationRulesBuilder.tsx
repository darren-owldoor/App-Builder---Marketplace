import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AI_LEAD_STAGES = [
  { value: "new_lead", label: "New Lead" },
  { value: "engaged", label: "Engaged" },
  { value: "hot_lead", label: "Hot Lead" },
  { value: "booked_appt", label: "Booked Appt" },
  { value: "nurture", label: "Nurture" },
  { value: "dead", label: "Dead" },
];

interface EscalationRule {
  id?: string;
  condition_type: string;
  condition_values: string[];
  condition_time_value?: number;
  condition_time_unit?: string;
  action_type: string;
  action_value?: string;
  order_index: number;
  active: boolean;
}

interface EscalationRulesBuilderProps {
  clientId?: string;
}

export function EscalationRulesBuilder({ clientId }: EscalationRulesBuilderProps) {
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [newPhrase, setNewPhrase] = useState("");
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchRules();
    }
  }, [clientId]);

  const fetchRules = async () => {
    if (!clientId) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from("ai_escalation_rules")
      .select("*")
      .eq("client_id", clientId)
      .order("order_index");

    if (error) {
      console.error("Error fetching rules:", error);
      toast.error("Failed to load escalation rules");
    } else {
      setRules(data || []);
    }
    setIsLoading(false);
  };

  const addRule = () => {
    setRules([
      ...rules,
      {
        condition_type: "no_response_after",
        condition_values: [],
        condition_time_value: 15,
        condition_time_unit: "minutes",
        action_type: "escalate_to_human",
        order_index: rules.length,
        active: true,
      },
    ]);
    setEditingRule(rules.length);
  };

  const updateRule = (index: number, field: string, value: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const addPhrase = (index: number) => {
    if (!newPhrase.trim()) return;
    
    const updated = [...rules];
    updated[index].condition_values = [
      ...(updated[index].condition_values || []),
      newPhrase.trim(),
    ];
    setRules(updated);
    setNewPhrase("");
  };

  const removePhrase = (ruleIndex: number, phraseIndex: number) => {
    const updated = [...rules];
    updated[ruleIndex].condition_values = updated[ruleIndex].condition_values.filter(
      (_, i) => i !== phraseIndex
    );
    setRules(updated);
  };

  const removeRule = async (index: number) => {
    const rule = rules[index];
    if (rule.id) {
      const { error } = await supabase
        .from("ai_escalation_rules")
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
    if (!clientId) {
      toast.error("No client ID provided");
      return;
    }

    setIsLoading(true);
    try {
      for (const rule of rules) {
        if (rule.id) {
          const { error } = await supabase
            .from("ai_escalation_rules")
            .update({
              condition_type: rule.condition_type,
              condition_values: rule.condition_values,
              condition_time_value: rule.condition_time_value,
              condition_time_unit: rule.condition_time_unit,
              action_type: rule.action_type,
              action_value: rule.action_value,
              order_index: rule.order_index,
              active: rule.active,
            })
            .eq("id", rule.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("ai_escalation_rules")
            .insert({
              client_id: clientId,
              ...rule,
            });

          if (error) throw error;
        }
      }

      toast.success("Escalation rules saved successfully");
      fetchRules();
    } catch (error) {
      console.error("Error saving rules:", error);
      toast.error("Failed to save escalation rules");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && rules.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="text-center text-gray-400">Loading escalation rules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Automation Rules (IF-THEN Logic)</h3>
            <p className="text-sm text-gray-600">Set up automatic actions based on lead behavior</p>
          </div>
        </div>
        <Button onClick={addRule} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {rules.length === 0 && (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold text-lg mb-2">No Automation Rules Yet</h4>
            <p className="text-gray-600 mb-4">
              Create IF-THEN rules to automatically escalate leads, change stages, or trigger AI responses based on their behavior.
            </p>
            <Button onClick={addRule} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Rule
            </Button>
          </div>
        </Card>
      )}

      {rules.map((rule, index) => (
        <Card key={index} className="p-6 space-y-4 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={rule.active ? "default" : "secondary"}>
                Rule {index + 1}
              </Badge>
              {!rule.active && (
                <span className="text-sm text-gray-500">(Disabled)</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateRule(index, "active", !rule.active)}
              >
                {rule.active ? "Disable" : "Enable"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRule(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <Label className="text-base font-semibold">IF</Label>
              <Select
                value={rule.condition_type}
                onValueChange={(value) =>
                  updateRule(index, "condition_type", value)
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_response_after">I don't reply after...</SelectItem>
                  <SelectItem value="lead_no_response_after">Lead doesn't respond after...</SelectItem>
                  <SelectItem value="response_contains">Lead says (contains)...</SelectItem>
                  <SelectItem value="response_does_not_contain">Lead doesn't say...</SelectItem>
                  <SelectItem value="message_count_exceeds">Message count exceeds...</SelectItem>
                  <SelectItem value="stage_is">Lead stage is...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {["response_contains", "response_does_not_contain"].includes(
              rule.condition_type
            ) && (
              <div>
                <Label>Keywords/Phrases</Label>
                <div className="flex gap-2 mb-2 mt-1.5">
                  <Input
                    placeholder="Enter word or phrase"
                    value={editingRule === index ? newPhrase : ""}
                    onChange={(e) => {
                      setEditingRule(index);
                      setNewPhrase(e.target.value);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addPhrase(index);
                      }
                    }}
                  />
                  <Button onClick={() => addPhrase(index)} size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rule.condition_values?.map((phrase, phraseIndex) => (
                    <Badge key={phraseIndex} variant="secondary" className="gap-1">
                      {phrase}
                      <button
                        onClick={() => removePhrase(index, phraseIndex)}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {["no_response_after", "lead_no_response_after"].includes(rule.condition_type) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Time Value</Label>
                  <Input
                    type="number"
                    min="1"
                    value={rule.condition_time_value || ""}
                    onChange={(e) =>
                      updateRule(index, "condition_time_value", parseInt(e.target.value))
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Time Unit</Label>
                  <Select
                    value={rule.condition_time_unit || "minutes"}
                    onValueChange={(value) =>
                      updateRule(index, "condition_time_unit", value)
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {rule.condition_type === "message_count_exceeds" && (
              <div>
                <Label>Message Count Threshold</Label>
                <Input
                  type="number"
                  min="1"
                  value={rule.condition_time_value || ""}
                  onChange={(e) =>
                    updateRule(index, "condition_time_value", parseInt(e.target.value))
                  }
                  placeholder="e.g., 5"
                  className="mt-1.5"
                />
              </div>
            )}

            {rule.condition_type === "stage_is" && (
              <div>
                <Label>Lead Stage</Label>
                <Select
                  value={rule.condition_values?.[0] || ""}
                  onValueChange={(value) =>
                    updateRule(index, "condition_values", [value])
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_LEAD_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-base font-semibold">THEN</Label>
              <Select
                value={rule.action_type}
                onValueChange={(value) =>
                  updateRule(index, "action_type", value)
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="escalate_to_human">Escalate to me (notify me to take over)</SelectItem>
                  <SelectItem value="ai_respond">Have AI send follow-up</SelectItem>
                  <SelectItem value="move_to_stage">Move to stage</SelectItem>
                  <SelectItem value="send_notification">Send me a notification</SelectItem>
                  <SelectItem value="mark_hot">Mark as HOT lead</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {rule.action_type === "move_to_stage" && (
              <div>
                <Label>Target Stage</Label>
                <Select
                  value={rule.action_value || ""}
                  onValueChange={(value) =>
                    updateRule(index, "action_value", value)
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_LEAD_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {rule.action_type === "ai_respond" && (
              <div>
                <Label>AI Follow-up Message (optional - AI will use default if blank)</Label>
                <Input
                  value={rule.action_value || ""}
                  onChange={(e) =>
                    updateRule(index, "action_value", e.target.value)
                  }
                  placeholder="e.g., 'Hey! Just checking in - still interested?'"
                  className="mt-1.5"
                />
              </div>
            )}
          </div>
        </Card>
      ))}

      {rules.length > 0 && (
        <Button 
          onClick={saveRules} 
          disabled={isLoading}
          className="w-full h-12 text-base font-bold"
        >
          {isLoading ? "Saving..." : "💾 Save All Automation Rules"}
        </Button>
      )}
    </div>
  );
}
