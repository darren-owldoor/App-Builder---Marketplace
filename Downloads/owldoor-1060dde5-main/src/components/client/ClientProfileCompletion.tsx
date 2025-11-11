import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ProfileQuestion {
  field: string;
  question: string;
  category: string;
  priority: number;
}

interface ClientProfileCompletionProps {
  clientId: string;
  onUpdate?: () => void;
}

export const ClientProfileCompletion = ({ clientId, onUpdate }: ClientProfileCompletionProps) => {
  const navigate = useNavigate();
  const [completion, setCompletion] = useState(0);
  const [nextQuestion, setNextQuestion] = useState<ProfileQuestion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateCompletion();
  }, [clientId]);

  const calculateCompletion = async () => {
    try {
      const { data: client } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (!client) return;

      const requiredFields = [
        "company_name",
        "first_name",
        "last_name",
        "cities",
        "states",
        "skills",
        "wants",
        "years_experience",
        "yearly_sales",
        "license_type",
      ];

      let filledFields = 0;

      requiredFields.forEach((field) => {
        const value = client[field];
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            if (value.length > 0) filledFields++;
          } else if (typeof value === "string") {
            if (value.trim() !== "") filledFields++;
          } else {
            filledFields++;
          }
        }
      });

      const percent = Math.round((filledFields / requiredFields.length) * 100);
      setCompletion(percent);

      // Find next unanswered question
      const missingField = requiredFields.find((field) => {
        const value = client[field];
        if (value === null || value === undefined) return true;
        if (Array.isArray(value) && value.length === 0) return true;
        if (typeof value === "string" && value.trim() === "") return true;
        return false;
      });

      if (missingField) {
        const questionMap: Record<string, ProfileQuestion> = {
          company_name: {
            field: "company_name",
            question: "What's your company/brokerage name?",
            category: "basic",
            priority: 1,
          },
          first_name: {
            field: "first_name",
            question: "What's your first name?",
            category: "basic",
            priority: 2,
          },
          last_name: {
            field: "last_name",
            question: "What's your last name?",
            category: "basic",
            priority: 3,
          },
          cities: {
            field: "cities",
            question: "Which cities do you operate in?",
            category: "location",
            priority: 4,
          },
          states: {
            field: "states",
            question: "Which states do you operate in?",
            category: "location",
            priority: 5,
          },
          skills: {
            field: "skills",
            question: "What skills/services do you provide?",
            category: "offerings",
            priority: 6,
          },
          wants: {
            field: "wants",
            question: "What do you offer to recruits?",
            category: "offerings",
            priority: 7,
          },
          years_experience: {
            field: "years_experience",
            question: "How many years of experience?",
            category: "experience",
            priority: 8,
          },
          yearly_sales: {
            field: "yearly_sales",
            question: "What's your yearly sales volume?",
            category: "experience",
            priority: 9,
          },
          license_type: {
            field: "license_type",
            question: "What's your license type?",
            category: "basic",
            priority: 10,
          },
        };

        setNextQuestion(questionMap[missingField] || null);
      } else {
        setNextQuestion(null);
      }
    } catch (error) {
      console.error("Error calculating completion:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-primary-foreground/20 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-primary-foreground/20 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (completion >= 90) {
    return (
      <Card className="bg-gradient-to-br from-success to-success/80 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-2">🎉 Profile Complete!</h2>
          <p className="text-sm mb-4 opacity-90">Your profile is {completion}% complete</p>
          <Button
            className="bg-white text-success hover:bg-white/90 font-semibold"
            onClick={() => navigate("/edit-team-profile")}
          >
            View Your Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4">Let's Complete Your Profile</h2>
        
        <Card className="bg-primary-foreground/10 backdrop-blur border-primary-foreground/20 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-primary-foreground/90">
                Your profile is {completion}% complete
              </p>
              <span className="text-sm font-semibold">{completion}%</span>
            </div>
            <Progress value={completion} className="h-2" />
          </CardContent>
        </Card>

        {nextQuestion ? (
          <Card className="bg-primary-foreground/10 backdrop-blur border-primary-foreground/20">
            <CardContent className="p-4">
              <p className="text-sm mb-3 text-primary-foreground">Next Step:</p>
              <h3 className="text-lg font-bold text-primary-foreground mb-4">
                {nextQuestion.question}
              </h3>
              <Button
                className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
                onClick={() => navigate("/edit-team-profile")}
              >
                Complete Profile →
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Button
            className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
            onClick={() => navigate("/edit-team-profile")}
          >
            View Your Profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
