import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Users, Building2, UserCircle, Briefcase } from "lucide-react";
import { logSMSConsent, getUserIP } from "@/lib/smsConsent";
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
export const HomeSignUpForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    specialization: "",
    accountType: "",
    zipRadiuses: [],
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [optInConsent, setOptInConsent] = useState(false);
  const specializationOptions = [{
    value: "real_estate" as const,
    label: "Real Estate",
    icon: Building2
  }, {
    value: "mortgage" as const,
    label: "Mortgage",
    icon: Briefcase
  }];
  const getAccountTypeOptions = () => {
    if (formData.specialization === "real_estate") {
      return [{
        value: "agent" as const,
        label: "Real Estate Agent",
        icon: UserCircle
      }, {
        value: "team" as const,
        label: "Brokerage/Team",
        icon: Building2
      }];
    }
    return [{
      value: "loan_officer" as const,
      label: "Loan Officer",
      icon: UserCircle
    }, {
      value: "company" as const,
      label: "Company/Branch",
      icon: Building2
    }];
  };
  const handleSubmit = async () => {
    if (!optInConsent) {
      toast.error("Please agree to receive SMS messages");
      return;
    }
    setLoading(true);
    try {
      // Log SMS consent for compliance
      const userIP = await getUserIP();
      const consentResult = await logSMSConsent({
        phone_number: formData.phone,
        consent_given: true,
        consent_method: 'website',
        consent_text: 'By providing your phone number and checking this box, you agree to receive SMS account notifications from OwlDoor. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help.',
        ip_address: userIP,
        double_opt_in_confirmed: false
      });
      if (!consentResult.success) {
        console.error('Failed to log SMS consent:', consentResult.error);
        // Continue with signup even if consent logging fails (logged for troubleshooting)
      }
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
  const nextStep = () => {
    if (step === 1 && !formData.specialization) {
      toast.error("Please select your specialization");
      return;
    }
    if (step === 2 && !formData.accountType) {
      toast.error("Please select your account type");
      return;
    }
    if (step === 3 && (!formData.zipRadiuses || formData.zipRadiuses.length === 0)) {
      toast.error("Please add at least one ZIP code and radius");
      return;
    }
    if (step === 4 && (!formData.firstName || !formData.lastName)) {
      toast.error("Please enter your name");
      return;
    }
    if (step === 5 && (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))) {
      toast.error("Please enter a valid email");
      return;
    }
    if (step === 6) {
      if (!formData.phone) {
        toast.error("Please enter your phone number");
        return;
      }
      const digitsOnly = formData.phone.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        toast.error("Please enter a valid 10-digit US phone number");
        return;
      }
      // Format phone for submission
      setFormData(prev => ({ ...prev, phone: `+1${digitsOnly}` }));
      handleSubmit();
      return;
    }
    setStep(step + 1);
  };
  const prevStep = () => setStep(step - 1);

  return (
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
          <motion.div className="h-full bg-white" initial={{
          width: "0%"
        }} animate={{
          width: `${step / 6 * 100}%`
        }} transition={{
          duration: 0.3
        }} />
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Specialization */}
          {step === 1 && <motion.div key="step1" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="font-bold text-white mb-2 text-3xl">Apply Now</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {specializationOptions.map(type => <Button key={type.value} type="button" variant="outline" onClick={() => {
              setFormData({
                ...formData,
                specialization: type.value
              });
              setTimeout(() => setStep(2), 300);
            }} className="h-20 text-lg font-semibold transition-all bg-white text-gray-900 border-2 border-white/50 hover:bg-black hover:text-white hover:border-white">
                    <type.icon className="mr-3 h-6 w-6" />
                    {type.label}
                  </Button>)}
              </div>
            </motion.div>}

          {/* Step 2: Account Type */}
          {step === 2 && <motion.div key="step2" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-2">I am a...</h3>
                <p className="text-white/80">Select your role</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {getAccountTypeOptions().map(type => <Button key={type.value} type="button" variant="outline" onClick={() => {
              setFormData({
                ...formData,
                accountType: type.value
              });
              setTimeout(() => setStep(3), 300);
            }} className="h-20 text-lg font-semibold transition-all bg-white text-gray-900 border-2 border-white/50 hover:bg-black hover:text-white hover:border-white">
                    <type.icon className="mr-3 h-6 w-6" />
                    {type.label}
                  </Button>)}
              </div>
            </motion.div>}

          {/* Step 3: Service Areas */}
          {step === 3 && <motion.div key="step3" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-2">Your Service Areas</h3>
                <p className="text-white/80">Add ZIP codes and radius (max 50 miles)</p>
              </div>

              <ZipRadiusInput
                onZipRadiusChange={(zipRadiuses) => setFormData({ ...formData, zipRadiuses })}
                initialValue={formData.zipRadiuses}
              />
            </motion.div>}

          {/* Step 4: Name */}
          {step === 4 && <motion.div key="step4" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-2">What's your name?</h3>
                <p className="text-white/80">Let's get to know you</p>
              </div>

              <div className="space-y-4">
                <Input placeholder="First Name" value={formData.firstName} onChange={e => setFormData({
              ...formData,
              firstName: e.target.value
            })} className="h-14 text-lg bg-white border-white" autoFocus />
                <Input placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({
              ...formData,
              lastName: e.target.value
            })} className="h-14 text-lg bg-white border-white" />
              </div>
            </motion.div>}

          {/* Step 5: Email */}
          {step === 5 && <motion.div key="step5" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-2">What's your email?</h3>
                <p className="text-white/80">We'll use this to create your account</p>
              </div>

              <Input type="email" placeholder="your.email@example.com" value={formData.email} onChange={e => setFormData({
            ...formData,
            email: e.target.value
          })} className="h-14 text-lg bg-white border-white" autoFocus />
            </motion.div>}

          {/* Step 6: Phone */}
          {step === 6 && <motion.div key="step6" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-white mb-2">What's your phone?</h3>
              </div>

              <Input type="tel" placeholder="5551234567" value={formData.phone} onChange={e => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
            setFormData({
              ...formData,
              phone: digits
            });
          }} className="h-14 text-lg bg-white border-white" maxLength={10} autoFocus />
              
              <div className="flex items-start space-x-3 bg-white/10 p-4 rounded-lg">
                <Checkbox id="optInConsent" checked={optInConsent} onCheckedChange={checked => setOptInConsent(checked as boolean)} className="mt-1 border-white data-[state=checked]:bg-white data-[state=checked]:text-gray-900" />
                <Label htmlFor="optInConsent" className="text-sm text-white/90 leading-relaxed cursor-pointer">
                  By providing your phone number and checking this box, you agree to receive SMS account notifications from OwlDoor. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe or HELP for help. View our <a href="/privacy-policy" className="underline hover:text-white">Privacy Policy</a>, <a href="/terms-of-service" className="underline hover:text-white">Terms of Service</a>, and <a href="/sms-terms" className="underline hover:text-white">SMS Terms</a>.
                </Label>
              </div>
            </motion.div>}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-4">
          {step > 1 && <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-14 text-lg bg-gray-900 text-white border-gray-900 hover:bg-gray-800">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back
            </Button>}
          <Button type="button" onClick={nextStep} disabled={loading} className="flex-1 h-14 text-lg bg-gray-900 text-white hover:bg-gray-800 font-semibold">
            {loading ? "Creating Account..." : step === 6 ? (formData.accountType === "team" || formData.accountType === "company" ? "Complete Sign Up" : "Join Free") : "Continue"}
            {!loading && step < 6 && <ArrowRight className="ml-2 h-5 w-5" />}
          </Button>
        </div>

        <p className="text-xs text-white/70 text-center pt-2">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
  );
};