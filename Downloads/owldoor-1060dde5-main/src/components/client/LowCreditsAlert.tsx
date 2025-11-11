import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LowCreditsAlertProps {
  credits: number;
  hasPackage: boolean;
}

export function LowCreditsAlert({ credits, hasPackage }: LowCreditsAlertProps) {
  const [addCreditsOpen, setAddCreditsOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("500");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddCredits = async () => {
    setLoading(true);
    try {
      const amount = parseFloat(creditAmount);
      if (amount < 100) {
        toast({
          title: "Minimum amount",
          description: "Minimum credit purchase is $100",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { amount },
      });

      if (error) throw error;

      if (data?.url) {
        // Open checkout in new tab
        window.open(data.url, "_blank");
        toast({
          title: "Redirecting to checkout",
          description: "Complete payment to add credits to your account",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show alert if credits are low (below $100)
  if (credits <= 100 && hasPackage) {
    return (
      <>
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Low Dollar Credits - Payment Method Required</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Your dollar credit balance is ${credits.toFixed(2)}. Add dollar credits to continue receiving leads.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddCreditsOpen(true)}
              className="ml-4"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Add Dollar Credits
            </Button>
          </AlertDescription>
        </Alert>

        <Dialog open={addCreditsOpen} onOpenChange={setAddCreditsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Dollar Credits</DialogTitle>
              <DialogDescription>
                Purchase dollar credits to continue receiving leads. Each credit = $1. Credits never expire.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="amount">Dollar Credit Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="100"
                  step="50"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum: $100
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCreditAmount("250")}
                >
                  $250
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCreditAmount("500")}
                >
                  $500
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCreditAmount("1000")}
                >
                  $1,000
                </Button>
              </div>
            </div>
            <Button
              onClick={handleAddCredits}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Processing..." : `Add $${creditAmount} in Dollar Credits`}
            </Button>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Show warning if no package assigned
  if (!hasPackage) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Package Assigned</AlertTitle>
        <AlertDescription>
          You need an active package to receive leads. Please contact support to get started.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
