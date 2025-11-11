import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface AgentMatchCardProps {
  name: string;
  avatarUrl?: string;
  matchScore: number;
  location: string;
  status: "new" | "viewed" | "contacted";
}

const AgentMatchCard = ({ name, avatarUrl, matchScore, location, status }: AgentMatchCardProps) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const statusColors = {
    new: "bg-green-500/20 text-green-700 dark:text-green-400",
    viewed: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
    contacted: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate">{name}</h3>
              <Badge variant="secondary" className="shrink-0">
                {matchScore}% Match
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">{location}</p>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="bg-muted/30 px-2 py-1 rounded">Sample Data 1</div>
              <div className="bg-muted/30 px-2 py-1 rounded">Sample Data 2</div>
              <div className="bg-muted/30 px-2 py-1 rounded">Sample Data 3</div>
              <div className="bg-muted/30 px-2 py-1 rounded">Sample Data 4</div>
            </div>

            <div className="mt-3">
              <Badge className={statusColors[status]}>{status.toUpperCase()}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentMatchCard;
