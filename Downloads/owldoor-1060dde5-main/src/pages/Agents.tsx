import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type UserRole = "admin" | "staff" | "client" | "agent" | "lead";

const Agents = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const canAccessMap = (roles: UserRole[]) => {
    return roles.includes("agent") || roles.includes("lead") || roles.includes("admin");
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!error && data?.length) {
        setUserRoles(data.map((r) => r.role as UserRole));
      }

      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleOpenMap = () => {
    if (!userRoles.length || canAccessMap(userRoles)) {
      navigate("/agents/map");
    } else {
      alert("You do not have access to the map.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold text-center">Welcome, {user?.email}</h1>
          <p className="text-muted-foreground text-center">
            Explore available brokerages and teams on the map
          </p>
          <Button
            onClick={handleOpenMap}
            size="lg"
            className="w-full"
          >
            Open Map
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Agents;
