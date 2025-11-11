import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Eye, TrendingUp, Users, Lock } from "lucide-react";
import owlDoorLogo from "@/assets/owldoor-logo-new.png";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proData, setProData] = useState<any>(null);
  const [viewCount, setViewCount] = useState(0);
  const [interestedTeams, setInterestedTeams] = useState(0);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get pro data
      const { data: pro } = await supabase
        .from("pros")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!pro) {
        toast.error("Agent profile not found");
        navigate("/auth");
        return;
      }

      setProData(pro);
      setViewCount(pro.profile_views || 0);

      // Count interested teams (clients who unlocked this agent)
      const { data: unlocks } = await supabase
        .from("agent_unlocks")
        .select("id")
        .eq("pro_id", pro.id);

      setInterestedTeams(unlocks?.length || 0);

    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const profileCompletion = proData?.profile_completeness || 0;
  const isComplete = profileCompletion >= 75;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={owlDoorLogo} alt="OwlDoor" className="h-12" />
              <div>
                <h1 className="text-xl font-bold">Agent Dashboard</h1>
                <p className="text-sm text-muted-foreground">Your Professional Profile</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/pro")}>
                View Full Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/edit-agent-profile")}>
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {proData?.first_name || 'Agent'}!
          </h2>
          <p className="text-muted-foreground">
            Keep your profile updated to attract the best opportunities
          </p>
        </div>

        {/* Profile Completion Alert */}
        {!isComplete && (
          <Card className="mb-6 border-primary bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Lock className="h-6 w-6 text-primary mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Complete Your Profile</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your profile is {profileCompletion}% complete. Reach 75% to unlock full visibility to recruiting teams.
                  </p>
                  <Progress value={profileCompletion} className="mb-3" />
                  <Button onClick={() => navigate("/edit-agent-profile")}>
                    Complete Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{viewCount}</div>
              <p className="text-xs text-muted-foreground">Total impressions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Interested Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interestedTeams}</div>
              <p className="text-xs text-muted-foreground">Teams viewing your profile</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Qualification Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{proData?.qualification_score || 0}</div>
              <p className="text-xs text-muted-foreground">Out of 100</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tier Status</CardTitle>
              <Badge variant={proData?.pricing_tier === 'premium' ? 'default' : 'secondary'} className="capitalize">
                {proData?.pricing_tier || 'basic'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {proData?.pricing_tier === 'premium' && 'Top tier agent'}
                {proData?.pricing_tier === 'qualified' && 'Experienced professional'}
                {(!proData?.pricing_tier || proData?.pricing_tier === 'basic') && 'Building your reputation'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Profile Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Professional Details</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Experience:</dt>
                    <dd className="font-medium">{proData?.experience || 0} years</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Transactions:</dt>
                    <dd className="font-medium">{proData?.transactions || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Brokerage:</dt>
                    <dd className="font-medium">{proData?.brokerage || 'Not specified'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Service Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {proData?.cities && proData.cities.length > 0 ? (
                    proData.cities.map((city: string, idx: number) => (
                      <Badge key={idx} variant="outline">{city}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No areas specified</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate("/edit-agent-profile")}
          >
            <Settings className="h-8 w-8" />
            <span>Update Profile</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate("/market-coverage")}
          >
            <TrendingUp className="h-8 w-8" />
            <span>Manage Coverage</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => navigate("/pro")}
          >
            <Users className="h-8 w-8" />
            <span>View Opportunities</span>
          </Button>
        </div>
      </main>
    </div>
  );
}