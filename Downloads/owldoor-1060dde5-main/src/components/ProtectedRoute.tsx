import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      if (!isMounted) return;
      await checkUserAccess();
    };

    checkAccess();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      
      if (session?.user) {
        checkUserAccess();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkUserAccess = async () => {
    try {
      console.log('[ProtectedRoute] Checking user access...');
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      
      console.log('[ProtectedRoute] Session user:', currentUser?.email || 'none');
      setUser(currentUser);

      if (currentUser) {
        // Check if user is active
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("active")
          .eq("id", currentUser.id)
          .single();

        if (error) {
          console.error("[ProtectedRoute] Error checking user active status:", error);
          setIsActive(true); // Default to active if error
        } else {
          const active = profile?.active ?? true; // Default to active if not set
          console.log('[ProtectedRoute] User active status:', active);
          setIsActive(active);

          if (!active) {
            console.log('[ProtectedRoute] User inactive, signing out');
            // Sign out inactive user
            await supabase.auth.signOut();
            toast({
              title: "Account Inactive",
              description: "Your account has been deactivated. Please contact support at hello@owldoor.com",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in checkUserAccess:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isActive) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
