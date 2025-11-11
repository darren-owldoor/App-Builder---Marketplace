import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, UserCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender_type: string;
  content: string;
  created_at: string;
  ai_action: string | null;
}

interface ConversationViewProps {
  leadId: string; // This is match.id
  clientId: string;
}

export function ConversationView({ leadId, clientId }: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [match, setMatch] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMatch();
    loadMessages();

    const channel = supabase
      .channel(`conversation-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_messages',
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMatch = async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        pros!inner (
          id,
          full_name,
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .eq('id', leadId)
      .single();
    
    setMatch(data);
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !match) return;

    setSending(true);
    try {
      // Send via Twilio
      const { error: sendError } = await supabase.functions.invoke('send-sms', {
        body: {
          leadId: leadId,
          message: newMessage.trim(),
        },
      });

      if (sendError) throw sendError;

      setNewMessage("");
      toast({
        title: "Message Sent",
        description: "Your message has been sent via SMS",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'ai': return <Bot className="h-4 w-4" />;
      case 'lead': return <User className="h-4 w-4" />;
      case 'client': return <UserCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getSenderLabel = (senderType: string) => {
    switch (senderType) {
      case 'ai': return 'AI Assistant';
      case 'lead': return match?.pros?.first_name || 'Recruit';
      case 'client': return 'You';
      default: return 'Unknown';
    }
  };

  return (
    <Card className="flex flex-col h-[700px]">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              {match?.pros?.full_name || match?.pros?.phone || 'Loading...'}
            </h3>
            <p className="text-sm text-muted-foreground">{match?.pros?.phone}</p>
            {match?.pros?.email && (
              <p className="text-xs text-muted-foreground">{match.pros.email}</p>
            )}
          </div>
          <Badge variant="default">
            Match Score: {match?.match_score || 0}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.sender_type === 'client' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className={`p-2 rounded-full h-fit ${
                message.sender_type === 'ai' ? 'bg-primary/10' :
                message.sender_type === 'lead' ? 'bg-blue-500/10' :
                'bg-green-500/10'
              }`}>
                {getSenderIcon(message.sender_type)}
              </div>
              
              <div className={`flex-1 max-w-[80%] ${
                message.sender_type === 'client' ? 'items-end' : ''
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">
                    {getSenderLabel(message.sender_type)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.created_at), 'h:mm a')}
                  </span>
                </div>
                <div className={`p-3 rounded-lg ${
                  message.sender_type === 'client'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
                {message.ai_action && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {message.ai_action}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
