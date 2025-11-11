import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PaymentMethodManager } from "@/components/client/PaymentMethodManager";

export default function ClientOnboardingMinimum() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientCreated, setClientCreated] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create client record
      const { error: clientError } = await supabase
        .from("clients")
        .upsert({
          user_id: user.id,
          company_name: formData.companyName,
          contact_name: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          active: true,
        });

      if (clientError) throw clientError;

      setClientCreated(true);
      toast({
        title: "Profile Created",
        description: "Please add a payment method to complete setup.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentUpdate = () => {
    setHasPaymentMethod(true);
    toast({
      title: "Setup Complete!",
      description: "Your account is ready to receive leads.",
    });
    navigate("/client-dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Quick Setup</h1>
          <p className="text-muted-foreground">
            Get started in minutes - you can always complete your full profile later
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Just the essentials to get you receiving leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!clientCreated ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contactName">Your Name *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating Profile..." : "Continue to Payment"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <PaymentMethodManager 
                  hasPaymentMethod={hasPaymentMethod} 
                  onUpdate={handlePaymentUpdate} 
                />
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/client-onboarding")}
                >
                  Complete Full Profile Instead
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {!clientCreated && (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/client-onboarding")}
            >
              Want more control? Complete the full onboarding →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
