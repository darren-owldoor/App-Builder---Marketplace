import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function AddCreditsSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleSuccess = async () => {
      const amount = searchParams.get("amount");
      const payment = searchParams.get("payment");

      if (payment === "success" && amount) {
        try {
          // Get current client
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: clientData } = await supabase
            .from("clients")
            .select("id, credits_balance")
            .eq("user_id", user.id)
            .single();

          if (clientData) {
            const newBalance = (clientData.credits_balance || 0) + parseFloat(amount);
            
            await supabase
              .from("clients")
              .update({ credits_balance: newBalance })
              .eq("id", clientData.id);

            toast({
              title: "Credits Added!",
              description: `$${amount} has been added to your account. New balance: $${newBalance.toFixed(2)}`,
            });
          }
        } catch (error: any) {
          console.error("Error adding credits:", error);
          toast({
            title: "Error",
            description: "Failed to update credits. Please contact support.",
            variant: "destructive",
          });
        }
      } else if (payment === "cancelled") {
        toast({
          title: "Payment Cancelled",
          description: "Credit purchase was cancelled",
        });
      }

      // Clear the URL params after handling
      navigate("/client-dashboard", { replace: true });
    };

    handleSuccess();
  }, [searchParams, navigate, toast]);

  return null;
}
