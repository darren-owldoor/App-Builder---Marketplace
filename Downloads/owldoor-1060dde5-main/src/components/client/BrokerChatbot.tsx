import { useState, useImperativeHandle, forwardRef, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faRobot } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface BrokerChatbotRef {
  askQuestion: (question: string) => void;
}

interface BrokerChatbotProps {
  onBidRecommendation?: (recommendation: any) => void;
}

export const BrokerChatbot = forwardRef<BrokerChatbotRef, BrokerChatbotProps>(({ onBidRecommendation }, ref) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm here to help you find the right agents. Let's start with the basics—where are you looking to hire? Please tell me the cities, states, or zip codes.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const calculateBidRecommendation = (content: string) => {
    // Extract numbers from the assistant's response
    const transactionsMatch = content.match(/(\d+)\s*transactions/i);
    const experienceMatch = content.match(/(\d+)\s*years?\s*experience/i);
    
    if (transactionsMatch || experienceMatch) {
      const transactions = transactionsMatch ? parseInt(transactionsMatch[1]) : 0;
      const experience = experienceMatch ? parseInt(experienceMatch[1]) : 0;
      
      let baseBid = 175;
      if (transactions >= 60) baseBid = 500;
      else if (transactions >= 20) baseBid = 400;
      else if (transactions >= 10) baseBid = 300;
      else if (transactions >= 5) baseBid = 200;
      
      if (experience < 1) baseBid -= 25;
      
      return { baseBid, transactions, experience };
    }
    return null;
  };

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content || isLoading) return;

    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-broker", {
        body: { 
          messages: [...messages, userMessage],
          systemPrompt: `You are a helpful AI assistant for real estate brokers looking to hire agents. 

CRITICAL: Ask only ONE question at a time. Never ask multiple questions in a single response.

Guide the conversation by gathering information in this order:
1. Location (cities, states, zip codes)
2. Timeline (when they need agents)
3. Number of agents they're hiring
4. Minimum years of experience required
5. Minimum annual transactions required

After gathering ALL this information, provide a bid recommendation based on these tiers:
- Under 5 Transactions: $175
- 5-10 Transactions: $200
- 10-20 Transactions: $300
- 20-60 Transactions: $400
- Over 60 Transactions: $500

Deduct $25 for agents with under 1 year of experience.

Be conversational, friendly, and patient. Ask one clear question at a time and wait for their answer before moving to the next topic.`
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "I'm sorry, I couldn't process that. Could you try again?",
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Check if we should calculate a bid recommendation
      const recommendation = calculateBidRecommendation(data.response);
      if (recommendation && onBidRecommendation) {
        onBidRecommendation(recommendation);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    askQuestion: (question: string) => {
      const assistantMessage: Message = {
        role: "assistant",
        content: question,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
  }));

  return (
    <Card className="fixed bottom-4 left-4 w-96 max-h-[calc(100vh-2rem)] flex flex-col shadow-xl z-50">
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
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
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
              disabled={isLoading}
              className="text-sm"
            />
            <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} size="sm">
              <FontAwesomeIcon icon={faPaperPlane} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
