import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, CheckCircle, XCircle, TrendingUp, MapPin, Briefcase, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MatchPreview {
  pro: {
    id: string;
    name: string;
    email: string;
    type: string;
    location: string;
    experience?: number;
    transactions?: number;
    volume?: number;
    motivation?: number;
    wants?: string[];
  };
  client: {
    id: string;
    name: string;
    type: string;
    credits: number;
    wants?: string;
    needs?: string;
    provides?: string[]; // What the team provides
    company_name?: string;
    contact_name?: string;
    brokerage?: string;
    email?: string;
    phone?: string;
    cities?: string[];
    states?: string[];
    zip_codes?: string[];
  };
  bid: {
    id: string;
    amount: number;
    coverage: string;
  };
  score: number;
  breakdown: {
    geographic: number;
    performance: number;
    specialization: number;
    type_specific: number;
    bonus: number;
  };
  match_reason: string;
  would_create: boolean;
  block_reason?: string;
  perfect_match?: boolean; // If all 3 wants are matched
  wants_match_count?: number; // How many wants matched
}

export const MatchPreview = () => {
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<MatchPreview[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const { toast } = useToast();

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, company_name, contact_name")
      .eq("active", true)
      .order("company_name");
    
    setClients(data || []);
  };

  const runPreview = async () => {
    setLoading(true);
    try {
      if (clients.length === 0) {
        await fetchClients();
      }

      const { data, error } = await supabase.functions.invoke("preview-matches", {
        body: selectedClientId === "all" ? {} : { client_id: selectedClientId },
      });

      if (error) throw error;

      setPreviews(data.previews || []);
      setSummary(data.summary || {});

      toast({
        title: "Preview Complete",
        description: `Found ${data.summary.would_create} potential matches`,
      });
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

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 30) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Match Preview (Dry Run)
        </CardTitle>
        <CardDescription>
          See what matches would be created without actually creating them
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Filter by Client</label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger>
                <SelectValue placeholder="All clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company_name || client.contact_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={runPreview} disabled={loading}>
            {loading ? "Running Preview..." : "Run Preview"}
          </Button>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-2xl font-bold">{summary.total_pros}</div>
              <div className="text-xs text-muted-foreground">Match-Ready Pros</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{summary.eligible_clients}</div>
              <div className="text-xs text-muted-foreground">Eligible Clients</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{summary.potential_matches}</div>
              <div className="text-xs text-muted-foreground">Checked Combos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.would_create}</div>
              <div className="text-xs text-muted-foreground">Would Create</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{summary.blocked}</div>
              <div className="text-xs text-muted-foreground">Blocked</div>
            </div>
          </div>
        )}

        {previews.length > 0 && (
          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-4">
              {previews.map((preview, idx) => (
                <Card key={idx} className={
                  preview.would_create 
                    ? preview.perfect_match 
                      ? "border-2 border-green-500 bg-green-50/50 dark:bg-green-950/20" 
                      : "border-green-500"
                    : "border-red-500/30"
                }>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {preview.would_create ? (
                            <CheckCircle className={preview.perfect_match ? "h-5 w-5 text-green-600 font-bold" : "h-4 w-4 text-green-600"} />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-semibold">{preview.pro.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {preview.pro.type === 'real_estate_agent' ? 'RE Agent' : 'LO'}
                          </Badge>
                          {preview.perfect_match && (
                            <Badge className="bg-green-600 text-white font-bold text-xs animate-pulse">
                              🎯 PERFECT MATCH 3/3
                            </Badge>
                          )}
                          {!preview.perfect_match && preview.wants_match_count && preview.wants_match_count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {preview.wants_match_count}/3 Wants Match
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {preview.pro.location}
                          </span>
                          {preview.pro.experience && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {preview.pro.experience}y exp
                            </span>
                          )}
                          {preview.pro.transactions && (
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {preview.pro.transactions} tx
                            </span>
                          )}
                        </div>
                      </div>
                      {preview.would_create && (
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(preview.score)}`}>
                            {preview.score}
                          </div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                      )}
                    </div>

                    <div className="bg-muted/50 rounded p-3 mb-3 space-y-2">
                      <div className="text-sm font-medium">→ {preview.client.name}</div>
                      <div className="text-xs space-y-1">
                        <div className="text-muted-foreground">
                          {preview.bid.coverage} • ${preview.bid.amount} bid • {preview.client.credits} credits
                        </div>
                        {preview.client.provides && (
                          <div>
                            <span className="font-medium">Provides:</span> {preview.client.provides}
                          </div>
                        )}
                        {preview.client.brokerage && (
                          <div>
                            <span className="font-medium">Brokerage:</span> {preview.client.brokerage}
                          </div>
                        )}
                        {preview.client.email && (
                          <div>
                            <span className="font-medium">Email:</span> {preview.client.email}
                          </div>
                        )}
                        {preview.client.phone && (
                          <div>
                            <span className="font-medium">Phone:</span> {preview.client.phone}
                          </div>
                        )}
                        {preview.client.cities && preview.client.cities.length > 0 && (
                          <div>
                            <span className="font-medium">Cities:</span> {preview.client.cities.join(', ')}
                          </div>
                        )}
                        {preview.client.states && preview.client.states.length > 0 && (
                          <div>
                            <span className="font-medium">States:</span> {preview.client.states.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {preview.would_create ? (
                      <>
                        <div className="text-sm mb-2">
                          <span className="font-medium">Match Reason:</span> {preview.match_reason}
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-xs">
                          <div>
                            <div className="font-medium">Geo</div>
                            <div className={getScoreColor(preview.breakdown.geographic)}>
                              {preview.breakdown.geographic}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Perf</div>
                            <div className={getScoreColor(preview.breakdown.performance)}>
                              {preview.breakdown.performance}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Spec</div>
                            <div>{preview.breakdown.specialization}</div>
                          </div>
                          <div>
                            <div className="font-medium">Type</div>
                            <div>{preview.breakdown.type_specific}</div>
                          </div>
                          <div>
                            <div className="font-medium">Bonus</div>
                            <div className="text-green-600">{preview.breakdown.bonus}</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-red-600 dark:text-red-400">
                        <span className="font-medium">Blocked:</span> {preview.block_reason}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        {!loading && previews.length === 0 && summary && (
          <div className="text-center py-8 text-muted-foreground">
            No potential matches found
          </div>
        )}
      </CardContent>
    </Card>
  );
};
