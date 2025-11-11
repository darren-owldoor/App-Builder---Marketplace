import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIRecruiterStats } from '@/components/ai-recruiter/AIRecruiterStats';
import { LeadsPipeline } from '@/components/ai-recruiter/LeadsPipeline';
import { ConversationPanel } from '@/components/ai-recruiter/ConversationPanel';
import { AIConfigPanel } from '@/components/ai-recruiter/AIConfigPanel';
import { AILeadKanban } from '@/components/ai-recruiter/AILeadKanban';
import { CardLayoutBuilder } from '@/components/ai-recruiter/CardLayoutBuilder';
import { IMessageIntegration } from '@/components/settings/IMessageIntegration';
import { AIRecruiterSidebar } from '@/components/ai-recruiter/AIRecruiterSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MessageSquare, Settings, Users, BarChart3 } from 'lucide-react';

export default function AIRecruiter() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [cardBuilderOpen, setCardBuilderOpen] = useState(false);
  const [cardViewType, setCardViewType] = useState<'kanban' | 'list'>('kanban');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user and client
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  const { data: client } = useQuery({
    queryKey: ['client', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from('clients')
        .select('*, ai_config(*)')
        .eq('user_id', session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // Load AI leads (matches that are purchased)
  const { data: leads, isLoading } = useQuery({
    queryKey: ['ai-leads', client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      const { data } = await supabase
        .from('ai_leads')
        .select(`
          *,
          pros (
            full_name,
            phone,
            email,
            cities,
            states,
            brokerage
          )
        `)
        .eq('client_id', client.id)
        .order('updated_at', { ascending: false });
      return data || [];
    },
    enabled: !!client?.id,
  });

  // Load card layout for both kanban and list
  const { data: cardLayout } = useQuery({
    queryKey: ['card-layout', client?.id, cardViewType],
    queryFn: async () => {
      if (!client?.id) return null;
      const { data } = await supabase
        .from('ai_card_layouts')
        .select('*')
        .eq('client_id', client.id)
        .eq('view_type', cardViewType)
        .maybeSingle();
      return data;
    },
    enabled: !!client?.id,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!client?.id) return;

    const channel = supabase
      .channel('ai-leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_leads',
          filter: `client_id=eq.${client.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ai-leads'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_messages',
          filter: `client_id=eq.${client.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ai-messages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [client?.id, queryClient]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-100">
        <AIRecruiterSidebar />
        
        <div className="flex-1">
          {/* Top Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-8 py-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-white hover:bg-white/20" />
              <div className="flex justify-between items-center flex-1">
                <div>
                  <h1 className="text-3xl font-bold mb-1">AI Marketing & CRM Hub</h1>
                  <p className="text-sm opacity-90">Automated lead engagement powered by AI</p>
                </div>
                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-semibold text-sm">
                    AI {client?.ai_config?.[0]?.ai_enabled ? 'Active & Responding' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-[1600px] mx-auto px-8 py-6">
        {/* Stats Dashboard */}
        <AIRecruiterStats clientId={client?.id} leads={leads || []} />

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="bg-white rounded-xl p-2 shadow-sm mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2">
              <Users className="w-4 h-4" />
              Lead Pipeline
            </TabsTrigger>
            <TabsTrigger value="conversations" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Conversations
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              AI Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <LeadsPipeline
                  leads={leads || []}
                  selectedLeadId={selectedLeadId}
                  onSelectLead={setSelectedLeadId}
                  isLoading={isLoading}
                  onOpenCardBuilder={() => { setCardViewType('list'); setCardBuilderOpen(true); }}
                  cardLayout={cardLayout}
                />
              </div>
              <div>
                <ConversationPanel
                  leadId={selectedLeadId}
                  clientId={client?.id}
                />
              </div>
            </div>
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations" className="mt-0">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <LeadsPipeline
                  leads={leads || []}
                  selectedLeadId={selectedLeadId}
                  onSelectLead={setSelectedLeadId}
                  isLoading={isLoading}
                  onOpenCardBuilder={() => { setCardViewType('list'); setCardBuilderOpen(true); }}
                  cardLayout={cardLayout}
                />
              </div>
              <div>
                <ConversationPanel
                  leadId={selectedLeadId}
                  clientId={client?.id}
                />
              </div>
            </div>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline">
            <AILeadKanban 
              leads={leads || []} 
              clientId={client?.id || ''}
              onLeadUpdate={() => queryClient.invalidateQueries({ queryKey: ['ai-leads'] })}
              onOpenCardBuilder={() => { setCardViewType('kanban'); setCardBuilderOpen(true); }}
              cardLayout={cardLayout}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Analytics Dashboard</h2>
              <p className="text-gray-600">Coming soon: Detailed analytics and insights</p>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <AIConfigPanel clientId={client?.id} />
            <IMessageIntegration />
          </TabsContent>
        </Tabs>

        <CardLayoutBuilder
          open={cardBuilderOpen}
          onOpenChange={setCardBuilderOpen}
          clientId={client?.id || ''}
          viewType={cardViewType}
        />
      </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
