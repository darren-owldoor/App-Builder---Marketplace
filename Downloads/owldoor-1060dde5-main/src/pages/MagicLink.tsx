import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MagicLink = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processMagicLink = async () => {
      if (!token) {
        toast.error("Invalid magic link");
        navigate("/");
        return;
      }

      try {
        console.log("Processing magic link with token:", token);

        // Call edge function to verify and process magic link
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
          'verify-magic-link',
          {
            body: { token }
          }
        );

        if (verifyError || !verifyData.success) {
          console.error("Magic link verification failed:", verifyError);
          toast.error(verifyData?.error || "Invalid or expired magic link");
          navigate("/");
          return;
        }

        // Sign in the user with the credentials from the edge function
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: verifyData.email,
          password: verifyData.password,
        });

        if (signInError) {
          console.error("Sign in error:", signInError);
          toast.error("Failed to sign in. Please try again.");
          navigate("/");
          return;
        }

        toast.success("Welcome to OwlDoor!");
        
        // Navigate to appropriate dashboard
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", signInData.user.id);

        if (roles && roles.length > 0) {
          const rolesList = roles.map(r => r.role);
          if (rolesList.includes("admin")) {
            navigate("/admin/dashboard");
          } else if (rolesList.includes("staff")) {
            navigate("/staff/dashboard");
          } else if (rolesList.includes("client")) {
            navigate("/clients");
          } else {
            // Check agent completion status
            const { data: agent } = await supabase
              .from("pros")
              .select("specialization, matching_completed, market_coverage_completed")
              .eq("user_id", signInData.user.id)
              .single();

            if (agent) {
              // If matching not completed, go to matching
              if (!agent.matching_completed) {
                if (agent.specialization === "mortgage") {
                  navigate("/mortgage-matching");
                } else {
                  navigate("/matching");
                }
              }
              // If matching done but market coverage not done, go to market coverage
              else if (!agent.market_coverage_completed) {
                navigate("/market-coverage");
              }
              // Everything completed, go to dashboard
              else {
                navigate("/agents/map");
              }
            } else {
              navigate("/agents/map");
            }
          }
        } else {
          navigate("/agents/map");
        }
      } catch (error) {
        console.error("Error processing magic link:", error);
        toast.error("An error occurred. Please try again.");
        navigate("/");
      } finally {
        setIsProcessing(false);
      }
    };

    processMagicLink();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Processing your login...</p>
          </>
        ) : (
          <p className="text-lg text-muted-foreground">Redirecting...</p>
        )}
      </div>
    </div>
  );
};

export default MagicLink;
