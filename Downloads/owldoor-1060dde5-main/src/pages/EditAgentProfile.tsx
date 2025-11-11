import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AgentProfileCard from "@/components/agent/AgentProfileCard";
import AgentAIChat from "@/components/agent/AgentAIChat";
import ProfileLocationMap from "@/components/agent/ProfileLocationMap";

const EditAgentProfile = () => {
  const navigate = useNavigate();

  const agentData = {
    name: "Ethan Taylor",
    matchPercentage: 97,
    yearsExperience: 5,
    wantsNeedsMatch: 95,
    tags: ["Tech & CRM", "Free Leads", "80/20 Split", "Remote/Office", "Full-Time", "Coaching"],
    salesPerYear: 17,
    brokerage: "Realty Tahoe",
    closerRate: 97,
    email: "ethan.taylor@example.com",
    phone: "(555) 123-4567",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header with Logo and Back Button */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate("/agents")}
            >
              <div className="text-3xl">🦉</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">OwlDoor</h1>
                <p className="text-sm text-gray-600">Agent Dashboard</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/agents")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <AgentProfileCard
                  {...agentData}
                  onEditProfile={() => navigate("/edit-agent-profile")}
                  onEditWants={() => navigate("/market-coverage")}
                />
              </div>

              <div className="lg:col-span-2 space-y-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p>I have been an Agent since 2000 and I have closed over 100 Transactions.</p>
                      <p>I believe I have outgrown my Brokerage as my times isn't best spent finding clients, it's best spent Closing Clients! My "Batting Average" is 99% with Referrals.</p>
                      <p>I got a taste of Zillow Flex and it was great.</p>
                      <p>I am beyond Full-Time - 60-100 Hours a Week Baby!</p>
                      <p className="font-semibold">Closers Don't Close Their Eyes!</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Location Coverage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ProfileLocationMap />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Bakersfield, CA, USA</span>
                        <Button variant="ghost" size="sm">×</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notes From Recruiter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Ethan was a pleasure to speak with. He wants to focus on growing his business and is looking for a brokerage that can provide quality leads and support. Strong closer with excellent track record.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

      <AgentAIChat />
    </div>
  );
};

export default EditAgentProfile;
