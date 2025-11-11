import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CreditCard, DollarSign, Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PaymentIntegrations = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [paddleVendorId, setPaddleVendorId] = useState("");
  const [paddleApiKey, setPaddleApiKey] = useState("");
  const [paddleConfigured, setPaddleConfigured] = useState(false);

  useEffect(() => {
    checkExistingConfigs();
  }, []);

  const checkExistingConfigs = async () => {
    try {
      // Stripe is assumed to be configured (check secrets in admin)
      setStripeConfigured(true);

      const { data: configs } = await supabase
        .from('payment_configs')
        .select('provider, configured')
        .eq('provider', 'paddle');
      
      if (configs?.[0]?.configured) {
        setPaddleConfigured(true);
      }
    } catch (error) {
      console.error('Error checking configs:', error);
    }
  };

  const savePaddleConfig = async () => {
    if (!paddleVendorId || !paddleApiKey) {
      toast({
        title: "Missing Information",
        description: "Please provide both Paddle Vendor ID and API Key",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('save-payment-config', {
        body: {
          provider: 'paddle',
          config: {
            vendor_id: paddleVendorId,
            api_key: paddleApiKey,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Paddle configuration saved successfully",
      });
      setPaddleConfigured(true);
      setPaddleVendorId("");
      setPaddleApiKey("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save Paddle configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stripe Integration - Primary/Active */}
      <Card className="border-2 border-primary/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Stripe (Active)</CardTitle>
            </div>
            {stripeConfigured && (
              <Badge variant="default" className="bg-green-600">
                ✓ Live
              </Badge>
            )}
          </div>
          <CardDescription>
            Primary payment provider for recruit purchases, subscriptions, and saved payment methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <p className="font-medium">{stripeConfigured ? 'Connected' : 'Not Connected'}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Webhook</p>
              <p className="font-mono text-xs">stripe-webhook</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Features</p>
              <p className="text-xs">Instant Payments</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Payment Methods</p>
              <p className="text-xs">Card, Saved Cards</p>
            </div>
          </div>
          {!stripeConfigured && (
            <p className="text-sm text-muted-foreground mt-2">
              Configure STRIPE_WEBHOOK_SECRET in Secrets to enable Stripe payments.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Alternative Payment Providers */}
      <div className="pt-4 border-t">
        <h3 className="text-lg font-semibold mb-4">Alternative Payment Providers</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure additional payment providers for testing or alternative use cases
        </p>
      </div>

      {/* Paddle Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Waves className="h-5 w-5" />
            <CardTitle>Paddle Integration</CardTitle>
          </div>
          <CardDescription>
            Configure your Paddle subscription and payment processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paddleConfigured && (
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">✓ Paddle is configured</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="paddle-vendor-id">Vendor ID</Label>
            <Input
              id="paddle-vendor-id"
              placeholder="Enter your Paddle Vendor ID"
              value={paddleVendorId}
              onChange={(e) => setPaddleVendorId(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paddle-api-key">API Key</Label>
            <Input
              id="paddle-api-key"
              type="password"
              placeholder="Enter your Paddle API Key"
              value={paddleApiKey}
              onChange={(e) => setPaddleApiKey(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button 
            onClick={savePaddleConfig}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Paddle Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentIntegrations;
