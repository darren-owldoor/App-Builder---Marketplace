import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Bot, User as UserIcon, Users, Calendar, UserCircle, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ConversationPanelProps {
  leadId: string | null;
  clientId: string | undefined;
}

export function ConversationPanel({ leadId, clientId }: ConversationPanelProps) {
  const [message, setMessage] = useState('');
  const [messageFilter, setMessageFilter] = useState<'all' | 'lead' | 'ai' | 'you'>('all');
  const [showCalendar, setShowCalendar] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load lead details
  const { data: lead } = useQuery({
    queryKey: ['lead-detail', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const { data } = await supabase
        .from('ai_leads')
        .select('*, pros(*)')
        .eq('id', leadId)
        .single();
      return data;
    },
    enabled: !!leadId,
  });

  // Load messages
  const { data: messages } = useQuery({
    queryKey: ['ai-messages', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!leadId,
  });

  // Load appointments
  const { data: appointments } = useQuery({
    queryKey: ['appointments', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('lead_id', leadId)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });
      return data || [];
    },
    enabled: !!leadId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!leadId) throw new Error('No lead selected');
      
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { leadId, message: content },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['ai-messages', leadId] });
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!leadId) return;

    const channel = supabase
      .channel(`messages:${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_messages',
          filter: `lead_id=eq.${leadId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ai-messages', leadId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, queryClient]);

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'lead':
        return <UserCircle className="w-5 h-5" />;
      case 'ai':
        return <Bot className="w-5 h-5" />;
      case 'client':
        return <User className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getSenderColor = (senderType: string) => {
    switch (senderType) {
      case 'lead':
        return 'text-blue-600 bg-blue-50';
      case 'ai':
        return 'text-primary bg-primary/10';
      case 'client':
        return 'text-gray-700 bg-gray-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const filteredMessages = messages?.filter((msg) => {
    if (messageFilter === 'all') return true;
    if (messageFilter === 'lead') return msg.sender_type === 'lead';
    if (messageFilter === 'ai') return msg.sender_type === 'ai';
    if (messageFilter === 'you') return msg.sender_type === 'client';
    return true;
  }) || [];

  if (!leadId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 h-[600px] flex items-center justify-center">
        <div className="text-center text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3" />
          <p>Select a lead to view conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col h-[600px]">
      {/* Header */}
      <div className="pb-4 border-b mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-xl font-bold">Live Conversation</h2>
            {lead && (
              <div className="mt-1">
                <p className="text-sm font-semibold">
                  {lead.pros?.full_name}
                </p>
                <p className="text-xs text-gray-500">
                  {lead.pros?.cities?.[0]}, {lead.pros?.states?.[0]}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5">
          <Button
            variant={messageFilter === 'lead' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMessageFilter('lead')}
            className="text-xs"
          >
            Lead
          </Button>
          <Button
            variant={messageFilter === 'ai' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMessageFilter('ai')}
            className="text-xs"
          >
            AI
          </Button>
          <Button
            variant={messageFilter === 'you' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMessageFilter('you')}
            className="text-xs"
          >
            You
          </Button>
          {messageFilter !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessageFilter('all')}
              className="text-xs"
            >
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
        <div className="space-y-4">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3',
                  msg.sender_type === 'lead' ? 'justify-start' : 'justify-end'
                )}
              >
                {msg.sender_type === 'lead' && (
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', getSenderColor(msg.sender_type))}>
                    {getSenderIcon(msg.sender_type)}
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-3',
                    msg.sender_type === 'lead'
                      ? 'bg-gray-100 text-gray-900'
                      : msg.sender_type === 'ai'
                      ? 'bg-primary/10 text-gray-900'
                      : 'bg-primary text-white'
                  )}
                >
                  {msg.sender_type !== 'lead' && (
                    <div className="flex items-center gap-1 mb-1">
                      {getSenderIcon(msg.sender_type)}
                      <span className="text-xs font-semibold">
                        {msg.sender_type === 'ai' ? 'OwlDoor AI' : 'You'}
                      </span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={cn(
                    'text-xs mt-1',
                    msg.sender_type === 'client' ? 'text-white/70' : 'text-gray-500'
                  )}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
                {msg.sender_type !== 'lead' && (
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', getSenderColor(msg.sender_type))}>
                    {getSenderIcon(msg.sender_type)}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 mt-8">
              {messageFilter === 'all' ? 'No messages yet. Start the conversation!' : `No messages from ${messageFilter}.`}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Upcoming Appointments */}
      <div className="border-t pt-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-sm">Upcoming Appointments</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Calendar</span>
            <Switch
              checked={showCalendar}
              onCheckedChange={setShowCalendar}
            />
          </div>
        </div>

        {showCalendar && appointments && appointments.length > 0 ? (
          <div className="space-y-2">
            {appointments.map((apt) => (
              <div key={apt.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900">{apt.title}</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(apt.scheduled_at), 'EEEE, h:mm a - h:mm a')}
                    </p>
                    {apt.is_confirmed && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        Manually Scheduled
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : showCalendar ? (
          <p className="text-xs text-gray-400">No upcoming appointments</p>
        ) : null}
      </div>

      {/* Input */}
      <div className="pt-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message or let AI continue..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="h-[60px] px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
