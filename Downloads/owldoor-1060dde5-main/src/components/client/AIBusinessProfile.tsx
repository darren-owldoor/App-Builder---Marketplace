import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Edit, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AIBusinessProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchMetrics();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!client) return;

      const { data, error } = await supabase
        .from("client_business_profiles")
        .select("*")
        .eq("client_id", client.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!client) return;

      const { data, error } = await supabase
        .from("ai_performance_metrics")
        .select("*")
        .eq("client_id", client.id)
        .order("metric_date", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setMetrics(data);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!profile || !profile.completed) {
    return (
      <Card className="p-8 text-center">
        <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">AI Assistant Not Available</h3>
        <p className="text-muted-foreground mb-6">
          AI assistant feature has been disabled
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Your AI Recruiting Assistant</h2>
              <p className="text-sm text-muted-foreground">Feature temporarily disabled</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Business Profile</TabsTrigger>
            <TabsTrigger value="performance">AI Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Company Description</h3>
              <p className="text-sm text-muted-foreground">{profile.company_description}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Unique Selling Points</h3>
              <div className="flex flex-wrap gap-2">
                {profile.unique_selling_points?.map((point: string, i: number) => (
                  <Badge key={i} variant="secondary">{point}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Work Environment</h3>
              <Badge>{profile.work_environment}</Badge>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Culture Values</h3>
              <div className="flex flex-wrap gap-2">
                {profile.culture_values?.map((value: string, i: number) => (
                  <Badge key={i} variant="outline">{value}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Deal Breakers</h3>
              <ul className="list-disc list-inside space-y-1">
                {profile.deal_breakers?.map((breaker: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground">{breaker}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Ideal Candidate Profile</h3>
              <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(profile.ideal_candidate_profile, null, 2)}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {metrics ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="text-2xl font-bold">{metrics.total_conversations || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Conversations</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold">{metrics.leads_qualified || 0}</div>
                    <div className="text-sm text-muted-foreground">Leads Qualified</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold">{metrics.appointments_booked || 0}</div>
                    <div className="text-sm text-muted-foreground">Appointments Booked</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold">
                      {metrics.conversion_rate ? `${(metrics.conversion_rate * 100).toFixed(1)}%` : '0%'}
                    </div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </Card>
                </div>

                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Average Sentiment Score</h3>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold">
                      {metrics.average_sentiment_score 
                        ? (metrics.average_sentiment_score * 100).toFixed(1)
                        : '0'
                      }%
                    </span>
                    <span className="text-sm text-muted-foreground">positive</span>
                  </div>
                </Card>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No performance data yet. Your AI will start collecting metrics as it interacts with leads.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AIBusinessProfile;
