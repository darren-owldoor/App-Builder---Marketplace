import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MessageSquare, ArrowLeft, Phone } from "lucide-react";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";

export default function PasswordReset() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState((location.state as any)?.email || "");
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [resetMethod, setResetMethod] = useState<"email" | "sms" | "both" | null>(null);

  useEffect(() => {
    const fetchPhoneNumber = async () => {
      if (email.trim() && email.includes('@')) {
        try {
          // Try to find phone in pros table
          const { data: proData } = await supabase
            .from('pros')
            .select('phone')
            .eq('email', email.trim())
            .single();

          if (proData?.phone) {
            setPhoneNumber(proData.phone);
            return;
          }

          // Try to find phone in profiles table
          const { data: profileData } = await supabase
            .from('profiles')
            .select('phone')
            .eq('email', email.trim())
            .single();

          if (profileData?.phone) {
            setPhoneNumber(profileData.phone);
          }
        } catch (error) {
          console.error('Error fetching phone:', error);
        }
      }
    };

    const timeoutId = setTimeout(fetchPhoneNumber, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleResetPassword = async (method: "email" | "sms" | "both") => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if ((method === "sms" || method === "both") && !phoneNumber) {
      toast({
        title: "Error",
        description: "No phone number found for this account",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (method === "both") {
        // Send to both email and SMS
        const emailPromise = supabase.functions.invoke('send-password-reset', {
          body: { 
            email: email.trim(),
            method: "email",
            phone: phoneNumber
          }
        });

        const smsPromise = supabase.functions.invoke('send-password-reset', {
          body: { 
            email: email.trim(),
            method: "sms",
            phone: phoneNumber
          }
        });

        const [emailResult, smsResult] = await Promise.all([emailPromise, smsPromise]);

        if (emailResult.error || smsResult.error) {
          throw new Error(emailResult.error?.message || smsResult.error?.message || "Failed to send reset link");
        }

        toast({
          title: "Success!",
          description: "Password reset links sent to both your email and phone",
        });
      } else {
        // Send to single method
        const { error } = await supabase.functions.invoke('send-password-reset', {
          body: { 
            email: email.trim(),
            method: method,
            phone: phoneNumber
          }
        });

        if (error) throw error;

        toast({
          title: "Success!",
          description: method === "email" 
            ? "Check your email for a password reset link" 
            : "Check your phone for a password reset link via SMS",
        });
      }

      // Navigate to auth page after 2 seconds
      setTimeout(() => navigate("/auth"), 2000);
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reset link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center space-y-2">
          <img src={owlDoorLogo} alt="OwlDoor" className="h-16 w-auto" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a reset link via Email or Phone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {phoneNumber && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone on file:</span>
                  <span className="font-medium">{phoneNumber}</span>
                </div>
              </div>
            )}

            {!resetMethod ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  How would you like to receive your password reset link?
                </p>
                <div className="flex flex-col gap-3">
                  {phoneNumber && (
                    <Button
                      type="button"
                      className="w-full h-auto py-4 flex items-center justify-start gap-3"
                      onClick={() => handleResetPassword("both")}
                      disabled={loading}
                    >
                      <div className="flex gap-2">
                        <Mail className="h-6 w-6" />
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Send to Both Email & Phone</div>
                        <div className="text-xs opacity-90">
                          Get magic links via both methods
                        </div>
                      </div>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-auto py-4 flex items-center justify-start gap-3"
                    onClick={() => handleResetPassword("email")}
                    disabled={loading}
                  >
                    <Mail className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Send via Email Only</div>
                      <div className="text-xs text-muted-foreground">
                        Get a reset link in your inbox
                      </div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-auto py-4 flex items-center justify-start gap-3"
                    onClick={() => handleResetPassword("sms")}
                    disabled={loading || !phoneNumber}
                  >
                    <MessageSquare className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Send via Phone Only</div>
                      <div className="text-xs text-muted-foreground">
                        {phoneNumber ? "Get a magic link via SMS" : "No phone number on file"}
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="animate-pulse">
                  {loading ? "Sending..." : "Sent!"}
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/auth")}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
