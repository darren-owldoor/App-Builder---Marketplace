import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { PaymentMethodManager } from "@/components/client/PaymentMethodManager";

const PaymentSetup = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [paymentAdded, setPaymentAdded] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      if (!token) {
        throw new Error("Invalid token");
      }

      // Verify token and get client info
      const { data: tokenData, error: tokenError } = await supabase
        .from("payment_setup_tokens")
        .select("*, clients(id, company_name, email, user_id, has_payment_method)")
        .eq("id", token)
        .eq("used", false)
        .single();

      if (tokenError || !tokenData) {
        throw new Error("Invalid or expired token");
      }

      // Check expiration
      const expiresAt = new Date(tokenData.expires_at);
      if (expiresAt < new Date()) {
        throw new Error("This link has expired");
      }

      // Check if already has payment method
      if (tokenData.clients.has_payment_method) {
        toast.info("This account already has a payment method set up");
        setPaymentAdded(true);
      }

      setClientInfo(tokenData.clients);
      setValid(true);
    } catch (error: any) {
      console.error("Token validation error:", error);
      toast.error(error.message || "Invalid payment setup link");
      setValid(false);
    } finally {
      setLoading(false);
    }
  };

  const markTokenAsUsed = async () => {
    try {
      await supabase
        .from("payment_setup_tokens")
        .update({ used: true })
        .eq("id", token);
    } catch (error) {
      console.error("Error marking token as used:", error);
    }
  };

  const handlePaymentSuccess = async () => {
    await markTokenAsUsed();
    setPaymentAdded(true);
    toast.success("Payment method added successfully!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Verifying payment setup link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Invalid Link</CardTitle>
            </div>
            <CardDescription>
              This payment setup link is invalid or has expired. Please contact your administrator for a new link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentAdded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <CardTitle>Payment Method Added</CardTitle>
            </div>
            <CardDescription>
              Your payment method has been successfully set up for {clientInfo?.company_name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Add Payment Method</CardTitle>
          <CardDescription>
            Set up a payment method for {clientInfo?.company_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentMethodManager
            hasPaymentMethod={false}
            onUpdate={handlePaymentSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSetup;