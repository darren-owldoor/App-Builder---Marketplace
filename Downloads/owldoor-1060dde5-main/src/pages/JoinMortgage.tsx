import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Autocomplete, LoadScript } from "@react-google-maps/api";
import { CheckCircle2, Circle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import owlLogo from "@/assets/owldoor-logo-light.svg";

const libraries: ("places")[] = ["places"];

interface FormData {
  specialization: "real_estate" | "mortgage";
  accountType: "agent" | "team" | "loan_officer" | "company";
  city: string;
  state: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  branchSize: string;
  lookingFor: string;
}

const JoinMortgage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [formData, setFormData] = useState<FormData>({
    specialization: "mortgage",
    accountType: "company",
    city: "",
    state: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    branchSize: "",
    lookingFor: ""
  });
  const [optInConsent, setOptInConsent] = useState(false);

  const totalSteps = 6;
  const steps = [
    { id: 1, title: "Location", description: "City & State" },
    { id: 2, title: "Company Info", description: "About Your Branch" },
    { id: 3, title: "Contact Info", description: "Name & Email" },
    { id: 4, title: "Phone Number", description: "Verify & Connect" },
    { id: 5, title: "What You're Looking For", description: "Matching Preferences" },
    { id: 6, title: "Get Matches", description: "Receive Offers" }
  ];

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.city || !formData.state) {
          toast.error("Please enter your city and state");
          return false;
        }
        break;
      case 2:
        if (!formData.companyName) {
          toast.error("Please enter your company name");
          return false;
        }
        if (!formData.branchSize) {
          toast.error("Please select your branch size");
          return false;
        }
        break;
      case 3:
        if (!formData.firstName || !formData.lastName) {
          toast.error("Please enter your full name");
          return false;
        }
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          toast.error("Please enter a valid email address");
          return false;
        }
        break;
      case 4:
        if (!formData.phone) {
          toast.error("Please enter your phone number");
          return false;
        }
        const digitsOnly = formData.phone.replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
          toast.error("Please enter a valid 10-digit US phone number");
          return false;
        }
        break;
      case 5:
        if (!formData.lookingFor) {
          toast.error("Please tell us what you're looking for");
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!optInConsent) {
      toast.error("Please agree to receive SMS messages");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signupError } = await supabase.functions.invoke('agent-directory-signup', {
        body: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          specialization: formData.specialization,
          account_type: formData.accountType,
          city: formData.city,
          state: formData.state,
          company_name: formData.companyName,
          branch_size: formData.branchSize,
          looking_for: formData.lookingFor
        }
      });

      if (signupError) throw signupError;

      if (data?.success) {
        toast.success(data.message);
        navigate("/verify-code", {
          state: {
            email: formData.email,
            specialization: formData.specialization
          }
        });
      } else {
        throw new Error(data?.error || 'Failed to process signup');
      }
    } catch (error: any) {
      console.error("Error:", error);
      // Show user-friendly message for duplicate email
      if (error.message?.includes('already exists') || error.message?.includes('EMAIL_EXISTS')) {
        toast.error(error.message || "This email is already registered. Please sign in instead.");
      } else {
        toast.error(error.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.address_components) {
        let city = "";
        let state = "";

        for (const component of place.address_components) {
          if (component.types.includes("locality")) {
            city = component.long_name;
          }
          if (component.types.includes("administrative_area_level_1")) {
            state = component.short_name;
          }
        }

        setFormData(prev => ({ ...prev, city, state }));
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Your Location
            </h2>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-gray-700 font-semibold">City and State</Label>
              <Autocomplete
                onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                onPlaceChanged={onPlaceChanged}
                options={{ types: ["(cities)"], componentRestrictions: { country: "us" } }}
              >
                <Input
                  id="location"
                  placeholder="San Diego, CA"
                  className="h-12 text-lg border-2 border-gray-200 transition-colors"
                  style={{ '--tw-ring-color': '#35a87e' } as React.CSSProperties}
                />
              </Autocomplete>
              {formData.city && formData.state && (
                <p className="text-sm text-gray-600 mt-2">Selected: {formData.city}, {formData.state}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              About Your Branch
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-gray-700 font-semibold">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="ABC Mortgage Company"
                  className="h-12 text-lg border-2 border-gray-200 transition-colors"
                  style={{ '--tw-ring-color': '#35a87e' } as React.CSSProperties}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Branch Size</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["1-5", "6-15", "16-50", "50+"].map(size => (
                    <button
                      key={size}
                      onClick={() => setFormData({ ...formData, branchSize: size })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.branchSize === size
                          ? "border-[#35a87e] bg-[#35a87e]/5 text-[#35a87e] font-semibold"
                          : "border-gray-200 hover:border-[#35a87e]/50"
                      }`}
                    >
                      {size} LOs
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Your Contact Info
            </h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 font-semibold">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    className="h-12 text-lg border-2 border-gray-200 transition-colors"
                    style={{ '--tw-ring-color': '#35a87e' } as React.CSSProperties}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 font-semibold">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    className="h-12 text-lg border-2 border-gray-200 transition-colors"
                    style={{ '--tw-ring-color': '#35a87e' } as React.CSSProperties}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-semibold">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john.doe@example.com"
                  className="h-12 text-lg border-2 border-gray-200 transition-colors"
                  style={{ '--tw-ring-color': '#35a87e' } as React.CSSProperties}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Phone Number
            </h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-semibold">US Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: digits });
                  }}
                  placeholder="5551234567"
                  className="h-12 text-lg border-2 border-gray-200 transition-colors"
                  style={{ '--tw-ring-color': '#35a87e' } as React.CSSProperties}
                  maxLength={10}
                />
              </div>
              <div className="flex items-start space-x-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <Checkbox
                  id="optInConsent"
                  checked={optInConsent}
                  onCheckedChange={(checked) => setOptInConsent(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="optInConsent" className="text-xs leading-relaxed text-gray-700 cursor-pointer">
                  By providing your phone number and checking this box, you agree to receive SMS messages from OwlDoor. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help. View our <Link to="/privacy-policy" className="hover:underline" style={{ color: '#35a87e' }}>Privacy Policy</Link>, <Link to="/terms-of-service" className="hover:underline" style={{ color: '#35a87e' }}>Terms of Service</Link>, and <Link to="/sms-terms" className="hover:underline" style={{ color: '#35a87e' }}>SMS Terms</Link>.
                </Label>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              What Are You Looking For?
            </h2>
            <div className="space-y-2">
              <Label htmlFor="lookingFor" className="text-gray-700 font-semibold">
                Tell us what's most important in recruiting loan officers
              </Label>
              <textarea
                id="lookingFor"
                value={formData.lookingFor}
                onChange={e => setFormData({ ...formData, lookingFor: e.target.value })}
                placeholder="e.g., High-producing LOs with purchase experience, FHA specialists, loan officers with realtor networks..."
                className="w-full min-h-[120px] p-4 text-lg border-2 border-gray-200 rounded-lg transition-colors resize-none"
                style={{ '--tw-ring-color': '#35a87e' } as React.CSSProperties}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={libraries}>
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-[#35a87e] flex-col p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="mb-8 relative z-10 flex justify-center pt-24">
            <img src={owlLogo} alt="OwlDoor" className="w-64 opacity-95 drop-shadow-lg" />
          </div>

          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="w-full max-w-sm">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
                <h3 className="text-2xl font-bold mb-8 text-gray-900">Mortgage Company Signup</h3>
                <div className="space-y-6">
                  {steps.map(step => (
                    <div key={step.id} className="flex items-start gap-4 transition-all duration-300">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep > step.id ? "bg-[#35a87e] shadow-lg shadow-[#35a87e]/20" : currentStep === step.id ? "bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg" : "bg-gray-200"}`}>
                        {currentStep > step.id ? <CheckCircle2 className="w-6 h-6 text-white" /> : <Circle className={`w-6 h-6 ${currentStep === step.id ? "text-white" : "text-gray-400"}`} />}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`font-semibold text-base transition-colors ${currentStep === step.id ? "text-gray-900" : "text-gray-600"}`}>
                          {step.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white">
          <div className="w-full max-w-lg space-y-8">
            <div className="lg:hidden mb-8">
              <img src={owlLogo} alt="OwlDoor" className="w-48 mx-auto" />
            </div>

            <Progress value={(currentStep / totalSteps) * 100} className="h-2" />

            <div className="min-h-[400px]">
              {renderStep()}
            </div>

            <div className="flex gap-4 pt-6">
              {currentStep > 1 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 h-12 text-lg border-2"
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              {currentStep < 5 ? (
                <Button
                  onClick={handleNext}
                  className="flex-1 h-12 text-lg bg-[#35a87e] hover:bg-[#2d8f6a] text-white"
                  disabled={loading}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="flex-1 h-12 text-lg bg-[#35a87e] hover:bg-[#2d8f6a] text-white"
                  disabled={loading || !optInConsent}
                >
                  {loading ? "Creating Account..." : "Complete Sign Up"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </LoadScript>
  );
};

export default JoinMortgage;
