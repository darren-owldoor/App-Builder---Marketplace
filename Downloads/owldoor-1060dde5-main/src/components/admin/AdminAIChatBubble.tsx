import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, MessageSquare, X, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  content: string;
  id?: string;
}

interface UnansweredQuestion {
  id: string;
  question: string;
  created_at: string;
}

export const AdminAIChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unansweredQuestions, setUnansweredQuestions] = useState<UnansweredQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<UnansweredQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load or create conversation
  const loadConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the most recent conversation
      const { data: conversations, error: convError } = await supabase
        .from("admin_chat_conversations" as any)
        .select("id")
        .eq("admin_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (convError) throw convError;

      let convId: string;
      if (conversations && conversations.length > 0) {
        convId = (conversations[0] as any).id;
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from("admin_chat_conversations" as any)
          .insert({ admin_id: user.id })
          .select("id")
          .single();

        if (createError) throw createError;
        convId = (newConv as any).id;
      }

      setConversationId(convId);

      // Load messages
      const { data: msgs, error: msgError } = await supabase
        .from("admin_chat_messages" as any)
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (msgError) throw msgError;

      if (msgs && msgs.length > 0) {
        setMessages(msgs.map((m: any) => ({
          role: m.role,
          content: m.content,
          id: m.id
        })));
      } else {
        // Add welcome message
        const welcomeMsg = {
          role: "assistant" as const,
          content: "Hi Admin! I can help you with training, create blog posts, and manage your OwlDoor platform. What would you like to do?"
        };
        setMessages([welcomeMsg]);
        
        // Save welcome message
        await supabase
          .from("admin_chat_messages" as any)
          .insert({
            conversation_id: convId,
            role: welcomeMsg.role,
            content: welcomeMsg.content
          });
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const fetchUnansweredQuestions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-ai-chat', {
        body: { action: 'get_unanswered' }
      });

      if (error) throw error;
      if (data?.questions) {
        setUnansweredQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error fetching unanswered questions:', error);
    }
  };

  useEffect(() => {
    loadConversation();
    fetchUnansweredQuestions();
    // Poll for new questions every 30 seconds
    const interval = setInterval(fetchUnansweredQuestions, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !conversationId) return;

    const userMessage: Message = { role: "user", content: input };
    setInput("");
    setIsLoading(true);

    try {
      // Save user message to database
      const { data: savedUserMsg, error: saveError } = await supabase
        .from("admin_chat_messages" as any)
        .insert({
          conversation_id: conversationId,
          role: userMessage.role,
          content: userMessage.content
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setMessages(prev => [...prev, { ...userMessage, id: (savedUserMsg as any).id }]);

      // Get AI response with full conversation history
      const { data, error } = await supabase.functions.invoke('admin-ai-chat', {
        body: { 
          messages: [...messages, userMessage],
          conversationId 
        }
      });

      if (error) throw error;

      if (data?.message) {
        const assistantMessage = { role: "assistant" as const, content: data.message };
        
        // Save assistant message to database
        const { data: savedAssistantMsg, error: saveAssistantError } = await supabase
          .from("admin_chat_messages" as any)
          .insert({
            conversation_id: conversationId,
            role: assistantMessage.role,
            content: assistantMessage.content
          })
          .select()
          .single();

        if (saveAssistantError) throw saveAssistantError;

        setMessages(prev => [...prev, { ...assistantMessage, id: (savedAssistantMsg as any).id }]);

        // Update conversation timestamp
        await supabase
          .from("admin_chat_conversations" as any)
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      }

      if (data?.blogPostCreated) {
        toast({
          title: "Blog Post Created!",
          description: "The AI has created a new blog post for you.",
        });
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

  const saveTraining = async () => {
    if (!selectedQuestion || !answer.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide an answer",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('admin-ai-chat', {
        body: {
          action: 'save_training',
          trainingId: selectedQuestion.id,
          answer: answer
        }
      });

      if (error) throw error;

      toast({
        title: "Training Saved!",
        description: "The AI will now use this answer for similar questions.",
      });

      setAnswer("");
      setSelectedQuestion(null);
      fetchUnansweredQuestions();
    } catch (error) {
      console.error('Error saving training:', error);
      toast({
        title: "Error",
        description: "Failed to save training data.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
          {unansweredQuestions.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center"
            >
              {unansweredQuestions.length}
            </Badge>
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col shadow-2xl z-50">
          <div className="p-4 border-b bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-bold">AI Training Assistant</h3>
                <p className="text-xs text-muted-foreground">
                  {unansweredQuestions.length} pending questions
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Unanswered Questions Section */}
          {unansweredQuestions.length > 0 && !selectedQuestion && (
            <div className="p-4 border-b bg-accent/5">
              <h4 className="text-sm font-semibold mb-2">Questions from Agents:</h4>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {unansweredQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="text-xs p-2 bg-card border rounded cursor-pointer hover:bg-accent"
                      onClick={() => setSelectedQuestion(q)}
                    >
                      <p className="line-clamp-2">{q.question}</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        {new Date(q.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Training Answer Form */}
          {selectedQuestion && (
            <div className="p-4 border-b bg-accent/5">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold">Provide Answer:</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSelectedQuestion(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs mb-2 p-2 bg-card border rounded">
                Q: {selectedQuestion.question}
              </p>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type the answer that AI should use..."
                className="mb-2 text-sm"
                rows={3}
              />
              <Button
                onClick={saveTraining}
                size="sm"
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Training
              </Button>
            </div>
          )}

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 ${
                    message.role === "assistant" ? "justify-start" : "justify-end"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 text-sm ${
                      message.role === "assistant"
                        ? "bg-card border"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-card border rounded-lg p-3">
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

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask me anything or provide training..."
                disabled={isLoading}
                className="flex-1 text-sm resize-none"
                rows={2}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
