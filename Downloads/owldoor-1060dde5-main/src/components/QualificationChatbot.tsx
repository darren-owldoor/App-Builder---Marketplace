import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface QualificationChatbotProps {
  onClose: () => void;
  onComplete: () => void;
}

export const QualificationChatbot = ({ onClose, onComplete }: QualificationChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "We have Brokerages Asking about you! Can I ask you a question about what you'd like to see a Team offer you?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [collectedData, setCollectedData] = useState<any>({});

  const questions = [
    {
      question: "What would you like your next Team to offer? (e.g., Leads/Referrals, Coaching, CRM/Tech, High Splits, Marketing, Assistants)",
      field: "wants"
    },
    {
      question: "If you were offered these things from a Brokerage, how serious would you be about joining? (Rate from 1-10, where 10 is very serious)",
      field: "motivation"
    },
    {
      question: "What is your main market? (City and State)",
      field: "location"
    }
  ];

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    
    // Store the answer
    const currentQ = questions[currentQuestion];
    const updatedData = {
      ...collectedData,
      [currentQ.field]: input
    };
    setCollectedData(updatedData);
    setInput("");
    setIsLoading(true);

    // Move to next question or complete
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        const nextQuestion = questions[currentQuestion + 1];
        setMessages(prev => [...prev, {
          role: "assistant",
          content: nextQuestion.question
        }]);
        setCurrentQuestion(prev => prev + 1);
        setIsLoading(false);
      }, 500);
    } else {
      // All questions answered, update the agent record
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Please log in to continue");
          return;
        }

        // Parse the collected data
        const wants = updatedData.wants.split(',').map((w: string) => w.trim());
        const motivation = parseInt(updatedData.motivation) || 0;
        const [city, state] = updatedData.location.split(',').map((s: string) => s.trim());

        // Update pro to qualified status
        const { error: updateError } = await supabase
          .from('pros')
          .update({
            wants,
            motivation,
            ...(city && { cities: [city] }),
            ...(state && { states: [state] }),
            pipeline_stage: 'qualified',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        setMessages(prev => [...prev, {
          role: "assistant",
          content: "Perfect! Thank you for sharing that information. We'll start matching you with brokerages that fit what you're looking for!"
        }]);

        // Trigger auto-matching
        supabase.functions.invoke('auto-match-leads');

        setTimeout(() => {
          toast.success("Profile updated! You're now qualified for matching.");
          onComplete();
        }, 2000);
      } catch (error: any) {
        console.error("Error updating agent:", error);
        toast.error("Failed to update profile. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[80vh] flex flex-col shadow-2xl z-50 animate-in slide-in-from-bottom-5">
      <CardHeader className="border-b pb-3 flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">OwlDoor Matching</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your answer..."
              disabled={isLoading}
              className="text-sm"
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} size="sm">
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
