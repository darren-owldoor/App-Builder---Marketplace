import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Star, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface AgentCardProps {
  pro: {
    id: string;
    pricing_tier?: string;
    qualification_score?: number;
    transactions?: number;
    experience?: number;
    states?: string[];
    cities?: string[];
    // PII fields (may be null if not unlocked)
    full_name?: string | null;
    first_name?: string | null;
    email?: string | null;
    phone?: string | null;
    brokerage?: string | null;
    image_url?: string | null;
    isUnlocked?: boolean; // Added from edge function response
  };
  isUnlocked: boolean;
  onUnlock?: () => void;
}

export function AgentCard({ pro, isUnlocked, onUnlock }: AgentCardProps) {
  const [unlocking, setUnlocking] = useState(false);

  const price = pro.pricing_tier === 'premium' ? 500
    : pro.pricing_tier === 'qualified' ? 300
    : 200;

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      const { data, error } = await supabase.functions.invoke('unlock-agent', {
        body: { pro_id: pro.id }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
        toast.success("Redirecting to payment...");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to unlock agent");
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar - Blocked if not unlocked */}
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            {isUnlocked && pro.image_url ? (
              <img src={pro.image_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : isUnlocked && pro.first_name ? (
              <span className="text-2xl font-bold text-primary">
                {pro.first_name[0]}
              </span>
            ) : (
              <Lock className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1">
            {/* Name - Blocked if not unlocked */}
            {isUnlocked ? (
              <h3 className="text-xl font-bold mb-2">
                {pro.full_name || 'Name Hidden'}
              </h3>
            ) : (
              <div className="mb-2">
                <div className="h-6 w-40 bg-muted rounded mb-1"></div>
              </div>
            )}
            
            {/* Brokerage - Blocked if not unlocked */}
            {isUnlocked ? (
              <p className="text-sm text-muted-foreground mb-2">
                {pro.brokerage || 'Brokerage Hidden'}
              </p>
            ) : (
              <div className="h-4 w-32 bg-muted/70 rounded mb-2"></div>
            )}

            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                ))}
              </div>
              <span className="text-sm font-semibold">4.8</span>
            </div>
          </div>

          {/* Pricing Tier Badge */}
          <Badge variant={pro.pricing_tier === 'premium' ? 'default' : 'secondary'} className="capitalize">
            {pro.pricing_tier || 'basic'}
          </Badge>
        </div>

        {/* Stats Grid - Always visible */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded">
            <div className="text-xs text-muted-foreground mb-1">EXPERIENCE</div>
            <div className="font-bold">{pro.experience || 0}y</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded">
            <div className="text-xs text-muted-foreground mb-1">DEALS</div>
            <div className="font-bold">{pro.transactions || 0}</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded">
            <div className="text-xs text-muted-foreground mb-1">SCORE</div>
            <div className="font-bold">{pro.qualification_score || 0}</div>
          </div>
        </div>

        {/* Service Areas - Always visible */}
        <div className="mb-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2">SERVICE AREAS</div>
          <div className="flex flex-wrap gap-2">
            {pro.cities && pro.cities.length > 0 ? (
              pro.cities.slice(0, 3).map((city, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {city}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Areas not specified</span>
            )}
          </div>
        </div>

        {/* Contact Info - Hidden if not unlocked */}
        {!isUnlocked && (
          <div className="mb-4 p-4 bg-muted/30 rounded border-2 border-dashed">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Lock className="h-6 w-6 text-primary" />
              <span className="font-semibold">Contact Information Locked</span>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Email:</span>
                <div className="h-4 flex-1 bg-muted rounded"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Phone:</span>
                <div className="h-4 flex-1 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        )}

        {isUnlocked && (
          <div className="mb-4 p-4 bg-success/10 rounded border border-success/30">
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> {pro.email || 'Not provided'}</p>
              <p><strong>Phone:</strong> {pro.phone || 'Not provided'}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!isUnlocked ? (
          <Button 
            className="w-full bg-primary hover:bg-primary/90"
            onClick={handleUnlock}
            disabled={unlocking}
          >
            <Lock className="mr-2 h-4 w-4" />
            Unlock for ${price}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline">View Full Profile</Button>
            <Button className="bg-success hover:bg-success/90">Contact Agent</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}