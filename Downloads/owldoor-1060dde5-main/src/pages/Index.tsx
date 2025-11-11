import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import LiveMatching from "@/components/LiveMatching";

type UserRole = "admin" | "staff" | "client" | "agent" | "lead";

const roleToPath = (roles: UserRole[]) => {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("staff")) return "/staff";
  if (roles.includes("client")) return "/client";
  if (roles.includes("agent") || roles.includes("lead")) return "/lead";
  return null;
};

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        navigate("/");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
      } else {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserRole = async (userId: string) => {
    try {
      // Get all roles for the user
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Role check error:", error);
        setLoading(false);
        return;
      }

      // If no role assigned, allow access (new sign-ups)
      if (!data || data.length === 0) {
        console.log("No role assigned yet - allowing access for new user");
        // Wait a bit and retry once in case of timing issue
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: retryData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        
        if (!retryData || retryData.length === 0) {
          // No roles yet - allow access to map for sign-ups
          navigate("/agents/map");
          setLoading(false);
          return;
        }
        
        // If role found on retry, use it
        const roles = retryData.map(r => r.role as UserRole);
        const path = roleToPath(roles);
        if (path) navigate(path);
        setLoading(false);
        return;
      }

      // Get all roles and prioritize: admin > staff > client > lead
      const roles = data.map(r => r.role as UserRole);
      
      // Navigate based on highest priority role
      const path = roleToPath(roles);
      if (path) navigate(path);
    } catch (error) {
      console.error("Error checking role:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show LiveMatching for non-authenticated users or as default
  if (!user) {
    return <LiveMatching />;
  }

  return null;
};

export default Index;
