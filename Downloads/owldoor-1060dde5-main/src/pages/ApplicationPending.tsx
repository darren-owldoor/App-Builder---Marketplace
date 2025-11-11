import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin, Home } from "lucide-react";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";

const ApplicationPending = () => {
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClientLocation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: client } = await supabase
            .from("clients")
            .select("cities, states")
            .eq("user_id", user.id)
            .single();

          if (client) {
            const city = client.cities?.[0] || "";
            const state = client.states?.[0] || "";
            setLocation(`${city}${city && state ? ", " : ""}${state}`);
          }
        }
      } catch (error) {
        console.error("Error fetching client location:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientLocation();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <img src={owlDoorLogo} alt="OwlDoor" className="h-16 mx-auto mb-4" />
        </div>

        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl md:text-3xl">Application Received!</CardTitle>
            <CardDescription className="text-base md:text-lg mt-2">
              Thank you for your interest in joining OwlDoor
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">What's Next?</h3>
                  <p className="text-sm text-muted-foreground">
                    We are currently reviewing your application and our availability in{" "}
                    <span className="font-semibold text-foreground">
                      {location || "your area"}
                    </span>
                    .
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Home className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Timeline</h3>
                  <p className="text-sm text-muted-foreground">
                    Our team will get back to you as soon as possible, typically within 1-3 business days.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-primary bg-primary/5 p-4 rounded">
              <p className="text-sm">
                <strong>Pro Tip:</strong> Check your email (including spam folder) for updates from our team.
                We'll reach out with next steps or any questions about your application.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                In the meantime, feel free to explore our platform or reach out if you have any questions.
              </p>
              
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
                <Button onClick={() => window.location.href = "https://owldoor.com"}>
                  Visit Website
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Questions? Contact us at{" "}
            <a href="mailto:support@owldoor.com" className="text-primary hover:underline">
              support@owldoor.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApplicationPending;
