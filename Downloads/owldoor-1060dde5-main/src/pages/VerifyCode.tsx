import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import owlLogo from "@/assets/owldoor-logo-light.svg";
import { CheckCircle2 } from "lucide-react";

const VerifyCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [specialization, setSpecialization] = useState<string>("");

  useEffect(() => {
    // Get email and specialization from location state
    const emailFromState = location.state?.email;
    const specializationFromState = location.state?.specialization;
    if (emailFromState) {
      setEmail(emailFromState);
      setSpecialization(specializationFromState || "");
    } else {
      toast.error("Email not found. Please start the signup process again.");
      navigate("/join");
    }
  }, [location, navigate]);

  const handleVerifyCode = async () => {
    if (code.length !== 5) {
      toast.error("Please enter a 5-digit code");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-code', {
        body: { code, email }
      });

      if (error) throw error;

      if (data?.success) {
        setUserId(data.userId);
        setVerified(true);
        toast.success("Code verified! Now create your password.");
      } else {
        throw new Error(data?.error || 'Failed to verify code');
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!userId) {
      toast.error("User ID not found");
      return;
    }

    setLoading(true);
    try {
      // Verify code and set password in one call
      const { data, error } = await supabase.functions.invoke('verify-code', {
        body: {
          code: code,
          email: email,
          password: password
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to set password');
      }

      // Sign in with new password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (signInError) throw signInError;

      toast.success("Password created successfully!");
      
      // Get user roles to determine dashboard redirect
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        
        const roles = rolesData?.map(r => r.role) || [];
        
        // Redirect based on role
        if (roles.includes("admin" as any)) {
          navigate("/admin");
        } else if (roles.includes("staff" as any)) {
          navigate("/staff");
        } else if (roles.includes("client" as any)) {
          navigate("/office");
        } else {
          // Default to pro dashboard (agent/lead)
          navigate("/pro");
        }
      } else {
        // No roles found, try to detect user type
        const { data: clientData } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (clientData) {
          navigate("/office");
          return;
        }

        const { data: proData } = await supabase
          .from("pros")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (proData) {
          navigate("/pro");
        }
      }
    } catch (error: any) {
      console.error("Password setup error:", error);
      toast.error(error.message || "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#528868] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="text-center space-y-6 relative z-10">
          <img src={owlLogo} alt="OwlDoor" className="w-80 mx-auto opacity-95 drop-shadow-lg" />
          <p className="text-2xl text-white font-semibold">Verify your account - We Just Sent a Code to Your Phone and Email</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-[#528868] flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl">
          {!verified ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Enter Verification Code</h2>
                <p className="text-gray-600">
                  We sent a 5-digit code to {email}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-700 font-semibold">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  maxLength={5}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="12345"
                  className="h-14 text-center text-2xl font-bold tracking-widest border-2 border-gray-200 focus:border-green-500 transition-colors"
                />
              </div>

              <Button
                onClick={handleVerifyCode}
                disabled={loading || code.length !== 5}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold h-12 shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </Button>

              <p className="text-sm text-center text-gray-600">
                Didn't receive a code?{" "}
                <button
                  onClick={() => navigate("/join")}
                  className="text-green-600 hover:text-green-700 font-semibold hover:underline"
                >
                  Request new code
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Code Verified!</h2>
                <p className="text-gray-600">Now create your password</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-semibold">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min 6 characters)"
                    className="h-12 border-2 border-gray-200 focus:border-green-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="h-12 border-2 border-gray-200 focus:border-green-500 transition-colors"
                  />
                </div>
              </div>

              <Button
                onClick={handleSetPassword}
                disabled={loading || !password || !confirmPassword}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold h-12 shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? "Creating Account..." : "Create Password & Sign In"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;
