import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "assistant" | "user";
  content: string;
}

const AIOnboarding = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [showChoice, setShowChoice] = useState(false);
  const [wantDetailed, setWantDetailed] = useState<boolean | undefined>(undefined);
  const [showWelcome, setShowWelcome] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const CORE_QUESTIONS_COUNT = 4;
  const TOTAL_QUESTIONS_COUNT = 14;

  useEffect(() => {
    initializeOnboarding();
  }, []);

  useEffect(() => {
    if (!showWelcome && !isComplete && !showChoice && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestion, showWelcome, isComplete, showChoice]);

  const initializeOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (clientError) throw clientError;
      setClientId(client.id);

      const { data: profile, error: profileError } = await supabase
        .from("client_business_profiles")
        .select("*")
        .eq("client_id", client.id)
        .single();

      if (profile) {
        setProfileId(profile.id);
        setIsComplete(profile.completed);
        
        if (profile.completed) {
          setProgress(100);
          setShowWelcome(false);
          return;
        }

        const { data: responses } = await supabase
          .from("client_onboarding_responses")
          .select("*")
          .eq("profile_id", profile.id)
          .order("created_at");

        if (responses && responses.length > 0) {
          const answersMap: Record<number, string> = {};
          responses.forEach((r, idx) => {
            answersMap[idx] = r.answer;
          });
          setAnswers(answersMap);
          setQuestionCount(responses.length);
          const totalQuestions = responses.length > CORE_QUESTIONS_COUNT ? TOTAL_QUESTIONS_COUNT : CORE_QUESTIONS_COUNT;
          setProgress((responses.length / totalQuestions) * 100);
        }
      } else {
        const { data: newProfile, error: createError } = await supabase
          .from("client_business_profiles")
          .insert({ client_id: client.id })
          .select()
          .single();

        if (createError) throw createError;
        setProfileId(newProfile.id);
      }
    } catch (error) {
      console.error("Error initializing:", error);
      toast.error("Failed to initialize onboarding");
    }
  };

  const startOnboarding = async () => {
    setShowWelcome(false);
    await getNextQuestion();
  };

  const getNextQuestion = async () => {
    setLoading(true);
    try {
      const conversationHistory: any[] = [];
      Object.entries(answers).forEach(([idx, answer]) => {
        conversationHistory.push({ role: "user", content: answer });
      });

      const { data, error } = await supabase.functions.invoke("ai-onboarding-chat", {
        body: {
          messages: conversationHistory,
          profileId,
          clientId,
          questionCount,
          wantDetailed,
        },
      });

      if (error) throw error;

      if (data.needsChoice) {
        setShowChoice(true);
        setCurrentQuestion(data.message);
      } else if (data.completed) {
        setIsComplete(true);
        setProgress(100);
        toast.success("Setup complete!");
      } else {
        setCurrentQuestion(data.message);
        const totalQuestions = wantDetailed ? TOTAL_QUESTIONS_COUNT : CORE_QUESTIONS_COUNT;
        setProgress((questionCount / totalQuestions) * 100);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to get next question");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || loading) return;

    const answer = currentAnswer.trim();
    setAnswers({ ...answers, [questionCount]: answer });
    setCurrentAnswer("");

    if (profileId) {
      await supabase.from("client_onboarding_responses").insert({
        profile_id: profileId,
        question: currentQuestion,
        answer: answer,
        question_order: questionCount,
      });
    }

    setQuestionCount(prev => prev + 1);
    await getNextQuestion();
  };

  const handleChoice = async (detailed: boolean) => {
    setWantDetailed(detailed);
    setShowChoice(false);
    setLoading(true);

    try {
      const conversationHistory: any[] = [];
      Object.entries(answers).forEach(([idx, answer]) => {
        conversationHistory.push({ role: "user", content: answer });
      });

      const { data, error } = await supabase.functions.invoke("ai-onboarding-chat", {
        body: {
          messages: conversationHistory,
          profileId,
          clientId,
          questionCount,
          wantDetailed: detailed,
        },
      });

      if (error) throw error;

      if (data.completed) {
        setIsComplete(true);
        setProgress(100);
        toast.success("Setup complete!");
      } else {
        setCurrentQuestion(data.message);
        setQuestionCount(prev => prev + 1);
        setProgress((questionCount / TOTAL_QUESTIONS_COUNT) * 100);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to continue");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8 pt-16">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            {showWelcome ? (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6"
              >
                <h1 className="text-5xl font-bold">Welcome! 👋</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  I'm your AI recruiting assistant. Let me ask you a few quick questions to get started with matching (takes 2-3 minutes).
                </p>
                <Button
                  size="lg"
                  onClick={startOnboarding}
                  className="mt-8"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            ) : isComplete ? (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
                <h2 className="text-4xl font-bold">All Set! 🎉</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {wantDetailed === false 
                    ? "You can start matching now. Add more details anytime from settings."
                    : "Your AI assistant is fully configured and ready to help you qualify leads."}
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate("/client")}
                  className="mt-8"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            ) : showChoice ? (
              <motion.div
                key="choice"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold">Great progress! 🎯</h2>
                  <p className="text-xl text-muted-foreground whitespace-pre-wrap">
                    {currentQuestion}
                  </p>
                </div>
                <div className="space-y-4">
                  <Button
                    size="lg"
                    onClick={() => handleChoice(true)}
                    className="w-full h-16 text-lg"
                    disabled={loading}
                  >
                    Add More Details Now (5 more minutes)
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleChoice(false)}
                    className="w-full h-16 text-lg"
                    disabled={loading}
                  >
                    Skip to Dashboard
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`question-${questionCount}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Question {questionCount + 1}</span>
                    <span>•</span>
                    <span>Press Enter to continue</span>
                  </div>
                  <h2 className="text-4xl font-bold leading-tight">
                    {currentQuestion}
                  </h2>
                </div>

                <div className="space-y-4">
                  <Textarea
                    ref={inputRef}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your answer here..."
                    className="min-h-[120px] text-lg resize-none border-2 focus:border-primary"
                    disabled={loading}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="lg"
                      onClick={handleSubmitAnswer}
                      disabled={loading || !currentAnswer.trim()}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AIOnboarding;
