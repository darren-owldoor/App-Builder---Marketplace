import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

export function SeedDemoButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSeedDemo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-ai-demo-data');

      if (error) throw error;

      toast({
        title: "Demo Data Created",
        description: `${data.matches_created} demo recruits with conversations have been added`,
      });
    } catch (error) {
      console.error('Error seeding demo data:', error);
      toast({
        title: "Error",
        description: "Failed to create demo data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSeedDemo}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating Demo...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Load Demo Data
        </>
      )}
    </Button>
  );
}
