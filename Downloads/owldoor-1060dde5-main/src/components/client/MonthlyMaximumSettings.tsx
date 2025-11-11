import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Loader2, Save } from "lucide-react";

interface MonthlyMaximumSettingsProps {
  clientId: string;
  currentMaximum: number;
  currentSpend: number;
  onUpdate: () => void;
}

export const MonthlyMaximumSettings = ({
  clientId,
  currentMaximum,
  currentSpend,
  onUpdate,
}: MonthlyMaximumSettingsProps) => {
  const [maximum, setMaximum] = useState(currentMaximum.toString());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMaximum(currentMaximum.toString());
  }, [currentMaximum]);

  const handleSave = async () => {
    const newMaximum = parseFloat(maximum);

    if (isNaN(newMaximum) || newMaximum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid maximum amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("clients")
        .update({ monthly_spend_maximum: newMaximum })
        .eq("id", clientId);

      if (error) throw error;

      toast({
        title: "Settings updated",
        description: `Monthly maximum set to $${newMaximum.toLocaleString()}`,
      });

      onUpdate();
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const remainingBudget = Math.max(0, currentMaximum - currentSpend);
  const percentUsed = (currentSpend / currentMaximum) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Monthly Spending Maximum
        </CardTitle>
        <CardDescription>
          Set a maximum monthly spend limit that overrules bidding logic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="maximum">Monthly Maximum ($)</Label>
          <Input
            id="maximum"
            type="number"
            placeholder="Enter maximum"
            value={maximum}
            onChange={(e) => setMaximum(e.target.value)}
            min="1"
            step="1"
            disabled={loading}
          />
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Maximum
            </>
          )}
        </Button>

        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">This Month's Spend:</span>
            <span className="font-medium">${currentSpend.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining Budget:</span>
            <span className="font-medium text-green-600">${remainingBudget.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Budget Used:</span>
            <span className="font-medium">{percentUsed.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full ${
                percentUsed >= 90 ? "bg-red-500" : percentUsed >= 70 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${Math.min(100, percentUsed)}%` }}
            ></div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          When you reach your monthly maximum, the system will stop accepting new bids automatically.
        </p>
      </CardContent>
    </Card>
  );
};
