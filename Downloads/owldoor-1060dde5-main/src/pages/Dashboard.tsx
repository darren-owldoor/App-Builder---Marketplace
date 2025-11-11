import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "staff" | "client" | "agent" | "admin" | "lead";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Prevent re-running during redirect
    if (isRedirecting) return;

    const checkUserAndRedirect = async () => {
      try {
        console.log('[Dashboard] Checking user and redirecting...');
        
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log('[Dashboard] No session found, redirecting to auth');
          // Not authenticated, redirect to auth page
          setIsRedirecting(true);
          navigate("/auth", { replace: true });
          return;
        }

        console.log('[Dashboard] Session found for user:', session.user.email);

        // Get user roles with retry logic
        let rolesData = null;
        let retries = 3;
        
        while (retries > 0 && !rolesData) {
          const { data, error: rolesError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);

          if (!rolesError && data && data.length > 0) {
            rolesData = data;
            break;
          }
          
          console.log('[Dashboard] Waiting for roles... retries left:', retries);
          await new Promise(resolve => setTimeout(resolve, 500));
          retries--;
        }

        if (!rolesData || rolesData.length === 0) {
          console.error("[Dashboard] No roles found after retries");
          // No role found, redirect to auth
          setIsRedirecting(true);
          navigate("/auth", { replace: true });
          return;
        }

        const roles = rolesData.map(r => r.role as UserRole);
        console.log('[Dashboard] User roles:', roles);
        
        // Route users to their respective dashboards
        // For clients
        if (roles.includes("client")) {
          console.log('[Dashboard] Redirecting to client dashboard');
          setIsRedirecting(true);
          navigate("/office", { replace: true });
          return;
        }
        
        // For agents/pros/leads
        if (roles.includes("agent") || roles.includes("lead")) {
          console.log('[Dashboard] Redirecting to agent dashboard');
          setIsRedirecting(true);
          navigate("/agent-dashboard", { replace: true });
          return;
        }
        
        // Admin and staff don't need onboarding
        if (roles.includes("admin")) {
          console.log('[Dashboard] Redirecting to admin dashboard');
          setIsRedirecting(true);
          navigate("/admin", { replace: true });
          return;
        }
        
        if (roles.includes("staff")) {
          console.log('[Dashboard] Redirecting to staff dashboard');
          setIsRedirecting(true);
          navigate("/staff", { replace: true });
          return;
        }
        
        // Unknown role, redirect to auth
        console.log('[Dashboard] Unknown role, redirecting to auth');
        setIsRedirecting(true);
        navigate("/auth", { replace: true });
      } catch (error) {
        console.error("Error checking user role:", error);
        setIsRedirecting(true);
        navigate("/auth", { replace: true });
      } finally {
        setIsChecking(false);
      }
    };

    checkUserAndRedirect();
  }, [navigate, isRedirecting]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default Dashboard;
