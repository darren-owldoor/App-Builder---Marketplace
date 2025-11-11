import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
});

type UserRole = "staff" | "client" | "agent" | "admin" | "lead";

const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("client");
  const [show2FA, setShow2FA] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Helper function to navigate to dashboard (which will redirect based on role)
  const navigateToRoleDashboard = async (userId: string) => {
    // Navigate to unified dashboard which handles role-based redirects
    navigate("/dashboard");
  };

  // Check if user is already logged in and redirect to role-based dashboard
  useEffect(() => {
    let isNavigating = false;

    const checkSession = async () => {
      if (isNavigating) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        isNavigating = true;
        await navigateToRoleDashboard(session.user.id);
      }
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isNavigating) return;
      
      if (session?.user && event === 'SIGNED_IN') {
        // Small delay to ensure role is created in database
        isNavigating = true;
        setTimeout(() => navigateToRoleDashboard(session.user.id), 300);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get client IP address (best effort - will be more accurate on deployed version)
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();
      
      // Check if 2FA is required before actual sign in
      const check2FAResponse = await supabase.functions.invoke('check-2fa-required', {
        body: { 
          action: 'check',
          email, 
          ipAddress: ip,
          userAgent: navigator.userAgent
        }
      });

      if (check2FAResponse.error) throw check2FAResponse.error;
      
      const { requires2FA, verificationId: vid, userId } = check2FAResponse.data;

      if (requires2FA) {
        // Show 2FA input
        setShow2FA(true);
        setVerificationId(vid);
        setPendingUserId(userId);
        setIsLoading(false);
        toast({
          title: "Security Verification Required",
          description: "A verification code has been sent to your phone.",
        });
        return;
      }

      // No 2FA required, proceed with normal sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've been successfully signed in.",
      });

      // Navigate to role-based dashboard
      if (data.user) {
        await navigateToRoleDashboard(data.user.id);
      }
    } catch (error: any) {
      const isInactiveAccount = error.message?.includes("Your Account Is Not Active");
      
      toast({
        title: isInactiveAccount ? "Account Inactive" : "Error",
        description: isInactiveAccount 
          ? "Your Account Is Not Active at This Time. Email Hello@OwlDoor.com if you think this is a mistake"
          : error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Verify the 2FA code
      const verifyResponse = await supabase.functions.invoke('check-2fa-required', {
        body: { 
          action: 'verify',
          verificationId,
          code: verificationCode
        }
      });

      if (verifyResponse.error) throw verifyResponse.error;
      
      const { verified, error: verifyError } = verifyResponse.data;

      if (!verified) {
        throw new Error(verifyError || 'Verification failed');
      }

      // Now complete the actual sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Verification Successful!",
        description: "You've been successfully signed in.",
      });

      // Navigate to role-based dashboard
      if (data.user) {
        await navigateToRoleDashboard(data.user.id);
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate input before making API call
      const result = signupSchema.safeParse({ email, password, fullName });
      if (!result.success) {
        toast({
          title: "Validation Error",
          description: result.error.errors[0].message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          data: {
            full_name: result.data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create appropriate role and profile
        if (selectedRole === "client") {
          const { error: roleError } = await supabase.from("user_roles").insert([{
            user_id: data.user.id,
            role: "client",
          }] as any);
          
          if (roleError) {
            console.error("Role creation error:", roleError);
            throw new Error("Failed to create user role");
          }

          // Split name for first_name/last_name
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          const { error: clientError } = await supabase.from("clients").insert({
            user_id: data.user.id,
            company_name: fullName,
            contact_name: fullName,
            first_name: firstName,
            last_name: lastName,
            email: email,
            client_type: 'real_estate' as const,
          });

          if (clientError) {
            console.error("Client creation error:", clientError);
            throw new Error("Failed to create client profile");
          }
        } else if (selectedRole === "agent") {
          const { error: roleError } = await supabase.from("user_roles").insert([{
            user_id: data.user.id,
            role: "agent",
          }] as any);

          if (roleError) {
            console.error("Role creation error:", roleError);
            throw new Error("Failed to create user role");
          }

          // Split name for first_name/last_name
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          const { error: leadError } = await supabase.from("pros").insert({
            user_id: data.user.id,
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: '', // Required field - will need to be updated later
            status: "new",
          });

          if (leadError) {
            console.error("Lead creation error:", leadError);
            throw new Error("Failed to create agent profile");
          }
        }
        // Staff signup removed - only admins can create staff accounts

        // Wait a moment for database propagation
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "Account created!",
        description: "Welcome to the CRM platform.",
      });

      // Navigate to role-based dashboard
      if (data.user) {
        await navigateToRoleDashboard(data.user.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img src={owlDoorLogo} alt="OwlDoor" className="h-16" />
          </div>
          <CardDescription className="text-center">
            Connecting Real Estate Agents with Top Brokerages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              {show2FA ? (
                <form onSubmit={handleVerify2FA} className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold mb-2">Enter Verification Code</h3>
                    <p className="text-sm text-muted-foreground">
                      A 6-digit code has been sent to your phone
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      required
                      className="text-center text-2xl tracking-widest"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length !== 6}>
                    {isLoading ? "Verifying..." : "Verify & Sign In"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => {
                      setShow2FA(false);
                      setVerificationCode("");
                      setVerificationId("");
                    }}
                  >
                    Back to Sign In
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with email
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
                <Button 
                  type="button" 
                  variant="link" 
                  className="w-full text-sm text-muted-foreground hover:text-primary" 
                  onClick={() => navigate("/password-reset", { state: { email } })}
                >
                  Forgot Password?
                </Button>
              </form>
              )}
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
