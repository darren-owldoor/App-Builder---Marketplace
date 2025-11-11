import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

interface CoverageQualityBadgeProps {
  qualityScore: number;
  completenessScore?: number;
  breadthScore?: number;
  demandScore?: number;
  scoreDetails?: any;
  showBreakdown?: boolean;
}

export const CoverageQualityBadge = ({
  qualityScore,
  completenessScore,
  breadthScore,
  demandScore,
  scoreDetails,
  showBreakdown = false,
}: CoverageQualityBadgeProps) => {
  const getQualityLevel = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "bg-green-500", variant: "default" as const };
    if (score >= 60) return { label: "Good", color: "bg-blue-500", variant: "default" as const };
    if (score >= 40) return { label: "Fair", color: "bg-yellow-500", variant: "secondary" as const };
    return { label: "Needs Improvement", color: "bg-red-500", variant: "destructive" as const };
  };

  const quality = getQualityLevel(qualityScore);

  if (!showBreakdown) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={quality.variant} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${quality.color}`} />
              {quality.label} ({qualityScore}/100)
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Competition Level Score</p>
              <p>Completeness: {completenessScore || 0}/40</p>
              <p>Breadth: {breadthScore || 0}/35</p>
              <p>Competition: {demandScore || 0}/25</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Competition Level Score
        </h3>
        <Badge variant={quality.variant} className="text-lg px-4 py-1">
          {qualityScore}/100
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Completeness Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Data Completeness</span>
            </div>
            <span className="text-muted-foreground">{completenessScore || 0}/40</span>
          </div>
          <Progress value={((completenessScore || 0) / 40) * 100} className="h-2" />
          {scoreDetails?.completenessBreakdown && (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {scoreDetails.completenessBreakdown.hasZips && (
                <Badge variant="outline" className="text-xs">✓ ZIP Codes</Badge>
              )}
              {scoreDetails.completenessBreakdown.hasCities && (
                <Badge variant="outline" className="text-xs">✓ Cities</Badge>
              )}
              {scoreDetails.completenessBreakdown.hasStates && (
                <Badge variant="outline" className="text-xs">✓ States</Badge>
              )}
              {scoreDetails.completenessBreakdown.hasCounties && (
                <Badge variant="outline" className="text-xs">✓ Counties</Badge>
              )}
              {scoreDetails.completenessBreakdown.hasCoordinates && (
                <Badge variant="outline" className="text-xs">✓ Coordinates</Badge>
              )}
            </div>
          )}
        </div>

        {/* Breadth Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Coverage Breadth</span>
            </div>
            <span className="text-muted-foreground">{breadthScore || 0}/35</span>
          </div>
          <Progress value={((breadthScore || 0) / 35) * 100} className="h-2" />
          {scoreDetails && (
            <p className="text-xs text-muted-foreground">
              {scoreDetails.zipCodeCount} ZIP codes, {scoreDetails.cityCount} cities, {scoreDetails.countyCount} counties
            </p>
          )}
        </div>

        {/* Competition Level Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Competition Level</span>
            </div>
            <span className="text-muted-foreground">{demandScore || 0}/25</span>
          </div>
          <Progress value={((demandScore || 0) / 25) * 100} className="h-2" />
          {scoreDetails && (
            <p className="text-xs text-muted-foreground">
              {scoreDetails.teamsInArea || scoreDetails.prosInArea || 0} Teams already serving this area
            </p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {qualityScore < 80 && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Recommendations:</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            {(completenessScore || 0) < 30 && (
              <li>Add more detailed location data (counties, coordinates) to improve completeness</li>
            )}
            {(breadthScore || 0) < 20 && (
              <li>Expand coverage to include more ZIP codes and cities</li>
            )}
            {(demandScore || 0) < 15 && (scoreDetails?.teamsInArea === 0 || scoreDetails?.prosInArea === 0) && (
              <li>This appears to be a new market with limited competition</li>
            )}
            {(demandScore || 0) >= 20 && (
              <li>High competition area - established market!</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
