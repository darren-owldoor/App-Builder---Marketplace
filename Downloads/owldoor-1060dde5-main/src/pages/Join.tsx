import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import owlLogo from "@/assets/owldoor-logo-light.svg";
import { ZipRadiusInput } from "@/components/ZipRadiusInput";

interface FormData {
  specialization: "real_estate" | "mortgage" | "";
  accountType: "agent" | "team" | "loan_officer" | "company" | "";
  zipRadiuses: { zip: string; radius: number }[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
const Join = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clickedOption, setClickedOption] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    specialization: "",
    accountType: "",
    zipRadiuses: [],
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });
  const [optInConsent, setOptInConsent] = useState(false);
  const totalSteps = 6;
  const steps = [{
    id: 1,
    title: "Specialization",
    description: "Sign Up"
  }, {
    id: 2,
    title: "Account Type",
    description: "Individual or Company"
  }, {
    id: 3,
    title: "Location",
    description: "City & State"
  }, {
    id: 4,
    title: "Set Up Login",
    description: "It's Quick & Easy"
  }, {
    id: 5,
    title: "Confirm By SMS or Email",
    description: ""
  }, {
    id: 6,
    title: "Get Matches",
    description: "Receive Offers"
  }];
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
        if (!formData.specialization) {
          toast.error("Please select your specialization");
          return false;
        }
        break;
      case 2:
        if (!formData.accountType) {
          toast.error("Please select your account type");
          return false;
        }
        break;
      case 3:
        if (!formData.zipRadiuses || formData.zipRadiuses.length === 0) {
          toast.error("Please add at least one ZIP code and radius");
          return false;
        }
        break;
      case 4:
        if (!formData.firstName || !formData.lastName) {
          toast.error("Please enter your full name");
          return false;
        }
        break;
      case 5:
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          toast.error("Please enter a valid email address");
          return false;
        }
        break;
      case 6:
        if (!formData.phone) {
          toast.error("Please enter your phone number");
          return false;
        }
        // Validate phone is 10 digits
        const digitsOnly = formData.phone.replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
          toast.error("Please enter a valid 10-digit US phone number");
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
      const {
        data,
        error: signupError
      } = await supabase.functions.invoke('agent-directory-signup', {
        body: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          specialization: formData.specialization,
          account_type: formData.accountType,
          zip_radiuses: formData.zipRadiuses
        }
      });
      if (signupError) throw signupError;
      if (data?.success) {
        toast.success(data.message);
        // Navigate to verification page with email and specialization
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
  const handleSpecializationSelect = (value: "real_estate" | "mortgage") => {
    setClickedOption(value);
    setFormData(prev => ({
      ...prev,
      specialization: value
    }));
    setTimeout(() => {
      setClickedOption(null);
      setCurrentStep(2);
    }, 600);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
          return <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight text-center">
              Join Free
            </h2>
            <div className="flex flex-col gap-6 items-center justify-center">
              {[{
              value: "real_estate" as const,
              label: "Real Estate"
            }, {
              value: "mortgage" as const,
              label: "Mortgage"
            }].map(option => <button key={option.value} className={`group relative w-full max-w-md h-24 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${clickedOption === option.value ? "border-[#35a87e] bg-white shadow-xl" : "border-gray-200 bg-white hover:border-[#35a87e]/50 shadow-lg hover:shadow-xl"}`} onClick={() => handleSpecializationSelect(option.value)}>
                  <div className="flex items-center h-full px-8 gap-6">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${clickedOption === option.value ? "border-[#35a87e] bg-[#35a87e]" : "border-gray-300 group-hover:border-[#35a87e]/50"}`}>
                      {clickedOption === option.value && <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <circle cx="10" cy="10" r="4" />
                        </svg>}
                    </div>
                    <span className={`text-2xl font-bold flex-1 text-left transition-colors ${clickedOption === option.value ? "text-[#35a87e]" : "text-gray-900"}`}>{option.label}</span>
                  </div>
                </button>)}
            </div>
          </div>;
      case 2:
        const accountTypeOptions = formData.specialization === "real_estate" 
          ? [
              { value: "agent" as const, label: "Real Estate Agent" },
              { value: "team" as const, label: "Team/Brokerage" }
            ]
          : [
              { value: "loan_officer" as const, label: "Loan Officer" },
              { value: "company" as const, label: "Company/Branch" }
            ];
        
        return <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight text-center">
              Join Free
            </h2>
            <div className="flex flex-col gap-6 items-center justify-center">
              {accountTypeOptions.map(option => <button 
                key={option.value} 
                className={`group relative w-full max-w-md h-24 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${formData.accountType === option.value ? "border-[#35a87e] bg-white shadow-xl" : "border-gray-200 bg-white hover:border-[#35a87e]/50 shadow-lg hover:shadow-xl"}`} 
                onClick={() => {
                  setFormData(prev => ({ ...prev, accountType: option.value }));
                  setTimeout(() => handleNext(), 300);
                }}
              >
                <div className="flex items-center h-full px-8 gap-6">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${formData.accountType === option.value ? "border-[#35a87e] bg-[#35a87e]" : "border-gray-300 group-hover:border-[#35a87e]/50"}`}>
                    {formData.accountType === option.value && <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="4" />
                      </svg>}
                  </div>
                  <span className={`text-2xl font-bold flex-1 text-left transition-colors ${formData.accountType === option.value ? "text-[#35a87e]" : "text-gray-900"}`}>{option.label}</span>
                </div>
              </button>)}
            </div>
          </div>;
      case 3:
        return <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Your Service Areas
            </h2>
            <ZipRadiusInput
              onZipRadiusChange={(zipRadiuses) => setFormData({ ...formData, zipRadiuses })}
              initialValue={formData.zipRadiuses}
            />
          </div>;
      case 4:
        return <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Your Name
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-700 font-semibold">First Name</Label>
                <Input id="firstName" value={formData.firstName} onChange={e => setFormData({
                ...formData,
                firstName: e.target.value
              })} onKeyDown={e => e.key === "Enter" && formData.firstName && formData.lastName && handleNext()} placeholder="John" className="h-12 text-lg border-2 border-gray-200 transition-colors" style={{ '--tw-ring-color': '#35a87e' } as React.CSSProperties} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-700 font-semibold">Last Name</Label>
                <Input id="lastName" value={formData.lastName} onChange={e => setFormData({
                ...formData,
                lastName: e.target.value
              })} onKeyDown={e => e.key === "Enter" && formData.firstName && formData.lastName && handleNext()} placeholder="Doe" className="h-12 text-lg border-2 border-gray-200 transition-colors" style={{ '--tw-ring-color': '#35a87e' } as React.CSSProperties} />
              </div>
            </div>
          </div>;
      case 5:
        return <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Email Address
            </h2>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-semibold">Email Address</Label>
              <Input id="email" type="email" value={formData.email} onChange={e => setFormData({
              ...formData,
              email: e.target.value
            })} onKeyDown={e => e.key === "Enter" && formData.email && handleNext()} placeholder="john.doe@example.com" className="h-12 text-lg border-2 border-gray-200 transition-colors" style={{ '--tw-ring-color': '#35a87e' } as React.CSSProperties} />
            </div>
          </div>;
      case 6:
        return <div className="space-y-6">
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
                    // Only allow digits and limit to 10
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({
                      ...formData,
                      phone: digits
                    });
                    // Auto-submit when 10 digits are entered
                    if (digits.length === 10) {
                      setTimeout(() => {
                        handleSubmit();
                      }, 300);
                    }
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
                  By providing your phone number and checking this box, you agree to receive SMS messages from OwlDoor regarding real estate agent matching services. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help. View our <Link to="/privacy-policy" className="hover:underline" style={{ color: '#35a87e' }}>Privacy Policy</Link>, <Link to="/terms-of-service" className="hover:underline" style={{ color: '#35a87e' }}>Terms of Service</Link>, and <Link to="/sms-terms" className="hover:underline" style={{ color: '#35a87e' }}>SMS Terms</Link>.
                </Label>
              </div>
            </div>
          </div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex">
        {/* Left Panel - Logo & Sidebar on Desktop */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#35a87e] flex-col p-12 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="mb-8 relative z-10 flex justify-center pt-24">
          <img src={owlLogo} alt="OwlDoor" className="w-64 opacity-95 drop-shadow-lg" />
        </div>

        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="w-full max-w-sm">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
              <h3 className="text-2xl font-bold mb-8 text-gray-900">Sign Up Progress</h3>
              <div className="space-y-6">
                {steps.map(step => <div key={step.id} className="flex items-start gap-4 transition-all duration-300">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${currentStep > step.id ? "bg-[#35a87e] shadow-lg shadow-[#35a87e]/20" : currentStep === step.id ? "bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg" : "bg-gray-200"}`}>
                      {currentStep > step.id ? <CheckCircle2 className="w-6 h-6 text-white" /> : <Circle className={`w-6 h-6 ${currentStep === step.id ? "text-white" : "text-gray-400"}`} />}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className={`font-semibold text-base transition-colors ${currentStep === step.id ? "text-gray-900" : "text-gray-600"}`}>
                        {step.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
                    </div>
                  </div>)}
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-gray-700">
                Already have an account?{" "}
                <Link to="/auth" className="text-gray-900 hover:text-gray-800 font-semibold hover:underline transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12" style={{ backgroundColor: '#35a87e' }}>
        <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl">
          <div className="mb-10">
            <Progress value={currentStep / totalSteps * 100} className="h-3 bg-gray-100" />
          </div>

          <div className="mb-10 animate-in fade-in duration-300">
            {renderStep()}
          </div>

          <div className="flex gap-4">
            {currentStep > 1 && <Button variant="outline" onClick={handleBack} disabled={loading} className="flex-1 border-2 border-gray-300 text-gray-900 hover:bg-gray-50 font-semibold h-12 transition-all hover:border-gray-400">
                Back
              </Button>}
            {currentStep < totalSteps ? <Button onClick={handleNext} disabled={loading} className="flex-1 text-white font-semibold h-12 shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: '#1a1a1a' }}>
                Continue
              </Button> : <Button onClick={handleSubmit} disabled={loading} className="flex-1 text-white font-semibold h-12 shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: '#1a1a1a' }}>
                {loading ? "Sending Code..." : "Agreed. Send Code"}
              </Button>}
          </div>

          <div className="lg:hidden mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/auth" className="font-semibold hover:underline transition-colors" style={{ color: '#35a87e' }}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Join;