import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Phone, MessageSquare } from "lucide-react";

interface Lead {
  id: string;
  pro_id: string;
  full_name: string;
  phone: string;
  email?: string;
  status: string;
  last_message_at?: string;
  message_count: number;
  match_score?: number;
  purchased: boolean;
  lead_score: number;
}

interface LeadsListProps {
  clientId: string;
  selectedLeadId: string | null;
  onSelectLead: (leadId: string) => void;
}

export function LeadsList({ clientId, selectedLeadId, onSelectLead }: LeadsListProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();

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
          loadLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const loadLeads = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('matches')
      .select(`
        id,
        pro_id,
        status,
        match_score,
        purchased,
        created_at,
        lead_score,
        pros!inner (
          id,
          full_name,
          phone,
          email
        )
      `)
      .eq('client_id', clientId)
      .eq('purchased', true)
      .order('lead_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    // Transform to Lead format
    const transformedLeads = (data || []).map(match => ({
      id: match.id,
      pro_id: match.pro_id,
      full_name: match.pros.full_name,
      phone: match.pros.phone,
      email: match.pros.email,
      status: match.status || 'new',
      match_score: match.match_score,
      purchased: match.purchased,
      last_message_at: match.created_at,
      message_count: 0,
      lead_score: match.lead_score || 0
    }));

    setLeads(transformedLeads);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/10 text-blue-500';
      case 'engaged': return 'bg-green-500/10 text-green-500';
      case 'appointment_set': return 'bg-purple-500/10 text-purple-500';
      case 'qualified': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 75) {
      return { label: "🔥 Hot", color: "bg-red-500 text-white", ring: "ring-2 ring-red-500/50" };
    } else if (score >= 50) {
      return { label: "⭐ Warm", color: "bg-orange-500 text-white", ring: "ring-2 ring-orange-500/50" };
    } else if (score >= 25) {
      return { label: "💬 Active", color: "bg-blue-500 text-white", ring: "" };
    } else {
      return { label: "❄️ Cold", color: "bg-gray-500 text-white", ring: "" };
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading leads...</div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Conversations</h3>
      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          {leads.map((lead) => {
            const scoreBadge = getScoreBadge(lead.lead_score);
            return (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-accent ${
                  selectedLeadId === lead.id ? 'bg-accent' : ''
                } ${scoreBadge.ring}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{lead.full_name || lead.phone}</p>
                      <Badge className={`${scoreBadge.color} text-xs`}>
                        {scoreBadge.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      <span className="text-xs font-medium text-muted-foreground">
                        • Score: {lead.lead_score}/100
                      </span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{lead.message_count} messages</span>
                  </div>
                  {lead.last_message_at && (
                    <span>
                      {formatDistanceToNow(new Date(lead.last_message_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {leads.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No conversations yet
            </p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
