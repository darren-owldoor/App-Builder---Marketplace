import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

/**
 * Redirect route for /client/match/:id
 * Fetches the match and redirects to the appropriate page
 */
const ClientMatchRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleRedirect = async () => {
      if (!id) {
        navigate("/office/leads");
        return;
      }

      try {
        // Try to fetch match by ID
        const { data: matchData, error: matchError } = await supabase
          .from("matches")
          .select("pro_id")
          .eq("id", id)
          .maybeSingle();

        if (matchError) throw matchError;

        if (matchData?.pro_id) {
          // Redirect to the pro's public profile
          navigate(`/profile/${matchData.pro_id}`);
        } else {
          // If match not found, try to treat it as a pro_id directly
          const { data: proData, error: proError } = await supabase
            .from("pros")
            .select("id")
            .eq("id", id)
            .maybeSingle();

          if (proData) {
            navigate(`/profile/${id}`);
          } else {
            // If nothing found, go to leads page
            toast({
              title: "Match Not Found",
              description: "Redirecting to your leads page...",
              variant: "destructive",
            });
            navigate("/office/leads");
          }
        }
      } catch (error) {
        console.error("Error handling match redirect:", error);
        toast({
          title: "Error",
          description: "Failed to load match details",
          variant: "destructive",
        });
        navigate("/office/leads");
      }
    };

    handleRedirect();
  }, [id, navigate, toast]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading match details...</p>
      </div>
    </div>
  );
};

export default ClientMatchRedirect;
