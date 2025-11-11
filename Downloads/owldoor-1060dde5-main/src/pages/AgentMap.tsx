import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import AgentMapView from "@/components/AgentMapView";
import { Button } from "@/components/ui/button";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";
import { QualificationChatbot } from "@/components/QualificationChatbot";
import { toast } from "sonner";

type UserRole = "admin" | "staff" | "client" | "agent" | "lead";

const AgentMap = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQualificationChat, setShowQualificationChat] = useState(false);
  const [isQualified, setIsQualified] = useState(true);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Fetch user roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (rolesData?.length) {
        setUserRoles(rolesData.map((r) => r.role as UserRole));
      }

      // Check if current agent is qualified
      const { data: currentAgent } = await supabase
        .from("pros")
        .select("id, pipeline_stage, wants, motivation")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (currentAgent) {
        setCurrentAgentId(currentAgent.id);
        const hasWants = currentAgent.wants && currentAgent.wants.length > 0;
        const hasMotivation = currentAgent.motivation && currentAgent.motivation > 0;
        const qualified = currentAgent.pipeline_stage === 'qualified' || (hasWants && hasMotivation);
        
        setIsQualified(qualified);
        
        // Show qualification chat if not qualified
        if (!qualified) {
          setTimeout(() => {
            setShowQualificationChat(true);
          }, 2000);
        }
      }

      // Fetch agents/brokerages to display on map
      const { data: agentsData, error } = await supabase
        .from("pros")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(999999);

      if (!error && agentsData) {
        setAgents(agentsData);
      }

      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSaveCoverage = async (data: { polygons: any[]; circles: any[] }) => {
    if (!currentAgentId) {
      toast.error("Unable to save - agent not found");
      return;
    }

    try {
      // Save the coverage data to the agent record
      const { error } = await supabase
        .from('pros')
        .update({
          preferences: {
            coverage_polygons: data.polygons,
            coverage_circles: data.circles,
          },
          market_coverage_completed: true,
        })
        .eq('id', currentAgentId);

      if (error) throw error;

      toast.success("Market coverage area saved successfully!");
    } catch (error) {
      console.error('Error saving coverage:', error);
      toast.error("Failed to save coverage area");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={owlDoorLogo} alt="OwlDoor" className="h-12 w-auto" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Find Your Perfect Team</h1>
          <p className="text-muted-foreground">
            Explore available brokerages and teams in your area
          </p>
        </div>

        <AgentMapView 
          agents={agents}
          onAgentClick={(agent) => {
            console.log("Clicked agent:", agent);
          }}
          onSave={handleSaveCoverage}
          showSaveButton={true}
        />
      </div>

      {showQualificationChat && (
        <QualificationChatbot
          onClose={() => setShowQualificationChat(false)}
          onComplete={() => {
            setShowQualificationChat(false);
            setIsQualified(true);
          }}
        />
      )}
    </div>
  );
};

export default AgentMap;
