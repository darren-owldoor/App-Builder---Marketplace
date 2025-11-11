import { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = async () => {
  if (!stripePromise) {
    try {
      const { data, error } = await supabase.functions.invoke("get-stripe-config");
      if (error) throw error;
      if (data?.publishableKey) {
        stripePromise = loadStripe(data.publishableKey);
      }
    } catch (err) {
      console.error("Failed to load Stripe config:", err);
      stripePromise = Promise.resolve(null);
    }
  }
  return stripePromise;
};

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentForm = ({ clientSecret, onSuccess, onCancel }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setError("Payment system not ready. Please refresh the page.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: setupError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (setupError) {
        throw new Error(setupError.message || "Failed to process payment method");
      }

      if (!setupIntent) {
        throw new Error("Payment setup failed. Please try again.");
      }

      // Confirm with backend
      const { error: confirmError } = await supabase.functions.invoke("confirm-payment-method", {
        body: { setup_intent_id: setupIntent.id },
      });

      if (confirmError) {
        throw new Error(confirmError.message || "Failed to save payment method");
      }

      toast({
        title: "Payment method added",
        description: "Your card has been saved successfully",
      });

      onSuccess();
    } catch (err: any) {
      const errorMessage = err.message || "Failed to add payment method. Please try again.";
      setError(errorMessage);
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Payment setup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <PaymentElement 
        options={{
          fields: {
            billingDetails: {
              address: {
                country: 'auto'
              }
            }
          }
        }}
      />
      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Add Card
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

interface PaymentMethodManagerProps {
  hasPaymentMethod: boolean;
  onUpdate: () => void;
}

export const PaymentMethodManager = ({ hasPaymentMethod, onUpdate }: PaymentMethodManagerProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getStripe().then((stripeInstance) => {
      if (stripeInstance) {
        setStripe(stripeInstance);
      } else {
        toast({
          title: "Stripe Configuration Error",
          description: "Failed to load Stripe. Please refresh the page or contact support.",
          variant: "destructive",
        });
      }
    });
  }, [toast]);

  const handleAddCard = async () => {
    if (!stripe) {
      toast({
        title: "Payment System Not Ready",
        description: "Please wait a moment and try again",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-payment-method");
      
      if (error) {
        throw new Error(error.message || "Failed to initialize payment");
      }
      
      if (!data?.client_secret) {
        throw new Error("Invalid response from payment system");
      }

      setClientSecret(data.client_secret);
      setShowDialog(true);
    } catch (err: any) {
      console.error("Payment setup error:", err);
      toast({
        title: "Setup Failed",
        description: err.message || "Unable to setup payment method. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowDialog(false);
    setClientSecret(null);
    onUpdate();
  };

  if (hasPaymentMethod) {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            Payment Method Added
          </CardTitle>
          <CardDescription>
            Your card is on file and ready for credit purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleAddCard} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            Update Card
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Payment Method
          </CardTitle>
          <CardDescription>
            Add a card to purchase credits and maintain your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAddCard} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            Add Card
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Enter your card details to add a payment method
            </DialogDescription>
          </DialogHeader>
          {clientSecret && stripe && (
            <Elements stripe={stripe} options={{ clientSecret }}>
              <PaymentForm
                clientSecret={clientSecret}
                onSuccess={handleSuccess}
                onCancel={() => {
                  setShowDialog(false);
                  setClientSecret(null);
                }}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
