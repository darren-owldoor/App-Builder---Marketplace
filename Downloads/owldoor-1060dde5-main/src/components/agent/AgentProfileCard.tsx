import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Target, Briefcase, Mail, Phone } from "lucide-react";

interface AgentProfileCardProps {
  name: string;
  avatarUrl?: string;
  matchPercentage: number;
  yearsExperience: number;
  wantsNeedsMatch: number;
  tags: string[];
  salesPerYear: number;
  brokerage: string;
  closerRate: number;
  email: string;
  phone?: string;
  onEditProfile: () => void;
  onEditWants: () => void;
}

const AgentProfileCard = ({
  name,
  avatarUrl,
  matchPercentage,
  yearsExperience,
  wantsNeedsMatch,
  tags,
  salesPerYear,
  brokerage,
  closerRate,
  email,
  phone,
  onEditProfile,
  onEditWants,
}: AgentProfileCardProps) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex gap-3 mb-6">
          <Button onClick={onEditProfile} variant="default" size="sm" className="flex-1">
            Edit Profile
          </Button>
          <Button onClick={onEditWants} variant="outline" size="sm" className="flex-1">
            Edit Wants
          </Button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <Avatar className="h-32 w-32 mb-4">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-foreground">{name}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              {matchPercentage}% matched
            </div>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Briefcase className="h-4 w-4" />
              {yearsExperience} years
            </div>
          </div>
        </div>

        <div className="bg-muted/20 p-3 rounded-lg mb-6">
          <p className="text-sm text-muted-foreground">
            Wants & Needs Match <span className="font-semibold text-foreground">{wantsNeedsMatch}%</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="justify-center py-2">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">{salesPerYear} Sales Per Year</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Exp {brokerage}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Top {closerRate}% Closer</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Email Address</p>
              <p className="text-sm font-medium">{email}</p>
            </div>
          </div>

          {phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Phone Number</p>
                <p className="text-sm font-medium">{phone}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentProfileCard;
