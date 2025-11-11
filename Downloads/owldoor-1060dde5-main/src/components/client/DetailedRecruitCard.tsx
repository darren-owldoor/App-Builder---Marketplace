import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  TrendingUp,
  Award,
  Edit,
  CreditCard,
  Lock
} from "lucide-react";
import { LeadValidationBadge } from "@/components/admin/LeadValidationBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Match {
  id: string;
  created_at: string;
  match_score: number;
  purchased: boolean;
  cost: number;
  pricing_tier: string;
  pros: {
    full_name: string;
    email: string;
    phone: string;
    cities: string[];
    states: string[];
    brokerage: string;
    qualification_score: number;
    transactions?: number;
    experience?: number;
    motivation?: number;
    wants?: string[];
    skills?: string[];
    [key: string]: any;
  };
}

interface DetailedRecruitCardProps {
  match: Match;
  onPurchase?: (matchId: string) => void;
  hasPaymentMethod?: boolean;
  isPurchased?: boolean;
}

export const DetailedRecruitCard = ({ 
  match, 
  onPurchase, 
  hasPaymentMethod = false,
  isPurchased = false 
}: DetailedRecruitCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  return (
    <>
      <Card className={`${isPurchased ? 'bg-accent/10' : 'border-primary/20'}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-xl">
                  {isPurchased ? match.pros.full_name : "🔒 Name Hidden"}
                </CardTitle>
                <Badge variant={isPurchased ? "secondary" : "default"}>
                  {match.match_score}% Match
                </Badge>
                {isPurchased && <Badge variant="outline">Purchased</Badge>}
                <LeadValidationBadge 
                  motivation={match.pros?.motivation}
                  wants={match.pros?.wants}
                />
              </div>
              {isPurchased ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {match.pros.brokerage}
                </p>
              ) : (
                <Badge variant="outline" className="w-fit">
                  <Lock className="h-3 w-3 mr-1" />
                  Purchase to Unlock Full Details
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {isPurchased && (
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Recruit Details</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input defaultValue={match.pros.full_name} />
                      </div>
                      <div className="space-y-2">
                        <Label>Brokerage</Label>
                        <Input defaultValue={match.pros.brokerage} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" defaultValue={match.pros.email} />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input defaultValue={match.pros.phone} />
                      </div>
                      <div className="space-y-2">
                        <Label>Qualification Score</Label>
                        <Input type="number" defaultValue={match.pros.qualification_score} />
                      </div>
                      <div className="space-y-2">
                        <Label>Transactions</Label>
                        <Input type="number" defaultValue={match.pros.transactions || 0} />
                      </div>
                      <div className="space-y-2">
                        <Label>Experience (years)</Label>
                        <Input type="number" defaultValue={match.pros.experience || 0} />
                      </div>
                      <div className="space-y-2">
                        <Label>Motivation</Label>
                        <Input type="number" defaultValue={match.pros.motivation || 0} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cities</Label>
                      <Input defaultValue={match.pros.cities?.join(', ') || ''} placeholder="City1, City2" />
                    </div>
                    <div className="space-y-2">
                      <Label>States</Label>
                      <Input defaultValue={match.pros.states?.join(', ') || ''} placeholder="CA, NY" />
                    </div>
                    <div className="space-y-2">
                      <Label>Wants</Label>
                      <Textarea 
                        defaultValue={match.pros.wants?.join(', ') || ''} 
                        placeholder="What they're looking for..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Skills</Label>
                      <Textarea 
                        defaultValue={match.pros.skills?.join(', ') || ''} 
                        placeholder="Their skills and expertise..."
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setEditModalOpen(false)}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {isPurchased ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </p>
                  <a 
                    href={`mailto:${match.pros.email}`}
                    className="text-sm font-medium text-primary hover:underline break-all"
                  >
                    {match.pros.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </p>
                  <a 
                    href={`tel:${match.pros.phone}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {match.pros.phone}
                  </a>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Hidden
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Hidden
                  </p>
                </div>
              </>
            )}
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <MapPin className="h-3 w-3" />
                Location
              </p>
              <p className="text-sm font-medium">
                {match.pros.cities?.[0]}, {match.pros.states?.[0]}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Award className="h-3 w-3" />
                Qualification
              </p>
              <p className="text-sm font-medium">{match.pros.qualification_score}%</p>
            </div>
          </div>

          {expanded && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Transactions</p>
                  <p className="text-sm font-medium">{match.pros.transactions || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Experience</p>
                  <p className="text-sm font-medium">{match.pros.experience ? `${match.pros.experience} years` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Motivation</p>
                  <p className="text-sm font-medium">{match.pros.motivation || 'N/A'}</p>
                </div>
              </div>

              {match.pros.wants && match.pros.wants.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">What They Want</p>
                  <div className="flex flex-wrap gap-2">
                    {match.pros.wants.map((want, idx) => (
                      <Badge key={idx} variant="secondary">{want}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {match.pros.skills && match.pros.skills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {match.pros.skills.map((skill, idx) => (
                      <Badge key={idx} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {match.pros.cities && match.pros.cities.length > 1 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">All Locations</p>
                  <p className="text-sm">{match.pros.cities.join(', ')}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Added: {new Date(match.created_at).toLocaleDateString()}
              </div>
              
              {!isPurchased && (
                <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed border-primary/30 mt-4">
                  <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" />
                    Additional details available after purchase
                  </p>
                </div>
              )}
            </div>
          )}

          {!isPurchased && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <div>
                <p className="text-sm font-medium">🔒 Unlock Full Profile: ${match.cost}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {match.pricing_tier} tier • Includes name, email, phone, brokerage & full details
                </p>
              </div>
              <Button 
                onClick={() => onPurchase?.(match.id)}
                disabled={!hasPaymentMethod}
                size="lg"
              >
                {hasPaymentMethod ? (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Purchase Recruit
                  </>
                ) : (
                  'Add Payment Method First'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
