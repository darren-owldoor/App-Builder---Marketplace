import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
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

interface StepCondition {
  id?: string;
  condition_type: string;
  condition_values: string[];
  condition_time_value?: number;
  condition_time_unit?: string;
  action_type: string;
  action_value?: string;
  order_index: number;
}

interface StepConditionBuilderProps {
  stepId: string;
  pipelineType: "staff" | "client";
}

const StepConditionBuilder = ({ stepId, pipelineType }: StepConditionBuilderProps) => {
  const [conditions, setConditions] = useState<StepCondition[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [newPhrase, setNewPhrase] = useState("");
  const [editingCondition, setEditingCondition] = useState<number | null>(null);

  const pipelineStages = pipelineType === "staff" ? STAFF_PIPELINE_STAGES : CLIENT_PIPELINE_STAGES;

  useEffect(() => {
    fetchConditions();
    fetchCampaigns();
  }, [stepId]);

  const fetchConditions = async () => {
    const { data, error } = await supabase
      .from("campaign_step_conditions")
      .select("*")
      .eq("step_id", stepId)
      .order("order_index");

    if (error) {
      console.error("Error fetching conditions:", error);
      return;
    }

    setConditions(data || []);
  };

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from("campaign_templates")
      .select("id, name")
      .eq("active", true);

    if (error) {
      console.error("Error fetching campaigns:", error);
      return;
    }

    setCampaigns(data || []);
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        condition_type: "response_contains",
        condition_values: [],
        action_type: "proceed",
        order_index: conditions.length,
      },
    ]);
    setEditingCondition(conditions.length);
  };

  const updateCondition = (index: number, field: string, value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const addPhrase = (index: number) => {
    if (!newPhrase.trim()) return;
    
    const updated = [...conditions];
    updated[index].condition_values = [
      ...(updated[index].condition_values || []),
      newPhrase.trim(),
    ];
    setConditions(updated);
    setNewPhrase("");
  };

  const removePhrase = (conditionIndex: number, phraseIndex: number) => {
    const updated = [...conditions];
    updated[conditionIndex].condition_values = updated[conditionIndex].condition_values.filter(
      (_, i) => i !== phraseIndex
    );
    setConditions(updated);
  };

  const removeCondition = async (index: number) => {
    const condition = conditions[index];
    if (condition.id) {
      const { error } = await supabase
        .from("campaign_step_conditions")
        .delete()
        .eq("id", condition.id);

      if (error) {
        toast.error("Failed to delete condition");
        return;
      }
    }

    setConditions(conditions.filter((_, i) => i !== index));
    toast.success("Condition removed");
  };

  const saveConditions = async () => {
    try {
      for (const condition of conditions) {
        if (condition.id) {
          const { error } = await supabase
            .from("campaign_step_conditions")
            .update({
              condition_type: condition.condition_type,
              condition_values: condition.condition_values,
              condition_time_value: condition.condition_time_value,
              condition_time_unit: condition.condition_time_unit,
              action_type: condition.action_type,
              action_value: condition.action_value,
              order_index: condition.order_index,
            })
            .eq("id", condition.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("campaign_step_conditions")
            .insert({
              step_id: stepId,
              ...condition,
            });

          if (error) throw error;
        }
      }

      toast.success("Conditions saved successfully");
      fetchConditions();
    } catch (error) {
      console.error("Error saving conditions:", error);
      toast.error("Failed to save conditions");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">If/Then Conditions</h3>
        <Button onClick={addCondition} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Condition
        </Button>
      </div>

      {conditions.map((condition, index) => (
        <Card key={index} className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Condition {index + 1}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeCondition(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4">
            <div>
              <Label>If</Label>
              <Select
                value={condition.condition_type}
                onValueChange={(value) =>
                  updateCondition(index, "condition_type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="response_is_present">Response Is Present</SelectItem>
                  <SelectItem value="response_is">Response Is</SelectItem>
                  <SelectItem value="response_is_not">Response Is Not</SelectItem>
                  <SelectItem value="response_contains">Response Contains</SelectItem>
                  <SelectItem value="response_does_not_contain">
                    Response Does Not Contain
                  </SelectItem>
                  <SelectItem value="no_response_after">No Response After</SelectItem>
                  <SelectItem value="ai_analyze">Have AI Analyze Response</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {["response_is", "response_is_not", "response_contains", "response_does_not_contain"].includes(
              condition.condition_type
            ) && (
              <div>
                <Label>Words/Phrases</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Enter word or phrase"
                    value={editingCondition === index ? newPhrase : ""}
                    onChange={(e) => {
                      setEditingCondition(index);
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
                  {condition.condition_values?.map((phrase, phraseIndex) => (
                    <Badge key={phraseIndex} variant="secondary">
                      {phrase}
                      <button
                        onClick={() => removePhrase(index, phraseIndex)}
                        className="ml-2"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {condition.condition_type === "no_response_after" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Time Value</Label>
                  <Input
                    type="number"
                    value={condition.condition_time_value || ""}
                    onChange={(e) =>
                      updateCondition(index, "condition_time_value", parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label>Time Unit</Label>
                  <Select
                    value={condition.condition_time_unit || "hours"}
                    onValueChange={(value) =>
                      updateCondition(index, "condition_time_unit", value)
                    }
                  >
                    <SelectTrigger>
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

            <div>
              <Label>Then</Label>
              <Select
                value={condition.action_type}
                onValueChange={(value) =>
                  updateCondition(index, "action_type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="end">End Campaign</SelectItem>
                  <SelectItem value="proceed">Proceed to Next Step</SelectItem>
                  <SelectItem value="move_to_stage">Move to Pipeline Stage</SelectItem>
                  <SelectItem value="move_to_campaign">Move to Campaign</SelectItem>
                  <SelectItem value="ai_respond">Have AI Respond</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {condition.action_type === "move_to_stage" && (
              <div>
                <Label>Target Stage</Label>
                <Select
                  value={condition.action_value || ""}
                  onValueChange={(value) =>
                    updateCondition(index, "action_value", value)
                  }
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
            )}

            {condition.action_type === "move_to_campaign" && (
              <div>
                <Label>Target Campaign</Label>
                <Select
                  value={condition.action_value || ""}
                  onValueChange={(value) =>
                    updateCondition(index, "action_value", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </Card>
      ))}

      {conditions.length > 0 && (
        <Button onClick={saveConditions} className="w-full">
          Save All Conditions
        </Button>
      )}
    </div>
  );
};

export default StepConditionBuilder;
