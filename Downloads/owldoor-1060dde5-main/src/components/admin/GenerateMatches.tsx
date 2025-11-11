import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Zap, Brain } from "lucide-react";
import { normalizeState } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MatchBreakdownModal } from "./MatchBreakdownModal";

export const GenerateMatches = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const useAI = true; // Always use AI - powered by OwlDoor.com
  const [selectedBreakdown, setSelectedBreakdown] = useState<any>(null);
  const [selectedProName, setSelectedProName] = useState("");
  const [selectedClientName, setSelectedClientName] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { toast } = useToast();

  const handleGenerateMatches = async () => {
    setIsGenerating(true);
    setSelectedBreakdown(null);
    try {
      // Fetch all pros with "match_ready" status only
      const { data: leads, error: leadsError } = await supabase
        .from("pros")
        .select("*")
        .eq("status", "match_ready")
        .limit(10);

      if (leadsError) throw leadsError;

      // Fetch all clients
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .limit(5);

      if (clientsError) throw clientsError;

      if (!leads?.length || !clients?.length) {
        toast({
          title: "No data to match",
          description: "Please ensure you have leads with 'Match Ready' status and active clients",
          variant: "destructive",
        });
        return;
      }

      // Generate matches with AI-powered scoring if enabled
      let matchesCreated = 0;
      const matchBreakdowns: any[] = [];

      for (const lead of leads) {
        // CRITICAL VALIDATION: Paid leads must have motivation OR wants
        const hasMotivation = lead.motivation !== null && lead.motivation !== undefined && lead.motivation > 0;
        const hasWants = lead.wants && Array.isArray(lead.wants) && lead.wants.length > 0;
        
        if (!hasMotivation && !hasWants) {
          console.warn(`Skipping lead ${lead.full_name} - missing motivation or wants (required for paid leads)`);
          continue;
        }

        // Find best matching client based on location overlap
        let bestClient = null;
        let bestScore = 0;
        let hasLocationMatch = false;
        
        for (const client of clients) {
          let locationScore = 0;
          let clientHasLocationMatch = false;
          
          // Check zip code match - ANY ONE zip match counts
          if (lead.zip_codes?.length && client.zip_codes?.length) {
            const hasZipMatch = lead.zip_codes.some(lz => client.zip_codes?.includes(lz));
            if (hasZipMatch) {
              locationScore += 40;
              clientHasLocationMatch = true;
            }
          }
          
          // Check City + State match (BOTH required)
          if (lead.cities?.length && lead.states?.length && client.cities?.length && client.states?.length) {
            const leadCities = lead.cities.map(c => c.trim().toLowerCase());
            const leadStates = lead.states.map(s => normalizeState(s));
            
            // Check if ANY city from lead matches ANY city from client
            const hasCityMatch = leadCities.some(lc => 
              client.cities.some(cc => cc.toLowerCase() === lc)
            );
            
            // Check if ANY state from lead matches ANY state from client (normalized)
            const hasStateMatch = leadStates.some(ls => 
              client.states.some(cs => normalizeState(cs) === ls)
            );
            
            // BOTH city and state must match
            if (hasCityMatch && hasStateMatch) {
              locationScore += 30;
              clientHasLocationMatch = true;
            }
          }
          
          // CRITICAL: Skip clients with NO location match
          if (!clientHasLocationMatch) {
            continue;
          }
          
          hasLocationMatch = true;
          
          // Add motivation bonus (major factor in match quality)
          if (lead.motivation && lead.motivation > 0) {
            locationScore += lead.motivation * 2;
          }
          
          // Match what agents want with what offices provide
          if (lead.wants && client.provides) {
            const leadWants = Array.isArray(lead.wants) ? lead.wants : [lead.wants];
            const clientProvides = Array.isArray(client.provides) ? client.provides : [client.provides];
            const hasMatch = leadWants.some(lw => 
              clientProvides.some(cp => lw.toLowerCase().includes(cp.toLowerCase()) || cp.toLowerCase().includes(lw.toLowerCase()))
            );
            if (hasMatch) locationScore += 15;
          }
          
          // Calculate final score with qualification bonus
          const qualificationBonus = (lead.qualification_score || 0) * 0.1;
          const totalScore = Math.min(100, locationScore + qualificationBonus);
          
          if (totalScore > bestScore) {
            bestScore = totalScore;
            bestClient = client;
          }
        }
        
        // CRITICAL: Skip if no client with location match found
        if (!hasLocationMatch || !bestClient) {
          console.warn(`Skipping lead ${lead.full_name} - no location match with any client (required)`);
          continue;
        }
        
        let matchScore = bestScore;
        let breakdown = null;

        // Use AI-powered matching if enabled
        if (useAI) {
          try {
            const { data: aiMatch, error: aiError } = await supabase.functions.invoke('match-with-ai', {
              body: { 
                pro_id: lead.id, 
                client_id: bestClient.id,
                use_ai: true 
              }
            });

            if (!aiError && aiMatch?.breakdown) {
              matchScore = aiMatch.breakdown.total_score;
              breakdown = aiMatch.breakdown;
              matchBreakdowns.push({
                proName: lead.full_name,
                clientName: bestClient.company_name,
                breakdown: aiMatch.breakdown,
              });
            }
          } catch (error) {
            console.error('AI matching failed, using fallback:', error);
          }
        }

        // Check if match already exists
        const { data: existing } = await supabase
          .from("matches")
          .select("id")
          .eq("pro_id", lead.id)
          .eq("client_id", bestClient.id)
          .maybeSingle();

        if (!existing) {
          const matchData: any = {
            pro_id: lead.id,
            client_id: bestClient.id,
            match_score: matchScore,
            status: "pending",
          };

          if (breakdown) {
            matchData.score_breakdown = breakdown;
          }

          const { error: matchError } = await supabase
            .from("matches")
            .insert(matchData);

          if (!matchError) {
            matchesCreated++;
          }
        }
      }

      toast({
        title: "Matches generated",
        description: `Created ${matchesCreated} new matches${useAI ? ' with AI analysis' : ''}`,
      });

      // Show first breakdown if AI was used
      if (useAI && matchBreakdowns.length > 0) {
        setSelectedBreakdown(matchBreakdowns[0].breakdown);
        setSelectedProName(matchBreakdowns[0].proName);
        setSelectedClientName(matchBreakdowns[0].clientName);
        setShowBreakdown(true);
      }
    } catch (error: any) {
      toast({
        title: "Error generating matches",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Generate Test Matches
          </CardTitle>
          <CardDescription>
            AI-powered matching by OwlDoor.com - Automatically creates intelligent matches between leads and clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <Brain className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-green-800 dark:text-green-200">
                AI-Powered Matching Always Active
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                Powered by OwlDoor.com • Uses Claude AI with field definitions, semantic analysis, and Zillow data enrichment
              </p>
            </div>
          </div>

          <Button 
            onClick={handleGenerateMatches} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? "Generating..." : "Generate Matches with AI"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            AI semantic matching with automatic profile enrichment and Zillow data lookup
          </p>
        </CardContent>
      </Card>

      <MatchBreakdownModal
        open={showBreakdown}
        onOpenChange={setShowBreakdown}
        breakdown={selectedBreakdown}
        proName={selectedProName}
        clientName={selectedClientName}
      />
    </>
  );
};