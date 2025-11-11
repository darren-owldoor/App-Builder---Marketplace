import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LeadValidationBadge } from "@/components/admin/LeadValidationBadge";

interface LeadListItemProps {
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
    counties?: string[] | null;
    zip_codes?: string[] | null;
    radius?: number | null;
    status: string;
    pipeline_stage?: string | null;
    wants?: string[] | null;
    
    // Model Match fields
    total_volume?: number | null;
    total_units?: number | null;
    buyer_percentage?: number | null;
    seller_percentage?: number | null;
    
    // Legacy fields
    experience?: number | null;
    transactions?: number | null;
    total_sales?: number | null;
    qualification_score?: number | null;
    motivation?: number | null;
    image_url?: string | null;
    user_id?: string | null;
  };
  onExpand: () => void;
  onLoginAs?: (userId: string) => void;
  showAdminActions?: boolean;
}

const LeadListItem = ({ lead, onExpand, onLoginAs, showAdminActions = false }: LeadListItemProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '0';
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return `${amount}`;
  };

  const formatStage = (stage: string) => {
    const stageMap: Record<string, string> = {
      'new': 'New',
      'qualifying': 'Qualifying',
      'qualified': 'Qualified',
      'match_ready': 'Ready',
      'matched': 'Matched',
      'purchased': 'Purchased',
    };
    return stageMap[stage] || stage;
  };

  const getLocationDisplay = () => {
    // Priority: Zip + Radius > County + State > City + State
    // Show latest entry if multiple
    
    if (lead.zip_codes && lead.zip_codes.length > 0) {
      const latestZip = lead.zip_codes[lead.zip_codes.length - 1];
      if (lead.radius) {
        return `${latestZip} (${lead.radius}mi)`;
      }
      return latestZip;
    }
    
    if (lead.counties && lead.counties.length > 0 && lead.states && lead.states.length > 0) {
      const latestCounty = lead.counties[lead.counties.length - 1];
      const latestState = lead.states[lead.states.length - 1];
      return `${latestCounty}, ${latestState}`;
    }
    
    if (lead.cities && lead.cities.length > 0 && lead.states && lead.states.length > 0) {
      const latestCity = lead.cities[lead.cities.length - 1];
      const latestState = lead.states[lead.states.length - 1];
      return `${latestCity}, ${latestState}`;
    }
    
    return 'Not set';
  };

  const score = Math.round((lead.qualification_score || 0) / 10);
  const motivation = lead.motivation || 0;
  
  // Prefer Model Match data over legacy
  const totalVolume = lead.total_volume || lead.total_sales || 0;
  const totalUnits = lead.total_units || lead.transactions || 0;
  
  // Get agent type
  const getAgentTypeBadge = () => {
    if (!lead.buyer_percentage && !lead.seller_percentage) return null;
    const buyerPct = lead.buyer_percentage || 0;
    const sellerPct = lead.seller_percentage || 0;
    if (buyerPct > 60) return 'Buyer';
    if (sellerPct > 60) return 'Listing';
    return 'Balanced';
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 md:py-1.5 border border-border rounded-lg hover:border-primary/50 transition-all bg-card overflow-x-auto">
      {/* Avatar and Name */}
      <div className="flex items-center gap-2 min-w-[180px]">
        <Avatar className="h-8 w-8 border border-border flex-shrink-0">
          <AvatarImage src={lead.image_url || undefined} alt={lead.full_name} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium text-[10px]">
            {getInitials(lead.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-xs text-foreground truncate leading-tight">{lead.full_name}</h3>
          {lead.email && (
            <p className="text-[10px] text-primary truncate leading-tight">{lead.email}</p>
          )}
          <p className="text-[10px] text-muted-foreground truncate leading-tight">{lead.brokerage || lead.company || 'Independent'}</p>
        </div>
      </div>

      {/* Stage - Hidden on Mobile */}
      <div className="hidden md:flex min-w-[80px] flex-col items-center">
        <div className="text-[10px] text-muted-foreground">Stage</div>
        <div className="text-xs font-medium text-foreground">{formatStage(lead.pipeline_stage || 'new')}</div>
      </div>

      {/* Experience - Hidden on Mobile */}
      <div className="hidden md:flex min-w-[80px] flex-col items-center">
        <div className="text-[10px] text-muted-foreground">Experience</div>
        <div className="text-xs font-medium text-foreground">{lead.experience || 0} Years</div>
      </div>

      {/* Transactions - Hidden on Mobile */}
      <div className="hidden md:flex min-w-[85px] flex-col items-center">
        <div className="text-[10px] text-muted-foreground">Total Units</div>
        <div className="text-xs font-medium text-foreground">{totalUnits}</div>
      </div>

      {/* Total Sales - Hidden on Mobile */}
      <div className="hidden md:flex min-w-[75px] flex-col items-center">
        <div className="text-[10px] text-muted-foreground">Total Volume</div>
        <div className="text-xs font-medium text-foreground">{formatCurrency(totalVolume)}</div>
      </div>

      {/* Agent Type - Hidden on Mobile */}
      {getAgentTypeBadge() && (
        <div className="hidden md:flex min-w-[70px] flex-col items-center">
          <div className="text-[10px] text-muted-foreground">Type</div>
          <Badge variant="secondary" className="text-[10px] h-5 px-2">
            {getAgentTypeBadge()}
          </Badge>
        </div>
      )}

      {/* Location - Hidden on Mobile */}
      <div className="hidden md:flex min-w-[120px] flex-col items-center">
        <div className="text-[10px] text-muted-foreground">Location</div>
        <div className="text-xs font-medium text-foreground truncate max-w-full px-1">
          {getLocationDisplay()}
        </div>
      </div>

      {/* State - Hidden on Mobile */}
      <div className="hidden md:flex min-w-[50px] flex-col items-center">
        <div className="text-[10px] text-muted-foreground">State</div>
        <div className="text-xs font-medium text-foreground">
          {lead.states && lead.states[0] ? lead.states[0] : '-'}
        </div>
      </div>

      {/* Validation Status - Only visible for admins */}
      {showAdminActions && (
        <div className="hidden md:flex min-w-[90px] flex-col items-center">
          <div className="text-[10px] text-muted-foreground mb-0.5">Status</div>
          <LeadValidationBadge 
            motivation={lead.motivation}
            wants={lead.wants}
            compact={false}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 ml-auto flex-shrink-0">
        {showAdminActions && onLoginAs && lead.user_id && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 px-3"
              onClick={() => onLoginAs(lead.user_id!)}
            >
              Magic Link
            </Button>
        )}
        <Button
          variant="default"
          size="sm"
          className="text-xs h-7 px-3"
          onClick={onExpand}
        >
          Expand
        </Button>
      </div>

      {/* Score & Motivation */}
      <div className="min-w-[120px] flex flex-col gap-1 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-16">Score</span>
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${score * 10}%` }} />
          </div>
          <span className="text-[10px] font-semibold text-foreground w-8 text-right">{score * 10}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-16">Motivation</span>
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${motivation * 10}%` }} />
          </div>
          <span className="text-[10px] font-semibold text-foreground w-8 text-right">{motivation}/10</span>
        </div>
      </div>
    </div>
  );
};

export default LeadListItem;
