import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

type AgentPath = "short" | "mid" | "pro";

interface QuestionnaireData {
  experience_years: string;
  homes_sold_per_year: string;
  total_volume?: string;
  leads_team?: string;
  biggest_challenge: string;
  challenge_follow_up?: string;
  most_important_next_year: string;
  mentor_plans?: string;
  team_size?: string;
  timeline: string;
  current_split?: string;
  brokerage_values?: string[];
  contact_preference: string;
  wants_matches: string;
  agent_path: AgentPath;
}

export function SmartAgentQualification({ onComplete }: { onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [agentPath, setAgentPath] = useState<AgentPath | null>(null);
  const [data, setData] = useState<Partial<QuestionnaireData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateData = (key: keyof QuestionnaireData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const determinePathFromExperience = (years: string): AgentPath => {
    if (years === "<1") return "short";
    if (years === "1-3") return "mid";
    return "pro";
  };

  const determinePathFromSales = (sales: string): AgentPath => {
    if (sales === "0-5") return "short";
    if (sales === "6-15") return "mid";
    return "pro";
  };

  const goNext = () => {
    // Step 1: Experience level
    if (currentStep === 1) {
      const path = determinePathFromExperience(data.experience_years!);
      setAgentPath(path);
      setCurrentStep(2);
      return;
    }

    // Step 2: Sales volume (can override path)
    if (currentStep === 2) {
      const salesPath = determinePathFromSales(data.homes_sold_per_year!);
      if (salesPath === "short") {
        setAgentPath("short");
      }
      // For pro path, ask volume questions
      if (agentPath === "pro") {
        setCurrentStep(2.5); // Volume questions
      } else {
        setCurrentStep(3);
      }
      return;
    }

    // Step 2.5: Pro path volume questions
    if (currentStep === 2.5) {
      setCurrentStep(3);
      return;
    }

    // Step 3: Biggest challenge + conditional follow-up
    if (currentStep === 3) {
      // Check if we need a follow-up based on challenge
      if (data.biggest_challenge === "leads" && !data.challenge_follow_up) {
        setCurrentStep(3.5);
      } else if (data.biggest_challenge === "mentorship" && !data.challenge_follow_up) {
        setCurrentStep(3.5);
      } else {
        setCurrentStep(4);
      }
      return;
    }

    // Step 3.5: Challenge follow-up
    if (currentStep === 3.5) {
      setCurrentStep(4);
      return;
    }

    // Step 4: Future goals + conditional
    if (currentStep === 4) {
      if (data.most_important_next_year === "leadership" && agentPath !== "short") {
        setCurrentStep(4.5);
      } else {
        setCurrentStep(5);
      }
      return;
    }

    // Step 4.5: Leadership follow-up
    if (currentStep === 4.5) {
      setCurrentStep(5);
      return;
    }

    // Step 5: Timeline check
    if (currentStep === 5) {
      if (data.timeline === "exploring") {
        // Early exit
        handleSubmit();
      } else if (agentPath === "short") {
        // Skip brokerage fit questions
        setCurrentStep(7);
      } else {
        setCurrentStep(6);
      }
      return;
    }

    // Step 6: Brokerage fit (mid/pro only)
    if (currentStep === 6) {
      setCurrentStep(7);
      return;
    }

    // Step 7: Contact & permission
    if (currentStep === 7) {
      handleSubmit();
      return;
    }
  };

  const goBack = () => {
    if (currentStep === 2.5) {
      setCurrentStep(2);
    } else if (currentStep === 3.5) {
      setCurrentStep(3);
    } else if (currentStep === 4.5) {
      setCurrentStep(4);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const qualificationData = {
        ...data,
        agent_path: agentPath,
        completed_at: new Date().toISOString(),
      };

      // Update pro profile
      const { error } = await supabase
        .from("pros")
        .update({
          qualification_data: qualificationData,
          qualification_score: calculateScore(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Qualification complete! We'll match you with the best opportunities.");
      onComplete?.();
    } catch (error) {
      console.error("Error saving qualification:", error);
      toast.error("Failed to save qualification data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateScore = (): number => {
    let score = 0;
    
    // Path scoring
    if (agentPath === "pro") score += 30;
    else if (agentPath === "mid") score += 20;
    else score += 10;

    // Timeline urgency
    if (data.timeline === "30days") score += 25;
    else if (data.timeline === "1-3months") score += 15;
    else if (data.timeline === "3+months") score += 5;

    // Wants matches
    if (data.wants_matches === "yes") score += 20;
    else if (data.wants_matches === "check") score += 10;

    // Experience bonus
    if (data.experience_years === "3+") score += 15;
    
    // Sales bonus
    if (data.homes_sold_per_year === "16+") score += 10;

    return Math.min(score, 100);
  };

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1: return !!data.experience_years;
      case 2: return !!data.homes_sold_per_year;
      case 2.5: return !!data.total_volume && !!data.leads_team;
      case 3: return !!data.biggest_challenge;
      case 3.5: return !!data.challenge_follow_up;
      case 4: return !!data.most_important_next_year;
      case 4.5: return !!data.mentor_plans || !!data.team_size;
      case 5: return !!data.timeline;
      case 6: return !!data.current_split && !!data.brokerage_values;
      case 7: return !!data.contact_preference && !!data.wants_matches;
      default: return false;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Smart Agent Qualification</CardTitle>
        <CardDescription>
          {agentPath && (
            <span className="text-sm font-medium">
              Path: {agentPath === "short" ? "New Agent" : agentPath === "mid" ? "Growing Agent" : "Top Producer"}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Experience */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">How long have you been licensed?</h3>
            <RadioGroup value={data.experience_years} onValueChange={(v) => updateData("experience_years", v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="<1" id="exp1" />
                <Label htmlFor="exp1">New / Less than 1 year</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1-3" id="exp2" />
                <Label htmlFor="exp2">1–3 years</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3+" id="exp3" />
                <Label htmlFor="exp3">3+ years</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 2: Sales Volume */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Most homes you've sold in a year?</h3>
            <RadioGroup value={data.homes_sold_per_year} onValueChange={(v) => updateData("homes_sold_per_year", v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0-5" id="sales1" />
                <Label htmlFor="sales1">0–5</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="6-15" id="sales2" />
                <Label htmlFor="sales2">6–15</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="16+" id="sales3" />
                <Label htmlFor="sales3">16+</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 2.5: Pro Path Volume Questions */}
        {currentStep === 2.5 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="volume">What was your total volume last year?</Label>
              <Input
                id="volume"
                placeholder="e.g., $5M"
                value={data.total_volume || ""}
                onChange={(e) => updateData("total_volume", e.target.value)}
              />
            </div>
            <div>
              <h3 className="font-semibold">Do you currently lead or mentor a team?</h3>
              <RadioGroup value={data.leads_team} onValueChange={(v) => updateData("leads_team", v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="team-yes" />
                  <Label htmlFor="team-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="team-no" />
                  <Label htmlFor="team-no">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Step 3: Biggest Challenge */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">What's your biggest challenge right now?</h3>
            <RadioGroup value={data.biggest_challenge} onValueChange={(v) => updateData("biggest_challenge", v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="leads" id="ch1" />
                <Label htmlFor="ch1">Not enough leads</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="systems" id="ch2" />
                <Label htmlFor="ch2">Lack of systems or tech</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mentorship" id="ch3" />
                <Label htmlFor="ch3">Limited mentorship or support</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="ch4" />
                <Label htmlFor="ch4">Inconsistent income</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="culture" id="ch5" />
                <Label htmlFor="ch5">Weak team culture or leadership</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="ch6" />
                <Label htmlFor="ch6">Other</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 3.5: Challenge Follow-up */}
        {currentStep === 3.5 && (
          <div className="space-y-4">
            {data.biggest_challenge === "leads" && (
              <>
                <h3 className="font-semibold text-lg">Are you open to lead-provided team options?</h3>
                <RadioGroup value={data.challenge_follow_up} onValueChange={(v) => updateData("challenge_follow_up", v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="fu-yes" />
                    <Label htmlFor="fu-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="fu-no" />
                    <Label htmlFor="fu-no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maybe" id="fu-maybe" />
                    <Label htmlFor="fu-maybe">Maybe</Label>
                  </div>
                </RadioGroup>
              </>
            )}
            {data.biggest_challenge === "mentorship" && (
              <>
                <h3 className="font-semibold text-lg">Would joining a mentorship-based team interest you?</h3>
                <RadioGroup value={data.challenge_follow_up} onValueChange={(v) => updateData("challenge_follow_up", v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="fu-yes" />
                    <Label htmlFor="fu-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="fu-no" />
                    <Label htmlFor="fu-no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maybe" id="fu-maybe" />
                    <Label htmlFor="fu-maybe">Maybe</Label>
                  </div>
                </RadioGroup>
              </>
            )}
          </div>
        )}

        {/* Step 4: Future Goals */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">What's most important to you next year?</h3>
            <RadioGroup value={data.most_important_next_year} onValueChange={(v) => updateData("most_important_next_year", v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="goal1" />
                <Label htmlFor="goal1">Higher income</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="support" id="goal2" />
                <Label htmlFor="goal2">Better support / mentorship</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="freedom" id="goal3" />
                <Label htmlFor="goal3">More freedom & flexibility</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="leadership" id="goal4" />
                <Label htmlFor="goal4">Leadership or building a team</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 4.5: Leadership Follow-up */}
        {currentStep === 4.5 && (
          <div className="space-y-4">
            {agentPath === "mid" && (
              <>
                <h3 className="font-semibold text-lg">Do you have plans to mentor agents?</h3>
                <RadioGroup value={data.mentor_plans} onValueChange={(v) => updateData("mentor_plans", v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="mp-yes" />
                    <Label htmlFor="mp-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="mp-no" />
                    <Label htmlFor="mp-no">No</Label>
                  </div>
                </RadioGroup>
              </>
            )}
            {agentPath === "pro" && (
              <div>
                <Label htmlFor="teamsize">How many agents do you currently mentor or plan to?</Label>
                <Input
                  id="teamsize"
                  type="number"
                  placeholder="Number of agents"
                  value={data.team_size || ""}
                  onChange={(e) => updateData("team_size", e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 5: Timeline */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">How soon are you looking to make a change?</h3>
            <RadioGroup value={data.timeline} onValueChange={(v) => updateData("timeline", v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exploring" id="time1" />
                <Label htmlFor="time1">Just exploring</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30days" id="time2" />
                <Label htmlFor="time2">Within 30 days</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1-3months" id="time3" />
                <Label htmlFor="time3">1–3 months</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3+months" id="time4" />
                <Label htmlFor="time4">3+ months</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 6: Brokerage Fit (Mid/Pro only) */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="split">What split or structure are you currently on?</Label>
              <Input
                id="split"
                placeholder="e.g., 70/30, 80/20, 100% with fees"
                value={data.current_split || ""}
                onChange={(e) => updateData("current_split", e.target.value)}
              />
            </div>
            <div>
              <h3 className="font-semibold">What do you value most in a brokerage/team? (choose top 2–3)</h3>
              <Textarea
                placeholder="e.g., Leads, Coaching, Brand, Systems & Tech, Culture, Passive Income"
                value={data.brokerage_values?.join(", ") || ""}
                onChange={(e) => updateData("brokerage_values", e.target.value.split(",").map(v => v.trim()))}
              />
            </div>
          </div>
        )}

        {/* Step 7: Contact & Permission */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Best way to reach you?</h3>
              <RadioGroup value={data.contact_preference} onValueChange={(v) => updateData("contact_preference", v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="contact1" />
                  <Label htmlFor="contact1">Text</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="call" id="contact2" />
                  <Label htmlFor="contact2">Call</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="contact3" />
                  <Label htmlFor="contact3">Email</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Want to see teams or brokerages that fit your goals?</h3>
              <RadioGroup value={data.wants_matches} onValueChange={(v) => updateData("wants_matches", v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="match1" />
                  <Label htmlFor="match1">Yes, show me matches</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="check" id="match2" />
                  <Label htmlFor="match2">I'll check it out</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not-yet" id="match3" />
                  <Label htmlFor="match3">Not yet</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={goNext}
            disabled={!canGoNext() || isSubmitting}
          >
            {currentStep === 7 || (currentStep === 5 && data.timeline === "exploring") ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
