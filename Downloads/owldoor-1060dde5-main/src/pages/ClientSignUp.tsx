import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, ArrowRight, Clock, Building2, DollarSign } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";
import { logSMSConsent, getUserIP } from "@/lib/smsConsent";

const ClientSignUp = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [locations, setLocations] = useState([{ city: "", state: "" }]);

  // Form data state
  const [formData, setFormData] = useState({
    // User Type Selection
    userType: "real_estate" as "real_estate" | "mortgage",
    
    // Step 1: Team Information
    companyName: "",
    brokerage: "",
    city: "",
    state: "",
    title: "",
    
    // Step 2: Business Numbers
    yearlySales: "",
    yearlyTransactions: "",
    teamSize: "",
    
    // Step 3: Hiring Preferences
    agentTypes: [] as string[],
    hiringCount: "",
    
    // Step 4: Locations - handled by locations state
    
    // Step 5: User Info
    firstName: "",
    lastName: "",
    email: "",
    
    // Step 6: Phone and Consent
    phone: "",
    consentChecked: false,
    
    // Step 7: Authentication
    verificationCode: "",
    password: "",
    confirmPassword: "",
  });

  const totalSteps = 8;
  const progress = (step / totalSteps) * 100;
  
  // Calculate time remaining (starts at 2.5 minutes, decreases by 30 seconds per step)
  const timeRemaining = Math.max(0, 150 - ((step - 1) * 30)); // in seconds
  const minutesLeft = Math.floor(timeRemaining / 60);
  const secondsLeft = timeRemaining % 60;

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Auto-populate full_name when first_name or last_name changes
      if (field === "firstName" || field === "lastName") {
        const firstName = field === "firstName" ? value as string : prev.firstName;
        const lastName = field === "lastName" ? value as string : prev.lastName;
        // Don't update full_name here, we'll set it during submission
      }
      
      return updated;
    });
  };

  // Handle Enter key press to advance
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
        // User type selection - always valid since it has a default
        break;
      case 2:
        if (!formData.companyName || !formData.brokerage || !formData.city || !formData.state || !formData.title) {
          toast({
            title: "Required Fields",
            description: "Please fill in all required fields.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 3:
        if (!formData.yearlySales || !formData.yearlyTransactions || !formData.teamSize) {
          toast({
            title: "Required Fields",
            description: "Please fill in all business numbers.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 4:
        if (formData.agentTypes.length === 0 || !formData.hiringCount) {
          toast({
            title: "Required Fields",
            description: "Please select agent types and hiring count.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 5:
        const hasValidLocation = locations.some(loc => loc.city && loc.state);
        if (!hasValidLocation) {
          toast({
            title: "Required Fields",
            description: "Please enter at least one city and state.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 6:
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
      case 7:
        if (!formData.phone || !formData.consentChecked) {
          toast({
            title: "Required Fields",
            description: "Please enter your phone and agree to the terms.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 8:
        if (!formData.password || formData.password.length < 8) {
          toast({
            title: "Invalid Password",
            description: "Password must be at least 8 characters.",
            variant: "destructive",
          });
          return false;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          toast({
            title: "Weak Password",
            description: "Password must contain uppercase, lowercase, and number.",
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
    }
    return true;
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/application-pending`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      setLoading(true);

      // Log SMS consent for compliance
      if (formData.consentChecked && formData.phone) {
        const userIP = await getUserIP();
        await logSMSConsent({
          phone_number: formData.phone,
          consent_given: true,
          consent_method: 'website',
          consent_text: 'By checking the consent box, you agree to receive SMS notifications from OwlDoor.',
          ip_address: userIP,
          double_opt_in_confirmed: false
        });
      }

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/application-pending`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create client profile
        const cities = locations.filter(loc => loc.city).map(loc => loc.city);
        const states = locations.filter(loc => loc.state).map(loc => loc.state);
        const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
        
        const { error: clientError } = await supabase.from("clients").insert({
          user_id: authData.user.id,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          contact_name: fullName,
          company_name: formData.companyName,
          brokerage: formData.brokerage || null,
          phone: formData.phone,
          cities: cities,
          states: states,
          yearly_sales: formData.yearlySales ? parseFloat(formData.yearlySales) : null,
          preferences: {
            yearly_transactions: formData.yearlyTransactions ? parseInt(formData.yearlyTransactions) : null,
            team_size: formData.teamSize ? parseInt(formData.teamSize) : null,
            hiring_preferences: {
              agent_types: formData.agentTypes,
              hiring_count: formData.hiringCount,
              title: formData.title,
            },
          },
          client_type: formData.userType,
          active: false, // Pending approval
          profile_completed: true,
        });

        if (clientError) throw clientError;

        // Create user role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          role: "client",
        });

        if (roleError) throw roleError;

        toast({
          title: "Application Submitted",
          description: "Thank you for applying! We'll review your application soon.",
        });

        navigate("/application-pending");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <img src={owlDoorLogo} alt="OwlDoor" className="h-16 md:h-20 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold">Join OwlDoor</h1>
          <p className="text-muted-foreground mt-2 md:text-lg">Apply to become a partner agent</p>
        </div>

        <Card className="min-h-[600px]">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>
                  Completion Time Left: {minutesLeft}:{secondsLeft.toString().padStart(2, '0')}
                </CardTitle>
              </div>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: User Type Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <CardDescription className="text-lg md:text-xl font-semibold mb-2">What type of business are you?</CardDescription>
                  <p className="text-sm text-muted-foreground">This helps us match you with the right professionals</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <Button
                    type="button"
                    variant={formData.userType === "real_estate" ? "default" : "outline"}
                    className="h-32 flex-col gap-3 text-lg"
                    onClick={() => handleInputChange("userType", "real_estate")}
                  >
                    <Building2 className="h-10 w-10" />
                    <div className="text-center">
                      <div className="font-semibold">Real Estate</div>
                      <div className="text-xs text-muted-foreground mt-1">Brokerage or Team</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={formData.userType === "mortgage" ? "default" : "outline"}
                    className="h-32 flex-col gap-3 text-lg"
                    onClick={() => handleInputChange("userType", "mortgage")}
                  >
                    <DollarSign className="h-10 w-10" />
                    <div className="text-center">
                      <div className="font-semibold">Mortgage</div>
                      <div className="text-xs text-muted-foreground mt-1">Lender or Branch</div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Team Information */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <CardDescription className="text-lg md:text-xl font-semibold mb-2">Brokerage</CardDescription>
                  <Input
                    id="brokerage"
                    placeholder="e.g., Keller Williams"
                    value={formData.brokerage}
                    onChange={(e) => handleInputChange("brokerage", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>

                <div className="space-y-4">
                  <CardDescription className="text-lg md:text-xl font-semibold mb-4">Tell us about your team</CardDescription>
                  
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="md:text-lg">City *</Label>
                      <Input
                        id="city"
                        placeholder="e.g., Miami"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="md:text-lg md:h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="md:text-lg">State *</Label>
                      <Input
                        id="state"
                        placeholder="e.g., Florida"
                        value={formData.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="md:text-lg md:h-12"
                      />
                    </div>
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
              </div>
            )}

            {/* Step 3: Business Numbers */}
            {step === 3 && (
              <div className="space-y-4">
                <CardDescription className="text-lg md:text-xl font-semibold mb-4">Let's Talk Numbers</CardDescription>

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
                  <Label htmlFor="yearlyTransactions" className="md:text-lg">Yearly Team Transactions (Number) *</Label>
                  <Input
                    id="yearlyTransactions"
                    type="number"
                    placeholder="50"
                    value={formData.yearlyTransactions}
                    onChange={(e) => handleInputChange("yearlyTransactions", e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamSize" className="md:text-lg">Team Size (Number) *</Label>
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

            {/* Step 4: Hiring Preferences */}
            {step === 4 && (
              <div className="space-y-6">
                <CardDescription className="text-lg md:text-xl font-semibold">Who Do you want to hire?</CardDescription>

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
                  <Label className="md:text-lg">How Many Agents Do You Want To Hire In the Next 3 Months *</Label>
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

            {/* Step 5: Locations */}
            {step === 5 && (
              <div className="space-y-4">
                <CardDescription className="text-lg md:text-xl font-semibold">Where are you looking to Hire?</CardDescription>

                {locations.map((location, index) => (
                  <div key={index} className="space-y-3 p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="md:text-lg">City *</Label>
                        <Input
                          placeholder="e.g., Miami"
                          value={location.city}
                          onChange={(e) => {
                            const newLocations = [...locations];
                            newLocations[index].city = e.target.value;
                            setLocations(newLocations);
                          }}
                          className="md:text-lg md:h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="md:text-lg">State *</Label>
                        <Input
                          placeholder="e.g., Florida"
                          value={location.state}
                          onChange={(e) => {
                            const newLocations = [...locations];
                            newLocations[index].state = e.target.value;
                            setLocations(newLocations);
                          }}
                          className="md:text-lg md:h-12"
                        />
                      </div>
                    </div>
                    {locations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocations(locations.filter((_, i) => i !== index))}
                        className="md:text-base"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full md:text-lg md:h-12"
                  onClick={() => setLocations([...locations, { city: "", state: "" }])}
                >
                  Add More
                </Button>
              </div>
            )}

            {/* Step 6: User Info */}
            {step === 6 && (
              <div className="space-y-4">
                <CardDescription className="text-lg md:text-xl font-semibold mb-4">Your Info/Login</CardDescription>

                <div className="space-y-2">
                  <Label htmlFor="firstName" className="md:text-lg">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
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
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="md:text-lg">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>
              </div>
            )}

            {/* Step 7: Phone and Consent */}
            {step === 7 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="md:text-lg">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>

                <div className="flex items-start space-x-2 p-3 border rounded-lg bg-muted/20">
                  <Checkbox
                    id="consent"
                    checked={formData.consentChecked}
                    onCheckedChange={(checked) => 
                      handleInputChange("consentChecked", checked as boolean)
                    }
                    className="mt-0.5"
                  />
                  <Label htmlFor="consent" className="text-xs leading-tight cursor-pointer">
                    <span className="font-semibold">I agree to receive autodialed marketing calls and text messages from OwlDoor.com at the phone number I provided.</span> I understand that my consent is not required to make a purchase and that message/data rates may apply. Text STOP to cancel or HELP for help.
                  </Label>
                </div>
              </div>
            )}

            {/* Step 8: Authentication */}
            {step === 8 && (
              <div className="space-y-4">
                <CardDescription className="text-lg font-semibold mb-4">Create your account</CardDescription>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignUp}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Login With Google OR enter Email
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="md:text-lg">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="md:text-lg">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} disabled={loading} className="md:text-lg md:h-12">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button type="button" onClick={handleNext} disabled={loading} className="ml-auto md:text-lg md:h-12">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={loading} className="ml-auto md:text-lg md:h-12">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit Application
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/")}>
              Sign In
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientSignUp;
