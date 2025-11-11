import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadsList } from "./LeadsList";
import { ConversationView } from "./ConversationView";
import { SeedDemoButton } from "./SeedDemoButton";
import { IMessageIntegration } from "@/components/settings/IMessageIntegration";
import { MessageSquare, Users, Settings } from "lucide-react";

interface AIRecruiterCRMProps {
  clientId: string;
  userId: string;
}

export function AIRecruiterCRM({ clientId, userId }: AIRecruiterCRMProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadsCount, setLeadsCount] = useState(0);

  useEffect(() => {
    loadLeadsCount();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `client_id=eq.${clientId}`,
        },
        () => {
          loadLeadsCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const loadLeadsCount = async () => {
    const { count } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('purchased', true);
    
    setLeadsCount(count || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Recruiter CRM</h1>
          <p className="text-muted-foreground mt-2">
            Manage AI-powered conversations with your recruits
          </p>
        </div>
        <SeedDemoButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Leads</p>
              <p className="text-2xl font-bold">{leadsCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Messages</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">AI Status</p>
              <p className="text-2xl font-bold text-green-600">Active</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="conversations" className="w-full">
        <TabsList>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <LeadsList
                clientId={clientId}
                selectedLeadId={selectedLeadId}
                onSelectLead={setSelectedLeadId}
              />
            </div>

            <div className="lg:col-span-2">
              {selectedLeadId ? (
                <ConversationView
                  leadId={selectedLeadId}
                  clientId={clientId}
                />
              ) : (
                <Card className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a conversation to view messages
                  </p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <div className="space-y-6">
            <IMessageIntegration />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
