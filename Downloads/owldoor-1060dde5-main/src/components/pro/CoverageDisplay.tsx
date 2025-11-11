import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus } from "lucide-react";

interface CoverageDisplayProps {
  coverage: string[] | null;
  proId: string;
  onAddCoverage?: () => void;
}

export function CoverageDisplay({ coverage, proId, onAddCoverage }: CoverageDisplayProps) {

  const displayCoverage = coverage && coverage.length > 0 ? coverage : [];
  const coverageCount = displayCoverage.length;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {coverageCount} Coverage Area{coverageCount !== 1 ? 's' : ''} Set
          </h3>
          <p className="text-sm text-muted-foreground">
            More Coverage = More Matches
          </p>
        </div>

        {/* Coverage List */}
        {displayCoverage.length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="flex flex-wrap gap-2">
              {displayCoverage.slice(0, 5).map((city, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-accent/10 text-accent-foreground border-accent/30"
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  {city}
                </Badge>
              ))}
              {displayCoverage.length > 5 && (
                <Badge variant="outline" className="bg-muted">
                  +{displayCoverage.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary/90"
            onClick={onAddCoverage}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Set Coverage
          </Button>
          <Button 
            variant="outline"
            onClick={onAddCoverage}
          >
            <Plus className="mr-2 h-4 w-4" />
            Type In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
