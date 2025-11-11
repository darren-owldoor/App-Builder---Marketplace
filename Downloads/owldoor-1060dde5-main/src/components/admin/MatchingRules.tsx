import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Target, Plus, Edit2, Trash2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MatchingRule {
  id: string;
  name: string;
  field: string;
  weight: number;
  enabled: boolean;
  condition: string;
  layer: number;
  mandatory?: boolean;
}

// Layer 1: Geographic Matching (MANDATORY - must match to proceed)
const layer1Rules: MatchingRule[] = [
  { id: "geo-1", name: "City & State Match", field: "city_state", weight: 0, enabled: true, condition: "exact", layer: 1, mandatory: true },
  { id: "geo-2", name: "County & State Match", field: "county_state", weight: 0, enabled: true, condition: "exact", layer: 1, mandatory: true },
  { id: "geo-3", name: "Zip Code Match", field: "zip_code", weight: 0, enabled: true, condition: "exact", layer: 1, mandatory: true },
];

// Layer 2+: Secondary criteria (weights must total 100%)
const defaultLayer2Rules: MatchingRule[] = [
  { id: "2", name: "Wants Present", field: "wants", weight: 50, enabled: true, condition: "exists", layer: 2 },
  { id: "3", name: "Motivation over 4", field: "motivation", weight: 50, enabled: true, condition: "minimum", layer: 2 },
];

export const MatchingRules = () => {
  const [layer2Rules, setLayer2Rules] = useState<MatchingRule[]>(defaultLayer2Rules);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<MatchingRule | null>(null);
  const { toast } = useToast();

  const handleSaveRules = () => {
    const totalWeight = layer2Rules.filter(r => r.enabled).reduce((sum, r) => sum + r.weight, 0);
    
    if (Math.abs(totalWeight - 100) > 0.1) {
      toast({
        title: "Invalid weights",
        description: `Layer 2 weights must equal 100%. Current total: ${totalWeight}%`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Rules saved",
      description: "Matching rules have been updated successfully",
    });
  };

  const handleToggleRule = (ruleId: string) => {
    setLayer2Rules(layer2Rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const handleWeightChange = (ruleId: string, newWeight: number) => {
    setLayer2Rules(layer2Rules.map(r => 
      r.id === ruleId ? { ...r, weight: newWeight } : r
    ));
  };

  const handleAddRule = () => {
    toast({
      title: "Not implemented",
      description: "Adding custom matching rules requires backend logic implementation.",
    });
    setIsDialogOpen(false);
  };

  const totalWeight = layer2Rules.filter(r => r.enabled).reduce((sum, r) => sum + r.weight, 0);
  const isValidTotal = Math.abs(totalWeight - 100) < 0.1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Matching Rules & Dependencies
            </CardTitle>
            <CardDescription>
              Configure layered matching criteria for lead-client matching
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Matching Rule</DialogTitle>
                  <DialogDescription>
                    Create a custom matching rule
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Rule Name</Label>
                    <Input placeholder="e.g., Price Range Match" />
                  </div>
                  <div className="space-y-2">
                    <Label>Field</Label>
                    <Input placeholder="e.g., price_range" />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (%)</Label>
                    <Input type="number" placeholder="10" />
                  </div>
                  <Button onClick={handleAddRule} className="w-full">
                    Create Rule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button size="sm" onClick={handleSaveRules} disabled={!isValidTotal}>
              <Save className="mr-2 h-4 w-4" />
              Save Rules
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Layer 1: Geographic Matching (Mandatory) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Layer 1: Geographic Matching</h3>
                <p className="text-xs text-muted-foreground">
                  MANDATORY - At least one must match to proceed (City & State, County & State, or Zip Code)
                </p>
              </div>
            </div>
            
            <div className="space-y-3 pl-8">
              {layer1Rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3 border rounded-lg bg-destructive/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={true}
                        disabled={true}
                      />
                      <div>
                        <p className="font-medium text-sm">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Field: {rule.field} • Condition: {rule.condition}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">REQUIRED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Layer 2: Secondary Criteria */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Layer 2: Secondary Matching Criteria</h3>
                <p className="text-xs text-muted-foreground">
                  Weighted scoring after geographic match is satisfied
                </p>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-muted/30 ml-8">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Total Weight</p>
                <p className={`text-lg font-bold ${isValidTotal ? 'text-success' : 'text-destructive'}`}>
                  {totalWeight.toFixed(1)}%
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {isValidTotal 
                  ? "✓ All enabled rules total to 100%" 
                  : "⚠ Total must equal 100% for matching to work properly"}
              </p>
            </div>

            <div className="space-y-3 pl-8">
              {layer2Rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 border rounded-lg space-y-3 transition-opacity ${
                    rule.enabled ? '' : 'opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => handleToggleRule(rule.id)}
                      />
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Field: {rule.field} • Condition: {rule.condition}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" disabled>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" disabled>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {rule.enabled && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Weight</Label>
                        <span className="text-sm font-medium">{rule.weight}%</span>
                      </div>
                      <Slider
                        value={[rule.weight]}
                        onValueChange={(values) => handleWeightChange(rule.id, values[0])}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};