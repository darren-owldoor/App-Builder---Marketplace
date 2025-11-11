import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Loader2 } from "lucide-react";

interface CreditPurchaseFormProps {
  hasPaymentMethod: boolean;
  currentBalance: number;
  onSuccess: () => void;
}

export const CreditPurchaseForm = ({ hasPaymentMethod, currentBalance, onSuccess }: CreditPurchaseFormProps) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async () => {
    const purchaseAmount = parseFloat(amount);
    
    if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (purchaseAmount > 1000) {
      toast({
        title: "Amount too high",
        description: "Maximum purchase is $1,000 per transaction",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("purchase-credits", {
        body: { amount: purchaseAmount },
      });

      if (error) throw error;

      toast({
        title: "Dollar credits purchased",
        description: `Successfully added $${purchaseAmount} in dollar credits. New balance: $${data.new_balance}`,
      });

      setAmount("");
      onSuccess();
    } catch (err: any) {
      toast({
        title: "Purchase failed",
        description: err.message || "Failed to purchase credits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [50, 100, 250, 500, 1000];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Dollar Credits</CardTitle>
        <CardDescription>
          Add dollar credits ($) to your account - each credit = $1 (Maximum: $1,000 per purchase)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasPaymentMethod && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-md">
            <p className="text-sm text-yellow-600">
              Please add a payment method before purchasing credits
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="amount">Amount ($)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max="1000"
              step="1"
              className="pl-9"
              disabled={!hasPaymentMethod || loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Quick Select</Label>
          <div className="grid grid-cols-5 gap-2">
            {quickAmounts.map((amt) => (
              <Button
                key={amt}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(amt.toString())}
                disabled={!hasPaymentMethod || loading}
              >
                ${amt}
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={handlePurchase}
          disabled={!hasPaymentMethod || !amount || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <DollarSign className="mr-2 h-4 w-4" />
              Purchase ${amount || "0"} in Dollar Credits
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Current Balance: ${currentBalance.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
};
