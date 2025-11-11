import { ZipRadiusSearch as ZipRadiusSearchComponent } from "@/components/ZipRadiusSearch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ZipRadiusSearch = () => {
  const navigate = useNavigate();

  const handleSave = async (data: { name: string; center: { lat: number; lng: number }; radius: number }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save coverage areas");
        return;
      }

      const { error } = await supabase
        .from("market_coverage")
        .insert({
          user_id: user.id,
          name: data.name,
          coverage_type: "radius",
          data: {
            center: data.center,
            radius: data.radius,
            circles: [{
              center: data.center,
              radius: data.radius
            }]
          }
        });

      if (error) {
        console.error('Error saving coverage:', error);
        throw error;
      }
      
      toast.success("Coverage area saved successfully!");
      setTimeout(() => navigate("/market-coverage"), 1500);
    } catch (error: any) {
      console.error("Error saving coverage:", error);
      toast.error(error.message || "Failed to save coverage area");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ZIP Code Radius Search</h1>
          <p className="text-muted-foreground mt-2">
            Search locations and define coverage areas by radius
          </p>
        </div>
        
        <ZipRadiusSearchComponent onSave={handleSave} />
      </div>
    </div>
  );
};

export default ZipRadiusSearch;
