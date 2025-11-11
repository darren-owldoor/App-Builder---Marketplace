import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkForRedirect = async () => {
      try {
        // Check if there's a redirect configured for this path
        const { data, error } = await supabase.rpc('find_redirect', {
          p_path: location.pathname
        });

        if (!error && data && data.length > 0) {
          const redirect = data[0];
          // Redirect to the configured path
          if (redirect.to_path.startsWith('http')) {
            // External redirect
            window.location.href = redirect.to_path;
          } else {
            // Internal redirect
            navigate(redirect.to_path, { replace: true });
          }
          return;
        }
      } catch (error) {
        console.error("Error checking for redirect:", error);
      } finally {
        setChecking(false);
      }

      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    };

    checkForRedirect();
  }, [location.pathname, navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:opacity-80">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
