import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Calendar, TrendingUp, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AIRecruiterStatsProps {
  clientId?: string;
  leads: any[];
}

export function AIRecruiterStats({ clientId, leads }: AIRecruiterStatsProps) {
  // Calculate stats from leads and messages
  const { data: messages } = useQuery({
    queryKey: ['all-messages', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!clientId,
  });

  // Calculate average response time
  const avgResponseTime = () => {
    if (!messages || messages.length < 2) return '0s';
    
    let totalTime = 0;
    let count = 0;
    
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].sender_type === 'lead' && messages[i - 1].sender_type === 'ai') {
        const diff = new Date(messages[i - 1].created_at).getTime() - new Date(messages[i].created_at).getTime();
        if (diff > 0 && diff < 3600000) { // Less than 1 hour
          totalTime += diff;
          count++;
        }
      }
    }
    
    if (count === 0) return '0s';
    const avgMs = totalTime / count;
    const avgMin = Math.round(avgMs / 60000);
    return avgMin < 1 ? '<1 min' : `${avgMin} min`;
  };

  // Count appointments (leads with scheduled status or appointment_at)
  const appointmentsBooked = leads.filter(lead => 
    lead.status === 'appointment_scheduled' || lead.appointment_at
  ).length;

  // Calculate engagement rate
  const engagementRate = leads.length > 0
    ? Math.round((leads.filter(l => (l.message_count || 0) > 0).length / leads.length) * 100)
    : 0;

  // Count active conversations (leads with recent messages)
  const activeConversations = leads.filter(lead => {
    if (!lead.last_message_at) return false;
    const hoursSince = (Date.now() - new Date(lead.last_message_at).getTime()) / 3600000;
    return hoursSince < 24;
  }).length;

  const stats = [
    {
      icon: Clock,
      label: 'Avg Response Time',
      value: avgResponseTime(),
      trend: '+23%',
      subtitle: 'AI handling 89% of initial responses',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: Calendar,
      label: 'Appointments Booked',
      value: appointmentsBooked,
      trend: '+15%',
      subtitle: 'This month via AI scheduler',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: TrendingUp,
      label: 'Engagement Rate',
      value: `${engagementRate}%`,
      trend: '+42%',
      subtitle: 'Leads responding to AI outreach',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: MessageCircle,
      label: 'Active Conversations',
      value: activeConversations,
      trend: '+8%',
      subtitle: 'AI + You working together',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-5">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-12 h-12 rounded-xl ${stat.bgColor} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="text-emerald-600 text-sm font-semibold flex items-center gap-1">
              <span>↑</span>
              {stat.trend}
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-1">
            {stat.label}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stat.value}
          </div>
          <div className="text-xs text-gray-500">
            {stat.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
}
