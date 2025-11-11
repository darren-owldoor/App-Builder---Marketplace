import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Package, Check, MapPin, TrendingUp, DollarSign, Calendar } from "lucide-react";

export default function PackageView() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [packageData, setPackageData] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);

  useEffect(() => {
    if (token) {
      fetchPackage();
    }
  }, [token]);

  const fetchPackage = async () => {
    try {
      // Get client by access token
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*, pricing_packages!client_id(*)")
        .eq("package_access_token", token)
        .single();

      if (clientError) throw clientError;

      if (!client) {
        toast({
          title: "Invalid link",
          description: "This package link is not valid",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setClientData(client);
      
      // Get the custom package
      const packageInfo = client.pricing_packages?.[0];
      if (packageInfo) {
        setPackageData(packageInfo);
      }
    } catch (error: any) {
      console.error("Error fetching package:", error);
      toast({
        title: "Error loading package",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your custom package...</p>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Package Found</CardTitle>
            <CardDescription>
              No custom package has been set up for this account yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const locationFilter = packageData.location_filter;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <img src="/owldoor-logo-new.png" alt="OwlDoor" className="h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Your Custom Package</h1>
          <p className="text-muted-foreground">
            Exclusive pricing for {clientData?.company_name}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Package className="h-8 w-8" />
                  {packageData.name}
                </CardTitle>
                {packageData.description && (
                  <CardDescription className="mt-2 text-base">
                    {packageData.description}
                  </CardDescription>
                )}
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">
                  ${packageData.price_per_lead}
                </div>
                <div className="text-sm text-muted-foreground">per lead</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {packageData.monthly_cost > 0 && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold">Monthly Fee</div>
                    <div className="text-2xl font-bold">${packageData.monthly_cost}</div>
                  </div>
                </div>
              )}

              {packageData.setup_fee > 0 && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold">One-Time Setup Fee</div>
                    <div className="text-2xl font-bold">${packageData.setup_fee}</div>
                  </div>
                </div>
              )}

              {packageData.leads_per_month > 0 && (
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold">Leads Per Month</div>
                    <div className="text-2xl font-bold">{packageData.leads_per_month}</div>
                  </div>
                </div>
              )}

              {packageData.transaction_minimum > 0 && (
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold">Minimum Transactions Required</div>
                    <div className="text-2xl font-bold">{packageData.transaction_minimum}</div>
                  </div>
                </div>
              )}
            </div>

            {locationFilter && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold mb-2">Coverage Areas</div>
                    <div className="space-y-2">
                      {locationFilter.states && locationFilter.states.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">States: </span>
                          <span className="text-sm text-muted-foreground">
                            {locationFilter.states.join(", ")}
                          </span>
                        </div>
                      )}
                      {locationFilter.cities && locationFilter.cities.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Cities: </span>
                          <span className="text-sm text-muted-foreground">
                            {locationFilter.cities.join(", ")}
                          </span>
                        </div>
                      )}
                      {locationFilter.zip_codes && locationFilter.zip_codes.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Zip Codes: </span>
                          <span className="text-sm text-muted-foreground">
                            {locationFilter.zip_codes.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Check className="h-4 w-4" />
                <span className="font-medium">
                  {packageData.package_type === "exclusive" ? "Exclusive" : "Non-Exclusive"} Package
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {packageData.package_type === "exclusive" 
                  ? "You'll receive exclusive access to matched leads - no other clients will see these opportunities."
                  : "Leads may be shared with other qualified professionals in the network."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button size="lg" onClick={() => navigate("/auth")}>
            Get Started
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Questions? Contact your account manager or email{" "}
            <a href="mailto:hello@owldoor.com" className="text-primary hover:underline">
              hello@owldoor.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
