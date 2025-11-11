import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, StickyNote } from "lucide-react";
import LeadAssignModal from "@/components/admin/LeadAssignModal";
import LeadDetailsModal from "./LeadDetailsModal";

interface LeadPipelineCardProps {
  lead: {
    id: string;
    full_name: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string | null;
    phone: string | null;
    brokerage?: string | null;
    company?: string | null;
    cities?: string[] | null;
    states?: string[] | null;
    status: string;
    pipeline_stage?: string | null;
    source?: string | null;
    
    // Model Match fields
    total_volume?: number | null;
    total_units?: number | null;
    buyer_volume?: number | null;
    buyer_percentage?: number | null;
    seller_volume?: number | null;
    seller_percentage?: number | null;
    dual_volume?: number | null;
    
    // Legacy fields
    total_sales?: number | null;
    transactions?: number | null;
    experience?: number | null;
    skills?: string[] | null;
    wants?: string[] | null;
    motivation?: number | null;
    qualification_score?: number | null;
    image_url?: string | null;
    purchased_client?: string | null;
    user_id?: string | null;
  };
  onViewDetails?: (id: string) => void;
  onLoginAs?: (userId: string) => void;
  showAdminActions?: boolean;
}

const LeadPipelineCard = ({ lead, onViewDetails, onLoginAs, showAdminActions = false }: LeadPipelineCardProps) => {
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'Hot': 'bg-destructive/10 text-destructive border-destructive/20',
      'Warm': 'bg-warning/10 text-warning border-warning/20',
      'Cold': 'bg-muted text-muted-foreground border-border',
    };
    return statusMap[status] || 'bg-muted text-muted-foreground';
  };

  const getPriorityClass = (priority: string) => {
    const priorityMap: Record<string, string> = {
      'HIGH': 'bg-destructive/10 text-destructive border-destructive/20',
      'MEDIUM': 'bg-warning/10 text-warning border-warning/20',
      'LOW': 'bg-muted text-muted-foreground border-border',
    };
    return priorityMap[priority] || 'bg-muted text-muted-foreground';
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '$0';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const formatSource = (source?: string | null) => {
    if (source === 'model-match') return 'OwlDoor Match';
    return source || 'Referral';
  };

  // Prefer Model Match data over legacy fields
  const totalVolume = lead.total_volume || lead.total_sales || 0;
  const totalUnits = lead.total_units || lead.transactions || 0;
  const motivation = lead.motivation || 0;
  const interest = lead.qualification_score || 0;
  
  // Calculate agent type badge
  const getAgentType = () => {
    if (!lead.buyer_percentage && !lead.seller_percentage) return null;
    const buyerPct = lead.buyer_percentage || 0;
    const sellerPct = lead.seller_percentage || 0;
    if (buyerPct > 60) return { label: 'Buyer Agent', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    if (sellerPct > 60) return { label: 'Listing Agent', color: 'bg-green-500/10 text-green-600 border-green-500/20' };
    return { label: 'Balanced', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
  };
  
  const agentType = getAgentType();

  return (
    <>
      <Card className="hover:shadow-lg transition-all overflow-hidden">
        <CardContent className="p-4 space-y-3">
          {/* Header with Avatar and Name */}
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 border-2 border-border">
              <AvatarImage src={lead.image_url || undefined} alt={lead.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(lead.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{lead.full_name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {lead.brokerage || lead.company || 'Independent'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {lead.cities && lead.cities[0] ? lead.cities[0] : 'Location not set'}
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-border">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Total Volume</div>
              <div className="text-sm font-bold text-foreground">{formatCurrency(totalVolume)}</div>
            </div>
            <div className="text-center border-x border-border">
              <div className="text-xs text-muted-foreground">Total Units</div>
              <div className="text-sm font-bold text-foreground">{totalUnits}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Avg Deal</div>
              <div className="text-sm font-bold text-foreground">
                {totalUnits > 0 ? formatCurrency(totalVolume / totalUnits) : '$0'}
              </div>
            </div>
          </div>

          {/* Agent Type Badge */}
          {agentType && (
            <div className="flex justify-center py-1">
              <Badge variant="outline" className={agentType.color}>
                {agentType.label}
              </Badge>
            </div>
          )}

          {/* Experience and Lead Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="font-semibold text-center mb-1 text-foreground">Experience</div>
              <div className="bg-muted rounded px-2 py-1 text-center font-medium">
                {lead.experience || 0} Years
              </div>
              {lead.skills && lead.skills.length > 0 && (
                <div className="mt-2">
                  <div className="text-muted-foreground mb-1">Skills</div>
                  <ul className="space-y-0.5">
                    {lead.skills.slice(0, 3).map((skill, idx) => (
                      <li key={idx} className="text-foreground">• {skill}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <div className="font-semibold text-center mb-1 text-foreground">Lead Details</div>
              {lead.wants && lead.wants.length > 0 && (
                <>
                  <div className="text-muted-foreground mb-1">Wants</div>
                  <ul className="space-y-0.5">
                    {lead.wants.slice(0, 4).map((want, idx) => (
                      <li key={idx} className="text-foreground">• {want}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="text-muted-foreground">Stage</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusBadgeClass('Hot')}>
                  Hot
                </Badge>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {lead.pipeline_stage || 'proposal'}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Priority</span>
                <span className="text-muted-foreground">Source</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getPriorityClass('HIGH')}>
                  HIGH
                </Badge>
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  {formatSource(lead.source)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Motivation and Interest Bars */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Motivation</span>
              <span className="font-semibold text-foreground">{motivation}/10</span>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-sm ${
                    i < motivation ? 'bg-success' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Interest</span>
              <span className="font-semibold text-foreground">{Math.round(interest/10)}/10</span>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-sm ${
                    i < Math.round(interest/10) ? 'bg-info' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 flex-wrap">
            {showAdminActions && onLoginAs && lead.user_id && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => onLoginAs(lead.user_id!)}
              >
                Magic Link
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setDetailsModalOpen(true)}
            >
              <ChevronDown className="h-3 w-3 mr-1" />
              EXPAND LEAD
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setAssignModalOpen(true)}
            >
              <StickyNote className="h-3 w-3 mr-1" />
              Add Notes
            </Button>
          </div>
        </CardContent>
      </Card>

      <LeadAssignModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        leadId={lead.id}
        leadName={lead.full_name}
        onAssignSuccess={() => {
          // Refresh could be triggered here if needed
        }}
      />

      <LeadDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        lead={lead}
      />
    </>
  );
};

export default LeadPipelineCard;
