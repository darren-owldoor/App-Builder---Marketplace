import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogOut, DollarSign, CreditCard, TrendingUp, AlertTriangle } from "lucide-react";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";
import { LowCreditsAlert } from "@/components/client/LowCreditsAlert";
import { PaymentMethodManager } from "@/components/client/PaymentMethodManager";
import { CreditPurchaseForm } from "@/components/client/CreditPurchaseForm";
import { MonthlyMaximumSettings } from "@/components/client/MonthlyMaximumSettings";
import { CreditTransactionHistory } from "@/components/client/CreditTransactionHistory";
import { AutoChargeSettings } from "@/components/client/AutoChargeSettings";

const ClientBilling = () => {
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);
  const [packageData, setPackageData] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["client", "admin"]);

      if (!roleData || roleData.length === 0) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const { data: client } = await supabase
        .from("clients")
        .select(`
          *,
          pricing_packages (
            name,
            monthly_cost,
            leads_per_month
          )
        `)
        .eq("user_id", user.id)
        .single();

      if (client) {
        setClientData(client);
        setPackageData(client.pricing_packages);
        
        // Check if account needs payment method
        const accountCreatedDays = Math.floor(
          (Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Credit card requirement temporarily disabled
        /*
        if (!client.has_payment_method && accountCreatedDays < 10) {
          const daysLeft = 10 - accountCreatedDays;
          toast({
            title: "Payment Method Required",
            description: `Add your credit card within ${daysLeft} day${daysLeft !== 1 ? 's' : ''} to maintain account status`,
            variant: "destructive",
          });
        }
        */
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      toast({
        title: "Error",
        description: "Failed to load billing information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <img 
            src={owlDoorLogo} 
            alt="OwlDoor" 
            className="h-8 cursor-pointer" 
            onClick={() => navigate('/office')} 
          />
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Billing & Credits</h1>
          <p className="text-muted-foreground">Manage your account credits and subscription</p>
        </div>

        {/* Payment Method Warning Banner - Temporarily Disabled */}
        {false && clientData && !clientData.has_payment_method && (() => {
          const accountCreatedDays = Math.floor(
            (Date.now() - new Date(clientData.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          const daysLeft = Math.max(0, 10 - accountCreatedDays);
          
          if (daysLeft > 0) {
            return (
              <Alert className="mb-6 border-destructive bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  Add Your Credit Card within {daysLeft} day{daysLeft !== 1 ? 's' : ''} to maintain Account status
                </AlertDescription>
              </Alert>
            );
          }
          return null;
        })()}

        {/* Low Credits Alert */}
        {clientData && (
          <LowCreditsAlert 
            credits={clientData.credits_balance || 0}
            hasPackage={!!clientData.current_package_id}
          />
        )}

        {/* Credits Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Dollar Credits</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${(clientData?.credits_balance || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Each credit = $1
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${(clientData?.credits_used || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime usage
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Plan</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {packageData ? (
                <>
                  <div className="text-2xl font-bold">
                    ${packageData.monthly_cost}/mo
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {packageData.name}
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No active package
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Package Details */}
        {packageData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Package</CardTitle>
              <CardDescription>Your active subscription plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-sm text-muted-foreground">Package Name</span>
                  <span className="font-medium">{packageData.name}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-sm text-muted-foreground">Monthly Cost</span>
                  <span className="font-medium">${packageData.monthly_cost}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-muted-foreground">Leads per Month</span>
                  <span className="font-medium">{packageData.leads_per_month}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Method Management */}
        {clientData && (
          <div className="mb-8">
            <PaymentMethodManager
              hasPaymentMethod={clientData.has_payment_method || false}
              onUpdate={loadClientData}
            />
          </div>
        )}

        {/* Auto-Charge Settings */}
        {clientData && (
          <div className="mb-8">
            <AutoChargeSettings
              clientId={clientData.id}
              hasPaymentMethod={clientData.has_payment_method || false}
            />
          </div>
        )}

        {/* Credit Purchase & Monthly Maximum */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {clientData && (
            <>
              <CreditPurchaseForm
                hasPaymentMethod={clientData.has_payment_method || false}
                currentBalance={clientData.credits_balance || 0}
                onSuccess={loadClientData}
              />
              <MonthlyMaximumSettings
                clientId={clientData.id}
                currentMaximum={clientData.monthly_spend_maximum || 1000}
                currentSpend={clientData.current_month_spend || 0}
                onUpdate={loadClientData}
              />
            </>
          )}
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your billing details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-sm text-muted-foreground">Company Name</span>
                <span className="font-medium">{clientData?.company_name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-sm text-muted-foreground">Contact Email</span>
                <span className="font-medium">{clientData?.email}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-sm text-muted-foreground">Account Status</span>
                <span className={`font-medium ${clientData?.active ? 'text-green-600' : 'text-red-600'}`}>
                  {clientData?.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-muted-foreground">Account Created</span>
                <span className="font-medium">
                  {new Date(clientData?.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Transaction History */}
        <CreditTransactionHistory clientId={clientData.id} />

        {/* Support Contact */}
        <Card className="mt-8 bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-center text-muted-foreground">
              Need help with billing? Contact our support team at{" "}
              <a href="mailto:support@owldoor.com" className="text-primary hover:underline">
                support@owldoor.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientBilling;