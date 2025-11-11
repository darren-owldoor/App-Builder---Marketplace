import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AutoChargeSettingsProps {
  clientId: string;
  hasPaymentMethod: boolean;
}

export const AutoChargeSettings = ({ clientId, hasPaymentMethod }: AutoChargeSettingsProps) => {
  const [autoChargeEnabled, setAutoChargeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [clientId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("auto_charge_enabled")
        .eq("id", clientId)
        .single();

      if (error) throw error;
      setAutoChargeEnabled(data?.auto_charge_enabled || false);
    } catch (error: any) {
      console.error("Error loading auto-charge settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    if (enabled && !hasPaymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please add a payment method before enabling auto-charge",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({ auto_charge_enabled: enabled })
        .eq("id", clientId);

      if (error) throw error;

      setAutoChargeEnabled(enabled);
      toast({
        title: enabled ? "Auto-Charge Enabled" : "Auto-Charge Disabled",
        description: enabled 
          ? "New recruits will be automatically charged to your payment method"
          : "You'll need to manually purchase each recruit",
      });
    } catch (error: any) {
      console.error("Error updating auto-charge setting:", error);
      toast({
        title: "Error",
        description: "Failed to update auto-charge setting",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Auto-Purchase Recruits
        </CardTitle>
        <CardDescription>
          Automatically charge your payment method when new recruits match your criteria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasPaymentMethod && (
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              Add a payment method to enable automatic charging
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-charge" className="text-base">
              Enable Auto-Charge
            </Label>
            <p className="text-sm text-muted-foreground">
              {autoChargeEnabled 
                ? "New recruits will be charged automatically" 
                : "You'll manually approve each recruit purchase"}
            </p>
          </div>
          <Switch
            id="auto-charge"
            checked={autoChargeEnabled}
            onCheckedChange={handleToggle}
            disabled={updating || !hasPaymentMethod}
          />
        </div>

        {autoChargeEnabled && (
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">How it works:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Recruits matching your bids are automatically charged</li>
              <li>• Your saved payment method is used</li>
              <li>• Cost is based on recruit qualification (Basic: $200, Qualified: $300, Premium: $500)</li>
              <li>• You receive instant notification and recruit details</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
