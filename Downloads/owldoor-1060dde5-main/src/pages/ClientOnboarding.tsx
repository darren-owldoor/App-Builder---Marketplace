import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { OnboardingStep } from "@/components/client/onboarding/OnboardingStep";
import { ZipRadiusInput } from "@/components/ZipRadiusInput";
import { PaymentMethodManager } from "@/components/client/PaymentMethodManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

const PRO_TYPES = [
  { value: "real_estate", label: "Real Estate Agents" },
  { value: "mortgage", label: "Loan Officers" },
  { value: "title", label: "Title Officers" },
  { value: "insurance", label: "Insurance Agents" }
];

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Company Basics
    company_name: "",
    brokerage: "",
    primary_contact_name: "",
    primary_contact_email: "",
    primary_contact_phone: "",
    website_url: "",
    
    // Step 2: Geographic Coverage
    coverage_data: {
      zip_radius: [] as Array<{ zip: string; radius: number }>,
      cities: [] as string[],
      states: [] as string[],
      counties: [] as string[]
    },
    headquarters_address: "",
    
    // Step 3: Business Profile & Compensation
    company_description: "",
    team_size: "",
    culture_values: [] as string[],
    unique_selling_points: "",
    
    // Compensation ranges by experience level
    compensationEntryMin: "",
    compensationEntryMax: "",
    compensationEntryType: "commission_only",
    compensationExpMin: "",
    compensationExpMax: "",
    compensationExpType: "commission_only",
    compensationProducerMin: "",
    compensationProducerMax: "",
    compensationProducerType: "commission_only",

    // Step 4: Recruiting Criteria
    pro_types: [] as string[],
    min_experience: "0",
    min_transactions: "0",
    deal_breakers: "",
    ideal_candidate: "",
  });

  const totalSteps = 5;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (step === 4) {
      // Create client and business profile on step 4
      await handleSubmit();
    } else if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Create/update client record
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .upsert({
          user_id: user.id,
          company_name: formData.company_name,
          contact_name: formData.primary_contact_name,
          email: formData.primary_contact_email,
          phone: formData.primary_contact_phone,
          brokerage: formData.brokerage,
          website_url: formData.website_url,
          onboarding_completed: true
        })
        .select()
        .single();

      if (clientError) throw clientError;
      setClientId(client.id);

      // Create business profile with compensation ranges
      await supabase.from("client_business_profiles").upsert({
        client_id: client.id,
        company_description: formData.company_description,
        culture_values: formData.culture_values,
        unique_selling_points: formData.unique_selling_points.split("\n").filter(Boolean),
        deal_breakers: formData.deal_breakers.split("\n").filter(Boolean),
        ideal_candidate_profile: {
          description: formData.ideal_candidate,
          min_experience: parseInt(formData.min_experience),
          min_transactions: parseInt(formData.min_transactions)
        },
        compensation_range: {
          entry_level: {
            min: parseFloat(formData.compensationEntryMin) || 0,
            max: parseFloat(formData.compensationEntryMax) || 0,
            type: formData.compensationEntryType,
          },
          experienced: {
            min: parseFloat(formData.compensationExpMin) || 0,
            max: parseFloat(formData.compensationExpMax) || 0,
            type: formData.compensationExpType,
          },
          high_producer: {
            min: parseFloat(formData.compensationProducerMin) || 0,
            max: parseFloat(formData.compensationProducerMax) || 0,
            type: formData.compensationProducerType,
          },
        },
        completed: true
      });

      // Move to payment step
      setStep(5);
      toast.success("Profile saved! Now add a payment method to receive leads.");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    toast.success("Onboarding complete! Welcome aboard!");
    navigate("/team-dashboard");
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <OnboardingStep
            step={1}
            totalSteps={totalSteps}
            title="Company Basics"
            description="Tell us about your company and primary contact information"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  placeholder="Smith Real Estate Team"
                />
              </div>
              <div>
                <Label htmlFor="brokerage">Brokerage Affiliation *</Label>
                <Input
                  id="brokerage"
                  value={formData.brokerage}
                  onChange={(e) => handleInputChange("brokerage", e.target.value)}
                  placeholder="Keller Williams, RE/MAX, etc."
                />
              </div>
              <div>
                <Label htmlFor="primary_contact_name">Primary Contact Name *</Label>
                <Input
                  id="primary_contact_name"
                  value={formData.primary_contact_name}
                  onChange={(e) => handleInputChange("primary_contact_name", e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary_contact_email">Contact Email *</Label>
                  <Input
                    id="primary_contact_email"
                    type="email"
                    value={formData.primary_contact_email}
                    onChange={(e) => handleInputChange("primary_contact_email", e.target.value)}
                    placeholder="john@smithrealestate.com"
                  />
                </div>
                <div>
                  <Label htmlFor="primary_contact_phone">Contact Phone *</Label>
                  <Input
                    id="primary_contact_phone"
                    type="tel"
                    value={formData.primary_contact_phone}
                    onChange={(e) => handleInputChange("primary_contact_phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => handleInputChange("website_url", e.target.value)}
                  placeholder="https://smithrealestate.com"
                />
              </div>
            </div>
          </OnboardingStep>
        );

      case 2:
        return (
          <OnboardingStep
            step={2}
            totalSteps={totalSteps}
            title="Geographic Coverage"
            description="Define where you recruit and operate"
          >
            <div className="space-y-4">
              <div>
                <Label>Service Areas (Zip Code + Radius) *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add zip codes with a radius to define your coverage area
                </p>
                <ZipRadiusInput
                  onZipRadiusChange={(value) => handleInputChange("coverage_data", {
                    ...formData.coverage_data,
                    zip_radius: value
                  })}
                  initialValue={formData.coverage_data.zip_radius}
                />
              </div>
              <div>
                <Label htmlFor="headquarters_address">Headquarters Address</Label>
                <Input
                  id="headquarters_address"
                  value={formData.headquarters_address}
                  onChange={(e) => handleInputChange("headquarters_address", e.target.value)}
                  placeholder="123 Main St, San Antonio, TX 78201"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used for geocoding and distance calculations
                </p>
              </div>
            </div>
          </OnboardingStep>
        );

      case 3:
        return (
          <OnboardingStep
            step={3}
            totalSteps={totalSteps}
            title="Business Profile & Compensation"
            description="Tell us about your company and compensation structure"
          >
            <div className="space-y-6">
              <div>
                <Label htmlFor="company_description">Company Description *</Label>
                <Textarea
                  id="company_description"
                  value={formData.company_description}
                  onChange={(e) => handleInputChange("company_description", e.target.value)}
                  placeholder="Tell us about your company, mission, and values..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="team_size">Team Size</Label>
                <Select
                  value={formData.team_size}
                  onValueChange={(value) => handleInputChange("team_size", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1-5 agents</SelectItem>
                    <SelectItem value="6-15">6-15 agents</SelectItem>
                    <SelectItem value="16-50">16-50 agents</SelectItem>
                    <SelectItem value="51+">51+ agents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unique_selling_points">Unique Selling Points *</Label>
                <Textarea
                  id="unique_selling_points"
                  value={formData.unique_selling_points}
                  onChange={(e) => handleInputChange("unique_selling_points", e.target.value)}
                  placeholder="One per line:&#10;- Top training program&#10;- 100% commission splits&#10;- Cutting-edge tech stack"
                  rows={4}
                />
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 text-lg">Compensation by Experience Level</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Entry Level Agents</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Min Annual ($)</Label>
                        <Input
                          type="number"
                          value={formData.compensationEntryMin}
                          onChange={(e) => handleInputChange("compensationEntryMin", e.target.value)}
                          placeholder="40000"
                        />
                      </div>
                      <div>
                        <Label>Max Annual ($)</Label>
                        <Input
                          type="number"
                          value={formData.compensationEntryMax}
                          onChange={(e) => handleInputChange("compensationEntryMax", e.target.value)}
                          placeholder="80000"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={formData.compensationEntryType}
                          onValueChange={(value) => handleInputChange("compensationEntryType", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="commission_only">Commission Only</SelectItem>
                            <SelectItem value="base_plus_commission">Base + Commission</SelectItem>
                            <SelectItem value="salary">Salary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Experienced Agents (3-5 years)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Min Annual ($)</Label>
                        <Input
                          type="number"
                          value={formData.compensationExpMin}
                          onChange={(e) => handleInputChange("compensationExpMin", e.target.value)}
                          placeholder="60000"
                        />
                      </div>
                      <div>
                        <Label>Max Annual ($)</Label>
                        <Input
                          type="number"
                          value={formData.compensationExpMax}
                          onChange={(e) => handleInputChange("compensationExpMax", e.target.value)}
                          placeholder="150000"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={formData.compensationExpType}
                          onValueChange={(value) => handleInputChange("compensationExpType", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="commission_only">Commission Only</SelectItem>
                            <SelectItem value="base_plus_commission">Base + Commission</SelectItem>
                            <SelectItem value="salary">Salary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">High Producers (5+ years)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Min Annual ($)</Label>
                        <Input
                          type="number"
                          value={formData.compensationProducerMin}
                          onChange={(e) => handleInputChange("compensationProducerMin", e.target.value)}
                          placeholder="100000"
                        />
                      </div>
                      <div>
                        <Label>Max Annual ($)</Label>
                        <Input
                          type="number"
                          value={formData.compensationProducerMax}
                          onChange={(e) => handleInputChange("compensationProducerMax", e.target.value)}
                          placeholder="250000"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={formData.compensationProducerType}
                          onValueChange={(value) => handleInputChange("compensationProducerType", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="commission_only">Commission Only</SelectItem>
                            <SelectItem value="base_plus_commission">Base + Commission</SelectItem>
                            <SelectItem value="salary">Salary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </OnboardingStep>
        );

      case 4:
        return (
          <OnboardingStep
            step={4}
            totalSteps={totalSteps}
            title="Recruiting Criteria"
            description="Define your ideal candidate profile"
          >
            <div className="space-y-4">
              <div>
                <Label>Professional Types You're Recruiting *</Label>
                <div className="space-y-2 mt-2">
                  {PRO_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.value}
                        checked={formData.pro_types.includes(type.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleInputChange("pro_types", [...formData.pro_types, type.value]);
                          } else {
                            handleInputChange("pro_types", formData.pro_types.filter(t => t !== type.value));
                          }
                        }}
                      />
                      <Label htmlFor={type.value} className="cursor-pointer font-normal">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_experience">Minimum Years Experience</Label>
                  <Input
                    id="min_experience"
                    type="number"
                    min="0"
                    value={formData.min_experience}
                    onChange={(e) => handleInputChange("min_experience", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="min_transactions">Minimum Transactions</Label>
                  <Input
                    id="min_transactions"
                    type="number"
                    min="0"
                    value={formData.min_transactions}
                    onChange={(e) => handleInputChange("min_transactions", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="ideal_candidate">Ideal Candidate Description *</Label>
                <Textarea
                  id="ideal_candidate"
                  value={formData.ideal_candidate}
                  onChange={(e) => handleInputChange("ideal_candidate", e.target.value)}
                  placeholder="Describe your perfect recruit: work ethic, values, skills, experience..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="deal_breakers">Deal Breakers</Label>
                <Textarea
                  id="deal_breakers"
                  value={formData.deal_breakers}
                  onChange={(e) => handleInputChange("deal_breakers", e.target.value)}
                  placeholder="One per line:&#10;- Must have active license&#10;- No disciplinary actions&#10;- Must be full-time"
                  rows={3}
                />
              </div>
            </div>
          </OnboardingStep>
        );

      case 5:
        return (
          <OnboardingStep
            step={5}
            totalSteps={totalSteps}
            title="Payment Setup"
            description="Add a payment method to start receiving leads"
          >
            {clientId ? (
              <PaymentMethodManager
                hasPaymentMethod={hasPaymentMethod}
                onUpdate={() => {
                  setHasPaymentMethod(true);
                  handleComplete();
                }}
              />
            ) : (
              <p className="text-center text-muted-foreground">
                Complete previous steps to set up payment
              </p>
            )}
          </OnboardingStep>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm font-medium">
              {Math.round((step / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        {renderStepContent()}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {step < totalSteps && (
            <Button onClick={handleNext} disabled={loading}>
              {loading ? "Saving..." : step === 4 ? "Save & Continue" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
