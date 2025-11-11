import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, DollarSign, Home, Phone, Mail, MessageSquare, CheckCircle2, Flame, ClipboardList } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { TasksEditor } from "./TasksEditor";

interface AILeadCardProps {
  lead: any;
  layout?: any;
}

export const AILeadCard = ({ lead, layout }: AILeadCardProps) => {
  const [tasksOpen, setTasksOpen] = useState(false);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getEngagementColor = (score: number | null | undefined) => {
    if (!score) return 'bg-gray-500';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const showField = (field: string) => {
    if (!layout) return true; // Show all by default
    return layout[`show_${field}`] !== false;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow border-2 border-gray-200">
      <CardContent className="p-4">
        {/* Header with Location and Motivation */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            {showField('avatar') && (
              <Avatar className="h-14 w-14">
                <AvatarImage src={lead.pros?.image_url || undefined} />
                <AvatarFallback className="bg-emerald-600 text-white text-lg font-bold">
                  {getInitials(lead.pros?.full_name || 'NA')}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base mb-1">{lead.pros?.full_name}</h3>
              {showField('location') && lead.pros?.cities?.[0] && (
                <div className="flex items-center gap-1.5 text-sm text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">{lead.pros.cities[0]}, {lead.pros.states?.[0]}</span>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {lead.ai_active && (
                  <Badge className="bg-emerald-500 text-white text-xs">
                    AI Active
                  </Badge>
                )}
                {showField('match_score') && (
                  <Badge variant="secondary" className="bg-emerald-600 text-white text-xs">
                    {lead.match_score || 0}% Match
                  </Badge>
                )}
                {showField('hot_badge') && lead.is_hot && (
                  <Badge variant="destructive" className="text-xs gap-1">
                    <Flame className="h-3 w-3" />
                    HOT
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Motivation Circle Badge */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full border-4 border-emerald-600 flex flex-col items-center justify-center bg-white">
              <div className="text-lg font-bold text-emerald-700">{lead.motivation_score || 10}</div>
              <div className="text-[9px] text-gray-500 -mt-0.5">/10</div>
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">Motivation</div>
          </div>
        </div>

        {/* Star Rating */}
        {lead.star_rating && (
          <div className="flex items-center gap-1 mb-3">
            <span className="text-yellow-500 text-lg">★</span>
            <span className="font-bold text-gray-900">{lead.star_rating}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div>
            <div className="text-[10px] text-emerald-600 font-semibold mb-1">MESSAGES</div>
            <div className="text-sm font-bold text-emerald-700">
              {lead.message_count || 0} <span className="text-xs">@ {lead.ai_message_count || 0}</span>
            </div>
          </div>
          {showField('engagement_score') && (
            <div>
              <div className="text-[10px] text-emerald-600 font-semibold mb-1">ENGAGEMENT</div>
              <div className="text-sm font-bold text-emerald-700">{lead.engagement_score || 0}%</div>
            </div>
          )}
          <div>
            <div className="text-[10px] text-emerald-600 font-semibold mb-1">NEXT ACTION</div>
            <div className="text-xs font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">
              {lead.next_action || '11 Hours'}
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {lead.ai_summary && (
          <div className="mb-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-start gap-2 mb-2">
              <Badge className="bg-emerald-600 text-white text-xs">AI Summary</Badge>
              {lead.updated_at && (
                <span className="text-xs text-emerald-600">
                  {new Date(lead.updated_at).toLocaleDateString()} {new Date(lead.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-700">{lead.ai_summary}</p>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-1.5 mb-3 text-sm">
          {showField('location') && lead.pros?.cities?.[0] && (
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>{lead.pros.cities[0]}, {lead.pros.states?.[0]}</span>
            </div>
          )}
          {showField('email') && lead.pros?.email && (
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4 text-emerald-600" />
              <span className="truncate">{lead.pros.email}</span>
            </div>
          )}
          {showField('phone') && lead.pros?.phone && (
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-emerald-600" />
              <span>{lead.pros.phone}</span>
            </div>
          )}
          {lead.pros?.phone && (
            <div className="text-emerald-600 text-sm font-medium underline cursor-pointer">
              {lead.pros.phone}
            </div>
          )}
        </div>

        {/* Wants What You Provide */}
        {showField('wants') && lead.pros?.wants && lead.pros.wants.length > 0 && (
          <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-900 mb-2">Wants What You Provide:</p>
            <p className="text-sm text-gray-700">
              {lead.pros.wants.join(', ')}
            </p>
          </div>
        )}

        {/* Next Action */}
        {showField('next_action') && lead.next_action && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 mb-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-medium text-primary">{lead.next_action}</p>
            </div>
          </div>
        )}

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            {showField('messages_count') && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{lead.ai_message_count || 0}</span>
              </div>
            )}
            {showField('tasks_count') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1"
                onClick={() => setTasksOpen(true)}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Tasks
              </Button>
            )}
          </div>
          {showField('last_contact') && lead.last_message_at && (
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(lead.last_message_at), { addSuffix: true })}
            </div>
          )}
        </div>
      </CardContent>

      <TasksEditor
        open={tasksOpen}
        onOpenChange={setTasksOpen}
        leadId={lead.id}
        clientId={lead.client_id}
      />
    </Card>
  );
};
