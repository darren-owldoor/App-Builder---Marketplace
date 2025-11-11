import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { DollarSign, MapPin, TrendingUp, Clock } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";

interface MissedMatch {
  id: string;
  match_score: number;
  required_credits: number;
  package_type: string;
  lead_preview: {
    cities?: string[];
    states?: string[];
    transactions?: number;
    experience?: number;
    qualification_score?: number;
    wants?: string[];
    skills?: string[];
    has_email: boolean;
    has_phone: boolean;
  };
  created_at: string;
  expires_at: string;
}

export function MissedMatches() {
  const [missedMatches, setMissedMatches] = useState<MissedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMissedMatches();
  }, []);

  const fetchMissedMatches = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: clientData } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", userData.user.id)
        .single();

      if (!clientData) return;

      const { data, error } = await supabase
        .from("missed_matches")
        .select("*")
        .eq("client_id", clientData.id)
        .eq("purchased", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMissedMatches((data as any) || []);
    } catch (error: any) {
      console.error("Error fetching missed matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (missedMatchId: string, requiredCredits: number) => {
    try {
      toast({
        title: "Purchase Required",
        description: `You need $${requiredCredits} in credits to unlock this lead. Please add more credits to your account.`,
      });
      // TODO: Navigate to payment/credit purchase page
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Loading missed opportunities...</div>
        </CardContent>
      </Card>
    );
  }

  if (missedMatches.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-warning/50 bg-warning/5">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-warning" />
          Missed Opportunities
        </CardTitle>
        <CardDescription>
          These leads matched your criteria but you didn't have enough credits. Add credits to unlock them!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {missedMatches.map((missedMatch) => (
            <div
              key={missedMatch.id}
              className="relative group flex flex-col gap-4 p-6 border-2 border-border rounded-xl hover:border-warning/50 hover:shadow-lg transition-all bg-card"
            >
              {/* Overlay for redacted info */}
              <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                <div className="text-center space-y-4">
                  <FontAwesomeIcon icon={faLock} className="text-6xl text-warning" />
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Premium Lead Available</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add ${missedMatch.required_credits} in credits to unlock full details
                    </p>
                  </div>
                  <Button
                    onClick={() => handlePurchase(missedMatch.id, missedMatch.required_credits)}
                    className="bg-warning hover:bg-warning/90 text-warning-foreground"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Add Credits & Unlock
                  </Button>
                </div>
              </div>

              {/* Preview Info (visible behind overlay) */}
              <div className="flex items-start justify-between">
                <div className="space-y-2 blur-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Match Score: {missedMatch.match_score}%
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {missedMatch.package_type.replace("_", " ")}
                    </Badge>
                  </div>
                  {missedMatch.lead_preview.cities && missedMatch.lead_preview.states && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {missedMatch.lead_preview.cities[0]}, {missedMatch.lead_preview.states[0]}
                    </p>
                  )}
                </div>
                <div className="text-right blur-sm">
                  <div className="text-sm font-medium text-muted-foreground">Quality Score</div>
                  <div className="text-2xl font-bold text-primary">
                    {missedMatch.lead_preview.qualification_score || 0}
                  </div>
                </div>
              </div>

              {/* Stats Preview */}
              <div className="grid grid-cols-2 gap-4 blur-sm">
                {missedMatch.lead_preview.transactions && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {missedMatch.lead_preview.transactions} transactions/year
                    </span>
                  </div>
                )}
                {missedMatch.lead_preview.experience && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {missedMatch.lead_preview.experience} years exp.
                    </span>
                  </div>
                )}
              </div>

              {/* Skills/Wants Preview */}
              {(missedMatch.lead_preview.skills || missedMatch.lead_preview.wants) && (
                <div className="blur-sm">
                  <p className="text-xs text-muted-foreground mb-1">Looking for:</p>
                  <div className="flex flex-wrap gap-1">
                    {missedMatch.lead_preview.wants?.slice(0, 3).map((want, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {want}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Expiry Warning */}
              <div className="text-xs text-warning flex items-center gap-1 blur-sm">
                <Clock className="h-3 w-3" />
                Expires: {new Date(missedMatch.expires_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
