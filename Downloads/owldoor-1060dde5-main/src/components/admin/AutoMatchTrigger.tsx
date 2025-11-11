import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { toast } from "sonner";

export function AutoMatchTrigger() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAutoMatch = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-match-leads');
      
      if (error) throw error;
      
      toast.success(`Auto-match completed! Processed ${data?.processed || 0} leads.`);
    } catch (error: any) {
      console.error('Auto-match error:', error);
      toast.error(`Auto-match failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Auto-Match Engine
        </CardTitle>
        <CardDescription>
          Automatically match qualified leads with clients who have credits and matching criteria
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The auto-match system will:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Find all leads in "match_ready" stage</li>
            <li>Match them with clients based on location and preferences</li>
            <li>Deduct credits automatically for successful matches</li>
            <li>Create "missed match" entries for clients without enough credits</li>
            <li>Support both exclusive (1-to-1) and non-exclusive (1-to-many) matching</li>
          </ul>
          <Button 
            onClick={handleAutoMatch} 
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? "Processing..." : "Run Auto-Match Now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
