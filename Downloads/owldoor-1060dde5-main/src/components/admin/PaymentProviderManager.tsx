import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Circle, CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PaymentProvider {
  id: string;
  provider_name: string;
  is_active: boolean;
  config: any;
}

export default function PaymentProviderManager() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_providers")
        .select("*")
        .order("provider_name");

      if (error) throw error;
      setProviders(data || []);
    } catch (error: any) {
      console.error("Error loading providers:", error);
      toast.error("Failed to load payment providers");
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (providerId: string) => {
    if (!confirm("Switch payment provider? This will affect all future transactions.")) return;

    setSwitching(true);
    try {
      // Deactivate all providers first
      await supabase
        .from("payment_providers")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all

      // Activate selected provider
      const { error } = await supabase
        .from("payment_providers")
        .update({ is_active: true })
        .eq("id", providerId);

      if (error) throw error;

      toast.success("Payment provider activated successfully");
      loadProviders();
    } catch (error: any) {
      console.error("Error switching provider:", error);
      toast.error("Failed to switch payment provider");
    } finally {
      setSwitching(false);
    }
  };

  const getProviderIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "stripe":
        return "💳";
      case "paddle":
        return "🏄";
      default:
        return "💰";
    }
  };

  const activeProvider = providers.find((p) => p.is_active);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Provider Management
        </CardTitle>
        <CardDescription>
          Select which payment provider to use (only one can be active at a time)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Active Provider</AlertTitle>
          <AlertDescription>
            Currently using: <strong>{activeProvider?.provider_name || "None"}</strong>
          </AlertDescription>
        </Alert>

        {loading ? (
          <p className="text-center py-4 text-muted-foreground">Loading providers...</p>
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                  provider.is_active
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getProviderIcon(provider.provider_name)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold capitalize">{provider.provider_name}</h3>
                      {provider.is_active && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {provider.provider_name === "stripe" &&
                        "Primary payment provider for cards, subscriptions, and saved payment methods"}
                      {provider.provider_name === "paddle" &&
                        "Alternative payment provider with global payment support"}
                    </p>
                  </div>
                </div>
                <Button
                  variant={provider.is_active ? "outline" : "default"}
                  size="sm"
                  disabled={provider.is_active || switching}
                  onClick={() => handleSetActive(provider.id)}
                >
                  {provider.is_active ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : (
                    <Circle className="h-4 w-4 mr-2" />
                  )}
                  {provider.is_active ? "Active" : "Activate"}
                </Button>
              </div>
            ))}
          </div>
        )}

        <Alert variant="destructive" className="mt-4">
          <AlertTitle>⚠️ Important</AlertTitle>
          <AlertDescription>
            Switching payment providers will affect all new transactions. Existing subscriptions and
            payment methods will remain with their original provider.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
