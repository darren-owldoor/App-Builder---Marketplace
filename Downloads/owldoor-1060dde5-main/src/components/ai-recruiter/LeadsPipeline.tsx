import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Phone, Mail, MapPin, MessageSquare, Sparkles, Filter, Flame, Settings2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LeadsPipelineProps {
  leads: any[];
  selectedLeadId: string | null;
  onSelectLead: (leadId: string) => void;
  isLoading: boolean;
  showFullView?: boolean;
  onOpenCardBuilder?: () => void;
  cardLayout?: any;
}

export function LeadsPipeline({
  leads,
  selectedLeadId,
  onSelectLead,
  isLoading,
  showFullView = false,
  onOpenCardBuilder,
  cardLayout,
}: LeadsPipelineProps) {
  
  const showField = (field: string) => {
    if (!cardLayout) return true;
    return cardLayout[`show_${field}`] !== false;
  };
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      new: { label: 'New', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      contacted: { label: 'Contacted', className: 'bg-purple-100 text-purple-700 border-purple-200' },
      engaged: { label: 'Engaged', className: 'bg-green-100 text-green-700 border-green-200' },
      appointment_scheduled: { label: 'Scheduled', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      appointment_confirmed: { label: 'Confirmed', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      closed: { label: 'Closed', className: 'bg-gray-100 text-gray-700 border-gray-200' },
      needs_attention: { label: 'Needs Attention', className: 'bg-red-100 text-red-700 border-red-200' },
    };
    
    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
    return (
      <span className={cn('px-2 py-1 rounded-md text-xs font-semibold border', config.className)}>
        {config.label}
      </span>
    );
  };

  const getNextActionBadge = (nextAction: string) => {
    if (!nextAction) return null;
    
    const actionMap: Record<string, { label: string; className: string }> = {
      book_call: { label: 'Book Call', className: 'bg-primary text-white' },
      confirm_apt: { label: 'Confirm Apt', className: 'bg-yellow-500 text-white' },
      awaiting_reply: { label: 'Awaiting Reply', className: 'bg-orange-500 text-white' },
      new_team: { label: 'New Team', className: 'bg-blue-500 text-white' },
      respond: { label: 'Respond', className: 'bg-red-500 text-white' },
    };
    
    const config = actionMap[nextAction] || { label: nextAction, className: 'bg-gray-500 text-white' };
    return (
      <span className={cn('px-2 py-1 rounded-md text-xs font-bold', config.className)}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-400">Loading leads...</div>
        </div>
      </div>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No leads yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl font-bold">Active Lead Pipeline</h2>
          <p className="text-sm text-gray-600 mt-1">{leads.length} total leads</p>
        </div>
        <div className="flex gap-2">
          {onOpenCardBuilder && (
            <Button variant="outline" size="sm" className="gap-2" onClick={onOpenCardBuilder}>
              <Settings2 className="w-4 h-4" />
              Customize Cards
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </div>

      <ScrollArea className={cn('pr-4', showFullView ? 'h-[calc(100vh-300px)]' : 'h-[600px]')}>
        <div className="space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => onSelectLead(lead.id)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md bg-white',
                selectedLeadId === lead.id
                  ? 'border-emerald-500 shadow-lg'
                  : 'border-gray-200 hover:border-emerald-300'
              )}
            >
              {/* Header Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  {/* Avatar */}
                  {showField('avatar') && (
                    <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-lg flex-shrink-0">
                      {(lead.pros?.full_name || 'U')[0]}{(lead.pros?.full_name?.split(' ')[1] || 'L')[0]}
                    </div>
                  )}
                  
                  {/* Name and Location */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-1 truncate">
                      {lead.pros?.full_name || 'Unknown Lead'}
                    </h3>
                    {showField('location') && lead.pros?.cities && lead.pros?.states && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{lead.pros.cities[0]}, {lead.pros.states[0]}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {lead.ai_active && (
                      <Badge className="bg-emerald-500 text-white text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Active
                      </Badge>
                    )}
                    {showField('match_score') && (
                      <Badge className="bg-emerald-500 text-white text-xs">
                        {lead.match_score || 0}% Match
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Motivation Circle */}
                {lead.motivation_score && (
                  <div className="flex flex-col items-center ml-4 flex-shrink-0">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-600 flex flex-col items-center justify-center bg-white">
                      <div className="text-xl font-bold text-emerald-700">{lead.motivation_score}</div>
                      <div className="text-[9px] text-gray-500 -mt-0.5">/10</div>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1">Motivation</div>
                  </div>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                {showField('messages_count') && (
                  <div>
                    <div className="text-[10px] text-emerald-600 font-semibold mb-1 uppercase tracking-wide">Messages</div>
                    <div className="text-base font-bold text-gray-900">
                      {lead.message_count || 0} <span className="text-xs text-gray-500 font-normal">@ {lead.ai_message_count || 0} AI</span>
                    </div>
                  </div>
                )}
                {showField('engagement_score') && (
                  <div>
                    <div className="text-[10px] text-emerald-600 font-semibold mb-1 uppercase tracking-wide">Engagement</div>
                    <div className="text-base font-bold text-gray-900">{lead.engagement_score || 0}%</div>
                  </div>
                )}
                {showField('next_action') && (
                  <div>
                    <div className="text-[10px] text-emerald-600 font-semibold mb-1 uppercase tracking-wide">Next Action</div>
                    <div>{getNextActionBadge(lead.next_action)}</div>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm mb-4">
                {showField('email') && lead.pros?.email && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">{lead.pros.email}</span>
                  </div>
                )}
                {showField('phone') && lead.pros?.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{lead.pros.phone}</span>
                  </div>
                )}
                {lead.pros?.brokerage && (
                  <div className="text-xs text-emerald-600 font-medium">
                    {lead.pros.brokerage}
                  </div>
                )}
              </div>

              {/* Wants Section */}
              {showField('wants') && lead.pros?.wants && lead.pros.wants.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Wants What You Provide:</p>
                  <div className="flex flex-wrap gap-1">
                    {lead.pros.wants.map((want, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {want}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center pt-3 border-t border-gray-200">
                {lead.lead_score !== undefined && lead.lead_score !== null && (
                  <div className="text-xl font-bold text-gray-900">{lead.lead_score}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
