import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ZipRadiusInput } from "@/components/ZipRadiusInput";
import owlDoorLogo from "@/assets/owldoor-icon.svg";
import { Textarea } from "@/components/ui/textarea";
import { PaymentMethodManager } from "@/components/client/PaymentMethodManager";

const TeamSignUp = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [signupLink, setSignupLink] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const linkSlug = searchParams.get("link");

  useEffect(() => {
    if (linkSlug) {
      fetchSignupLink();
    }
  }, [linkSlug]);

  const fetchSignupLink = async () => {
    try {
      const { data, error } = await supabase
        .from("signup_links")
        .select(`
          *,
          pricing_packages (*)
        `)
        .eq("link_slug", linkSlug)
        .eq("active", true)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Invalid Link",
          description: "This sign-up link is not valid or has expired.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Check max uses
      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast({
          title: "Link Expired",
          description: "This sign-up link has reached its maximum uses.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast({
          title: "Link Expired",
          description: "This sign-up link has expired.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setSignupLink(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const [formData, setFormData] = useState({
    companyName: "",
    brokerage: "",
    title: "",
    yearlySales: "",
    yearlyTransactions: "",
    teamSize: "",
    agentTypes: [] as string[],
    hiringCount: "",
    zipRadiuses: [] as { zip: string; radius: number }[],
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    consentChecked: false,
    password: "",
    confirmPassword: "",
    additionalInfo: "",
  });

  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  
  const totalSteps = 8;
  const progress = (step / totalSteps) * 100;
  const timeRemaining = Math.max(0, 150 - ((step - 1) * 30));
  const minutesLeft = Math.floor(timeRemaining / 60);
  const secondsLeft = timeRemaining % 60;

  const handleInputChange = (field: string, value: string | string[] | boolean | { zip: string; radius: number }[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.companyName || !formData.title) {
          toast({
            title: "Required Fields",
            description: "Please enter your team/company name and your title.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 2:
        if (!formData.yearlySales || !formData.yearlyTransactions || !formData.teamSize) {
          toast({
            title: "Required Fields",
            description: "Please fill in all business numbers.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 3:
        if (formData.agentTypes.length === 0 || !formData.hiringCount) {
          toast({
            title: "Required Fields",
            description: "Please select agent types and hiring count.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 4:
        if (formData.zipRadiuses.length === 0) {
          toast({
            title: "Required Fields",
            description: "Please add at least one zip code with radius.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 5:
        if (!formData.firstName || !formData.lastName || !formData.email) {
          toast({
            title: "Required Fields",
            description: "Please enter your name and email.",
            variant: "destructive",
          });
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          toast({
            title: "Invalid Email",
            description: "Please enter a valid email address.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 6:
        if (!formData.phone || !formData.consentChecked) {
          toast({
            title: "Required Fields",
            description: "Please enter your phone and agree to the terms.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 7:
        if (!formData.password || formData.password.length < 6) {
          toast({
            title: "Invalid Password",
            description: "Password must be at least 6 characters.",
            variant: "destructive",
          });
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Password Mismatch",
            description: "Passwords do not match.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 8:
        if (!hasPaymentMethod) {
          toast({
            title: "Payment Required",
            description: "Please add a payment method to continue.",
            variant: "destructive",
          });
          return false;
        }
        break;
    }
    return true;
  };

  const handleCreateAccount = async () => {
    if (!validateStep()) return;

    try {
      setLoading(true);

      // Sign up user first at step 7
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/client-dashboard`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        setTempUserId(authData.user.id);
        toast({
          title: "Account Created",
          description: "Now add your payment method to complete signup.",
        });
        setStep(8); // Move to payment step
      }
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

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!tempUserId) {
      toast({
        title: "Error",
        description: "Please complete the previous steps first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const zipCodes = formData.zipRadiuses.map(z => z.zip);
      
      const { error: clientError } = await supabase.from("clients").insert({
        user_id: tempUserId,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        contact_name: `${formData.firstName} ${formData.lastName}`,
        company_name: formData.companyName,
        brokerage: formData.brokerage || null,
        phone: formData.phone,
        zip_codes: zipCodes,
        yearly_sales: formData.yearlySales ? parseFloat(formData.yearlySales) : null,
        preferences: {
          yearly_transactions: formData.yearlyTransactions ? parseInt(formData.yearlyTransactions) : null,
          team_size: formData.teamSize ? parseInt(formData.teamSize) : null,
          hiring_preferences: {
            agent_types: formData.agentTypes,
            hiring_count: formData.hiringCount,
            title: formData.title,
          },
          additional_info: formData.additionalInfo,
          zip_radiuses: formData.zipRadiuses,
        },
        client_type: "real_estate",
        active: true,
        profile_completed: true,
        current_package_id: signupLink?.package_id || null,
        has_payment_method: true,
      });

      if (clientError) throw clientError;

      // Create user role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: tempUserId,
        role: "client",
      });

      if (roleError) throw roleError;

      // Increment signup link usage
      if (signupLink) {
        await supabase
          .from("signup_links")
          .update({ current_uses: signupLink.current_uses + 1 })
          .eq("id", signupLink.id);
      }

      // Send admin notification
      try {
        await supabase.functions.invoke("notify-admin-signup", {
          body: {
            user_id: tempUserId,
            client_name: formData.companyName,
            email: formData.email,
            package_name: signupLink?.pricing_packages?.name,
            package_cost: signupLink?.pricing_packages?.monthly_cost,
          },
        });
      } catch (notifyError) {
        console.error("Failed to send admin notification:", notifyError);
        // Don't block signup if notification fails
      }

      toast({
        title: "Welcome to OwlDoor!",
        description: "Your account has been created successfully.",
      });

      navigate("/client-dashboard");
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

  if (!signupLink && linkSlug) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const customVerbiage = signupLink?.custom_verbiage || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <img src={owlDoorLogo} alt="OwlDoor" className="h-16 md:h-20 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold">
            {customVerbiage.title || `Join OwlDoor - ${signupLink?.pricing_packages?.name || ""} Plan`}
          </h1>
          <p className="text-muted-foreground mt-2 md:text-lg">
            {customVerbiage.subtitle || signupLink?.description || "Start growing your real estate team today"}
          </p>
        </div>

        <Card className="min-h-[600px]">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>
                  Time Left: {minutesLeft}:{secondsLeft.toString().padStart(2, '0')}
                </CardTitle>
              </div>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Team Information */}
            {step === 1 && (
              <div className="space-y-4">
                <CardDescription className="text-lg md:text-xl font-semibold mb-4">
                  {customVerbiage.step1_title || "Tell us about your team"}
                </CardDescription>
                
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="md:text-lg">Team/Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., Miami Dream Homes"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brokerage" className="md:text-lg">Brokerage</Label>
                  <Input
                    id="brokerage"
                    placeholder="e.g., Keller Williams"
                    value={formData.brokerage}
                    onChange={(e) => handleInputChange("brokerage", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="md:text-lg">Your Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Team Lead, Broker"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Business Numbers */}
            {step === 2 && (
              <div className="space-y-4">
                <CardDescription className="text-lg md:text-xl font-semibold mb-4">
                  {customVerbiage.step2_title || "Let's Talk Numbers"}
                </CardDescription>

                <div className="space-y-2">
                  <Label htmlFor="yearlySales" className="md:text-lg">Gross Yearly Sales ($) *</Label>
                  <Input
                    id="yearlySales"
                    type="number"
                    placeholder="5000000"
                    value={formData.yearlySales}
                    onChange={(e) => handleInputChange("yearlySales", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearlyTransactions" className="md:text-lg">Yearly Team Transactions *</Label>
                  <Input
                    id="yearlyTransactions"
                    type="number"
                    placeholder="50"
                    value={formData.yearlyTransactions}
                    onChange={(e) => handleInputChange("yearlyTransactions", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamSize" className="md:text-lg">Team Size *</Label>
                  <Input
                    id="teamSize"
                    type="number"
                    placeholder="10"
                    value={formData.teamSize}
                    onChange={(e) => handleInputChange("teamSize", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Hiring Preferences */}
            {step === 3 && (
              <div className="space-y-6">
                <CardDescription className="text-lg md:text-xl font-semibold">
                  {customVerbiage.step3_title || "Who Do You Want to Hire?"}
                </CardDescription>

                <div className="space-y-3">
                  <Label className="md:text-lg">Select Agent Types *</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {["New Agents", "Experienced Agents", "Top Agents"].map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={formData.agentTypes.includes(type) ? "default" : "outline"}
                        className="w-full justify-start md:text-lg md:h-12"
                        onClick={() => {
                          const current = formData.agentTypes;
                          const updated = current.includes(type)
                            ? current.filter(t => t !== type)
                            : [...current, type];
                          handleInputChange("agentTypes", updated);
                        }}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="md:text-lg">How Many Agents in the Next 3 Months? *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {["1-3", "3-10", "10-25", "25-50", "Over 50"].map((count) => (
                      <Button
                        key={count}
                        type="button"
                        variant={formData.hiringCount === count ? "default" : "outline"}
                        onClick={() => handleInputChange("hiringCount", count)}
                        className="md:text-lg"
                      >
                        {count}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Service Area */}
            {step === 4 && (
              <div className="space-y-4">
                <CardDescription className="text-lg md:text-xl font-semibold">
                  {customVerbiage.step4_title || "Where Are You Hiring?"}
                </CardDescription>
                <p className="text-sm text-muted-foreground">
                  Enter zip codes and radius. You can add more areas later in your dashboard.
                </p>

                <ZipRadiusInput
                  onZipRadiusChange={(zips) => handleInputChange("zipRadiuses", zips)}
                  initialValue={formData.zipRadiuses}
                />
              </div>
            )}

            {/* Step 5: User Info */}
            {step === 5 && (
              <div className="space-y-4">
                <CardDescription className="text-lg md:text-xl font-semibold mb-4">
                  {customVerbiage.step5_title || "Your Contact Information"}
                </CardDescription>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="md:text-lg">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="md:text-lg md:h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="md:text-lg">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="md:text-lg md:h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="md:text-lg">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>
              </div>
            )}

            {/* Step 6: Phone and Consent */}
            {step === 6 && (
              <div className="space-y-4">
                <CardDescription className="text-lg md:text-xl font-semibold mb-4">
                  {customVerbiage.step6_title || "Almost There!"}
                </CardDescription>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="md:text-lg">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo" className="md:text-lg">Anything Else We Should Know?</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Tell us more about your goals..."
                    value={formData.additionalInfo}
                    onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                    className="md:text-lg min-h-[100px]"
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="consent"
                    checked={formData.consentChecked}
                    onCheckedChange={(checked) => handleInputChange("consentChecked", checked as boolean)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="consent" className="text-xs leading-tight cursor-pointer">
                    By opting in, you'll receive SMS messages from OwlDoor for authentication, account alerts, and marketing. Msg & data rates may apply. Msg frequency varies. Reply STOP to cancel, HELP for help. <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> | <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>
                  </Label>
                </div>
              </div>
            )}

            {/* Step 7: Create Password */}
            {step === 7 && (
              <div className="space-y-4">
                <CardDescription className="text-lg md:text-xl font-semibold mb-4">
                  {customVerbiage.step7_title || "Secure Your Account"}
                </CardDescription>

                <div className="space-y-2">
                  <Label htmlFor="password" className="md:text-lg">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="md:text-lg md:h-12"
                  />
                  <p className="text-sm text-muted-foreground">Minimum 6 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="md:text-lg">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>

                {signupLink?.pricing_packages && (
                  <div className="p-4 bg-muted rounded-lg mt-6">
                    <h3 className="font-semibold mb-2">Your Package:</h3>
                    <p className="text-lg font-bold">{signupLink.pricing_packages.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ${signupLink.pricing_packages.monthly_cost}/month
                    </p>
                    {signupLink.pricing_packages.description && (
                      <p className="text-sm mt-2">{signupLink.pricing_packages.description}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 8: Payment Method (FINAL STEP) */}
            {step === 8 && (
              <div className="space-y-4">
                <CardDescription className="text-lg md:text-xl font-semibold mb-4">
                  Final Step: Add Payment Method
                </CardDescription>
                <p className="text-sm text-muted-foreground mb-4">
                  To complete your signup and access your package, please add a payment method.
                </p>

                {signupLink?.pricing_packages && (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mb-6">
                    <h3 className="font-semibold mb-2 text-primary">Package Summary:</h3>
                    <p className="text-lg font-bold">{signupLink.pricing_packages.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ${signupLink.pricing_packages.monthly_cost}/month
                    </p>
                    {signupLink.pricing_packages.description && (
                      <p className="text-sm mt-2">{signupLink.pricing_packages.description}</p>
                    )}
                  </div>
                )}

                <PaymentMethodManager
                  hasPaymentMethod={hasPaymentMethod}
                  onUpdate={() => setHasPaymentMethod(true)}
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              {step > 1 && step !== 8 && (
                <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              {step < 7 && (
                <Button type="button" onClick={handleNext} disabled={loading} className="ml-auto">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {step === 7 && (
                <Button type="button" onClick={handleCreateAccount} disabled={loading} className="ml-auto">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {step === 8 && (
                <Button type="button" onClick={handleSubmit} disabled={loading || !hasPaymentMethod} className="ml-auto">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Complete Sign Up & Activate Package
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamSignUp;
