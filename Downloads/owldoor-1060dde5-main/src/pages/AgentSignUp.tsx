import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";
import { LoadScript } from "@react-google-maps/api";
import { ZipRadiusInput } from "@/components/ZipRadiusInput";
import owlWave from "@/assets/owl-wave.svg";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";
import { logSMSConsent, getUserIP } from "@/lib/smsConsent";

const AgentSignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { apiKey, loading: apiKeyLoading } = useGoogleMapsApiKey();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [showOtherBrokerages, setShowOtherBrokerages] = useState(false);

  const [formData, setFormData] = useState({
    // Service Area - Step 1
    zipRadiuses: [] as { zip: string; radius: number }[],
    // Personal Info - moved to step 7
    firstName: "",
    lastName: "",
    yearsExperience: "",
    // User Type Selection
    userType: "real_estate" as "real_estate" | "mortgage",
    // Other fields
    teamProvides: [] as string[],
    motivation: 3,
    homesNextYear: "",
    homesPastYear: "",
    primaryLocation: "",
    workPreference: [] as string[],
    currentBrokerage: "",
    brokerageBlacklist: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    consentChecked: false,
    smsOptIn: false,
  });

  const teamOptions = [
    "Free Leads",
    "Referrals",
    "Coaching",
    "Tech & Tools",
    "CRM & Website",
    "Marketing",
    "High Split",
    "Top 1% Team",
    "Benefits",
    "Other"
  ];

  const workPreferences = ["Office", "Remote", "Either One"];

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle Enter key press to advance
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const toggleArrayValue = (field: string, value: string) => {
    const currentArray = formData[field as keyof typeof formData] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    handleInputChange(field, newArray);
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (formData.zipRadiuses.length === 0) {
          toast({ title: "Error", description: "Please add at least one zip code with radius", variant: "destructive" });
          return false;
        }
        return true;
      case 3:
        if (formData.teamProvides.length === 0) {
          toast({ title: "Error", description: "Please select at least one option", variant: "destructive" });
          return false;
        }
        if (formData.teamProvides.includes("Other") && !otherText.trim()) {
          toast({ title: "Error", description: "Please specify what 'Other' means", variant: "destructive" });
          return false;
        }
        return true;
      case 4:
        if (!formData.homesNextYear || !formData.homesPastYear) {
          toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
          return false;
        }
        return true;
      case 5:
        if (formData.workPreference.length === 0) {
          toast({ title: "Error", description: "Please select your work preference", variant: "destructive" });
          return false;
        }
        return true;
      case 6:
        if (!formData.currentBrokerage.trim()) {
          toast({ title: "Error", description: "Please enter your current brokerage", variant: "destructive" });
          return false;
        }
        if (showOtherBrokerages && !formData.brokerageBlacklist.trim()) {
          toast({ title: "Error", description: "Please list brokerages or select 'No'", variant: "destructive" });
          return false;
        }
        return true;
      case 7:
        if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.yearsExperience) {
          toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
          return false;
        }
        return true;
      case 8:
        if (!formData.phone.trim() || !formData.consentChecked) {
          toast({ title: "Error", description: "Please provide phone number and consent to SMS", variant: "destructive" });
          return false;
        }
        return true;
      case 9:
        if (!formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
          toast({ title: "Error", description: "Please provide email and passwords", variant: "destructive" });
          return false;
        }
        if (formData.password.length < 8) {
          toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
          return false;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          toast({ title: "Error", description: "Password must contain uppercase, lowercase, and number", variant: "destructive" });
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(9)) return;

    setLoading(true);
    try {
      // Log SMS consent for compliance
      if (formData.smsOptIn) {
        const userIP = await getUserIP();
        await logSMSConsent({
          phone_number: formData.phone,
          consent_given: true,
          consent_method: 'website',
          consent_text: 'By checking the SMS opt-in box, you agree to receive SMS notifications from OwlDoor.',
          ip_address: userIP,
          double_opt_in_confirmed: false
        });
      }

      // Use unified GeocodingService with multi-tier fallbacks
      const { GeocodingService } = await import('@/lib/geocoding/geocodingService');
      let geocodedData = { zipCodes: [], cities: [], states: [], coordinates: [] };
      const coverageAreas = [];
      
      if (formData.zipRadiuses.length > 0) {
        const uniqueCities = new Set<string>();
        const uniqueStates = new Set<string>();
        const uniqueCounties = new Set<string>();
        const zipCodes: string[] = [];
        
        for (const { zip, radius } of formData.zipRadiuses) {
          // Use GeocodingService with automatic fallbacks
          const result = await GeocodingService.geocode({ zip });
          
          if (result) {
            zipCodes.push(zip);
            uniqueCities.add(result.city);
            uniqueStates.add(result.stateCode);
            if (result.county) uniqueCounties.add(result.county);
            
            // Store detailed coverage area with all geocoded data
            coverageAreas.push({
              type: 'zip_radius',
              zip: zip,
              radius: radius,
              city: result.city,
              state: result.stateCode,
              county: result.county || '',
              latitude: result.latitude,
              longitude: result.longitude,
              source: result.source, // Track which service was used
            });
          } else {
            console.warn(`Failed to geocode ZIP ${zip}`);
            toast({
              title: "Warning",
              description: `Could not geocode ZIP ${zip}, but continuing with signup`,
            });
          }
        }
        
        geocodedData = {
          zipCodes,
          cities: Array.from(uniqueCities),
          states: Array.from(uniqueStates),
          coordinates: [] // Will be calculated on backend if needed
        };
      }

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // Prepare team provides with "Other" text if applicable
      const teamProvidesWithOther = formData.teamProvides.includes("Other")
        ? [...formData.teamProvides.filter(item => item !== "Other"), `Other: ${otherText}`]
        : formData.teamProvides;

      // Create agent profile with service area data
      const serviceAreaNotes = `Zip codes: ${formData.zipRadiuses.map(z => `${z.zip} (${z.radius}mi)`).join(", ")}`;
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

      const { error: leadError } = await supabase.from("pros").insert([{
        user_id: authData.user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: fullName,
        email: formData.email,
        phone: formData.phone,
        experience: parseInt(formData.yearsExperience),
        wants: teamProvidesWithOther,
        motivation: formData.motivation,
        cities: geocodedData.cities.length > 0 ? geocodedData.cities : [],
        zip_codes: geocodedData.zipCodes.length > 0 ? geocodedData.zipCodes : formData.zipRadiuses.map(z => z.zip),
        states: geocodedData.states.length > 0 ? geocodedData.states : [],
        coverage_areas: coverageAreas,
        brokerage: formData.currentBrokerage,
        pipeline_type: "agent",
        pipeline_stage: "new",
        status: "new",
        pro_type: formData.userType === "real_estate" ? "real_estate_agent" : "mortgage_officer",
        tags: formData.workPreference.includes("Either One") 
          ? ["Office", "Remote"] 
          : formData.workPreference,
        notes: `${serviceAreaNotes}. Geocoded: ${geocodedData.zipCodes.length} zips, ${geocodedData.cities.length} cities${showOtherBrokerages ? `. Blacklisted brokerages: ${formData.brokerageBlacklist}` : ""}`,
        sms_opt_in: formData.smsOptIn,
      }]);

      if (leadError) throw leadError;

      // Assign lead role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role: "lead",
      });

      if (roleError) {
        // Check if it's a duplicate key error
        if (roleError.message?.includes("duplicate key value violates unique constraint")) {
          toast({
            title: "Account Already Exists",
            description: "You already have an account. Redirecting to password reset...",
          });
          setTimeout(() => {
            navigate("/password-reset", { state: { email: formData.email } });
          }, 1500);
          return;
        }
        throw roleError;
      }

      toast({ title: "Success!", description: "Welcome to OwlDoor! Please complete your profile to get started." });
      navigate("/onboarding");
    } catch (error: any) {
      console.error("Error during sign up:", error);
      
      // Check for duplicate user errors in other places
      if (error.message?.includes("duplicate key value violates unique constraint") || 
          error.message?.includes("User already registered")) {
        toast({
          title: "Account Already Exists",
          description: "Redirecting to password reset...",
        });
        setTimeout(() => {
          navigate("/password-reset", { state: { email: formData.email } });
        }, 1500);
        return;
      }

      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (apiKeyLoading || !apiKey) {
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
    <LoadScript googleMapsApiKey={apiKey} libraries={["drawing", "geometry"]}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl space-y-4">
          <div className="flex flex-col items-center space-y-2">
            <img src={owlDoorLogo} alt="OwlDoor" className="h-16 w-auto" />
          </div>
          
          <Card className="w-full min-h-[600px]">
          <CardContent className="space-y-6 pt-6">
            {/* Step 1: Service Area - Zip + Radius Only */}
            {step === 1 && (
              <div className="space-y-4 pt-4">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold mb-2">What's Your Service Area?</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter zip codes and radius. You can add more areas later in your dashboard.
                  </p>
                </div>
                <ZipRadiusInput
                  onZipRadiusChange={(zips) => handleInputChange("zipRadiuses", zips)}
                  initialValue={formData.zipRadiuses}
                />
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={formData.zipRadiuses.length === 0}
                  className="w-full"
                >
                  Continue to Next Step
                </Button>
              </div>
            )}

          {/* Step 2: Welcome with Owl */}
          {step === 2 && (
            <div className="space-y-6 text-center">
              <h3 className="text-2xl md:text-3xl font-semibold">Great! Let's Keep Going</h3>
              <div className="flex justify-center">
                <img 
                  src={owlWave} 
                  alt="Waving Owl" 
                  className="w-64 h-64 object-contain animate-pulse"
                />
              </div>
              <p className="text-lg md:text-xl text-muted-foreground">This will only take 1-2 Minutes</p>
            </div>
          )}

          {/* Step 3: Team Provides */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm md:text-base font-normal text-muted-foreground">What would be REALLY valuable to you?</h3>
                <p className="text-xl md:text-2xl font-semibold">What Should A Team Provide You With</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {teamOptions.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={formData.teamProvides.includes(option) ? "default" : "outline"}
                    className="h-auto py-4 md:text-lg"
                    onClick={() => toggleArrayValue("teamProvides", option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              {formData.teamProvides.includes("Other") && (
                <div>
                  <Label htmlFor="otherText" className="md:text-lg">Please specify:</Label>
                  <Input
                    id="otherText"
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="What else is valuable to you?"
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Motivation & Goals */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm md:text-base font-normal text-muted-foreground mb-4">
                  If you were provided {formData.teamProvides.join(", ")}, how tempted on a 1-10 would you be?
                </h3>
                <div className="flex gap-2 justify-center mb-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleInputChange("motivation", rating)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 md:w-10 md:h-10 ${
                          rating <= formData.motivation
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm md:text-base text-muted-foreground">{formData.motivation}/10</p>
              </div>
              <div>
                <Label htmlFor="homesNextYear" className="text-xl md:text-2xl font-semibold">How many homes would you like to sell in the next 12 months? *</Label>
                <Input
                  id="homesNextYear"
                  type="number"
                  min="0"
                  value={formData.homesNextYear}
                  onChange={(e) => handleInputChange("homesNextYear", e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="md:text-lg md:h-12"
                />
              </div>
              <div>
                <Label htmlFor="homesPastYear" className="text-xl md:text-2xl font-semibold">How many have you sold in the past 12 months? *</Label>
                <Input
                  id="homesPastYear"
                  type="number"
                  min="0"
                  value={formData.homesPastYear}
                  onChange={(e) => handleInputChange("homesPastYear", e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="md:text-lg md:h-12"
                />
              </div>
            </div>
          )}

          {/* Step 5: Work Preference */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm md:text-base font-normal text-muted-foreground">One more thing...</h3>
              <div>
                <Label className="text-xl md:text-2xl font-semibold">Do you Prefer working at an Office or Remote or it Doesn't Matter? *</Label>
                <div className="flex gap-3 mt-2">
                  {workPreferences.map((pref) => (
                    <Button
                      key={pref}
                      type="button"
                      variant={formData.workPreference.includes(pref) ? "default" : "outline"}
                      onClick={() => toggleArrayValue("workPreference", pref)}
                      className="md:text-lg"
                    >
                      {pref}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Brokerage */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentBrokerage" className="text-xl md:text-2xl font-semibold">What Brokerage are you with? *</Label>
                <p className="text-sm md:text-base font-normal text-muted-foreground mb-2">So we don't match you with them</p>
                <Input
                  id="currentBrokerage"
                  value={formData.currentBrokerage}
                  onChange={(e) => handleInputChange("currentBrokerage", e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="md:text-lg md:h-12"
                />
              </div>
              <div>
                <Label className="text-xl md:text-2xl font-semibold">Are there any other Brokerages you don't want to hear from?</Label>
                <div className="flex gap-3 mt-2">
                  <Button
                    type="button"
                    variant={showOtherBrokerages ? "default" : "outline"}
                    onClick={() => setShowOtherBrokerages(true)}
                    className="md:text-lg"
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={!showOtherBrokerages ? "default" : "outline"}
                    onClick={() => {
                      setShowOtherBrokerages(false);
                      handleInputChange("brokerageBlacklist", "");
                    }}
                    className="md:text-lg"
                  >
                    No
                  </Button>
                </div>
              </div>
              {showOtherBrokerages && (
                <div>
                  <Label htmlFor="brokerageBlacklist" className="md:text-lg">List brokerages to exclude:</Label>
                  <Textarea
                    id="brokerageBlacklist"
                    value={formData.brokerageBlacklist}
                    onChange={(e) => handleInputChange("brokerageBlacklist", e.target.value)}
                    placeholder="Enter brokerage names, separated by commas"
                    className="md:text-lg min-h-[100px]"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 7: Name & Experience (Moved from Step 1) */}
          {step === 7 && (
            <div className="space-y-4">
              <h3 className="text-sm md:text-base font-normal text-muted-foreground">Almost there! Tell us about yourself</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-xl md:text-2xl font-semibold">I am a... *</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <Button
                      type="button"
                      variant={formData.userType === "real_estate" ? "default" : "outline"}
                      className="h-20 text-lg"
                      onClick={() => handleInputChange("userType", "real_estate")}
                    >
                      Real Estate Agent
                    </Button>
                    <Button
                      type="button"
                      variant={formData.userType === "mortgage" ? "default" : "outline"}
                      className="h-20 text-lg"
                      onClick={() => handleInputChange("userType", "mortgage")}
                    >
                      Loan Officer
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="firstName" className="text-xl md:text-2xl font-semibold">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-xl md:text-2xl font-semibold">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="yearsExperience" className="text-xl md:text-2xl font-semibold">Years of Experience *</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    min="0"
                    value={formData.yearsExperience}
                    onChange={(e) => handleInputChange("yearsExperience", e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="md:text-lg md:h-12"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Phone & Consent */}
          {step === 8 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm md:text-base font-normal text-muted-foreground">See that was easy! Here's what is next.</h3>
                <p className="text-xl md:text-2xl font-semibold">
                  We are going to find 1-3 Perfect Matches and send them to you. Then you decide if you want to hear more about what they are offering you.
                </p>
              </div>
              <div>
                <Label htmlFor="phone" className="text-xl md:text-2xl font-semibold">What is the best Number to Text your matches to? *</Label>
                <Input
                  id="phone"
                  type="tel"
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
                  onCheckedChange={(checked) => handleInputChange("consentChecked", checked)}
                  className="mt-0.5"
                />
                <label htmlFor="consent" className="text-xs leading-tight cursor-pointer">
                  By opting in, you'll receive SMS messages from OwlDoor for authentication, account alerts, and marketing. Msg & data rates may apply. Msg frequency varies. Reply STOP to cancel, HELP for help. <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> | <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="smsOptIn"
                  checked={formData.smsOptIn}
                  onCheckedChange={(checked) => handleInputChange("smsOptIn", checked)}
                  className="mt-0.5"
                />
                <label htmlFor="smsOptIn" className="text-sm cursor-pointer">
                  I agree to receive marketing text messages and special offers (optional)
                </label>
              </div>
            </div>
          )}

          {/* Step 9: Email & Password */}
          {step === 9 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm md:text-base font-normal text-muted-foreground">Almost done!</h3>
                <p className="text-xl md:text-2xl font-semibold">Create your account credentials</p>
              </div>
              <div>
                <Label htmlFor="email" className="text-xl md:text-2xl font-semibold">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="md:text-lg md:h-12"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-xl md:text-2xl font-semibold">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="md:text-lg md:h-12"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-xl md:text-2xl font-semibold">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
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
            {step > 1 && step !== 2 && (
              <Button type="button" variant="outline" onClick={handleBack} disabled={loading} className="md:text-lg md:h-12">
                Back
              </Button>
            )}
            {step === 2 && (
              <Button type="button" onClick={handleNext} className="mx-auto md:text-lg md:h-12">
                Let's Go!
              </Button>
            )}
            {step > 2 && step < 9 && (
              <Button type="button" onClick={handleNext} disabled={loading} className="ml-auto md:text-lg md:h-12">
                Continue
              </Button>
            )}
            {step === 9 && (
              <Button type="button" onClick={handleSubmit} disabled={loading} className="ml-auto">
                {loading ? "Creating Account..." : "Complete Sign Up"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </LoadScript>
  );
};

export default AgentSignUp;
