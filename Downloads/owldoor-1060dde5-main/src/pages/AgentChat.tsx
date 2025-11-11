import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AgentChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm here to help answer your questions about OwlDoor and how we can help you grow your real estate business. What would you like to know?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: { messages: [...messages, userMessage], sessionId }
      });

      if (error) throw error;

      if (data?.sessionId) {
        setSessionId(data.sessionId);
      }

      if (data?.requiresVerification) {
        setRequiresVerification(true);
      }

      if (data?.message) {
        setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    if (!phone.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('agent-verify-phone', {
        body: { action: 'send', sessionId, phone }
      });

      if (error) throw error;

      setVerificationSent(true);
      toast({
        title: "Success",
        description: "Verification code sent!",
      });
    } catch (error) {
      console.error('Error sending verification:', error);
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('agent-verify-phone', {
        body: { action: 'verify', sessionId, code: verificationCode }
      });

      if (error) throw error;

      if (data?.success) {
        setRequiresVerification(false);
        setVerificationSent(false);
        setPhone("");
        setVerificationCode("");
        toast({
          title: "Success",
          description: "Phone verified! You can continue chatting.",
        });
      } else {
        toast({
          title: "Error",
          description: data?.message || "Verification failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    const ticketNumber = `TKT-${Date.now()}`;
    
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert([{
          ticket_number: ticketNumber,
          subject: 'Agent Chat Question',
          message: conversationText,
          category: 'general',
          status: 'open',
          priority: 'medium'
        }]);

      if (error) throw error;

      toast({
        title: "Support Ticket Created",
        description: "We'll get back to you soon!",
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket.",
        variant: "destructive",
      });
    }
  };

  const handleGoToSignup = () => {
    navigate('/agents');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-3xl h-[700px] flex flex-col shadow-xl">
        <div className="p-6 border-b bg-primary/5">
          <div className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">OwlDoor Agent Assistant</h1>
              <p className="text-sm text-muted-foreground">Ask me anything about how we work!</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "assistant"
                      ? "bg-card border"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-card">
          {requiresVerification ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Verify your phone to continue chatting</p>
              {!verificationSent ? (
                <div className="flex gap-2">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    disabled={isLoading}
                  />
                  <Button onClick={sendVerificationCode} disabled={isLoading}>
                    Send Code
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    disabled={isLoading}
                    maxLength={6}
                  />
                  <Button onClick={verifyCode} disabled={isLoading}>
                    Verify
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                <Button
                  onClick={handleGoToSignup}
                  variant="outline"
                  className="flex-1"
                >
                  Ready to Join? Sign Up
                </Button>
                <Button
                  onClick={handleCreateTicket}
                  variant="outline"
                  className="flex-1"
                >
                  Create Support Ticket
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AgentChat;
