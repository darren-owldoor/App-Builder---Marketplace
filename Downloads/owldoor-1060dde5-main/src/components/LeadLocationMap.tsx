import { MapPin, Building2, Map as MapIcon, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeadLocationMapProps {
  zipCodes?: string[] | null;
  cities?: string[] | null;
  counties?: string[] | null;
  states?: string[] | null;
}

const LeadLocationMap = ({ zipCodes, cities, counties, states }: LeadLocationMapProps) => {
  const hasLocations = (zipCodes?.length || 0) + (cities?.length || 0) + (counties?.length || 0) + (states?.length || 0) > 0;

  if (!hasLocations) {
    return (
      <div className="h-[300px] rounded-lg border bg-card flex items-center justify-center p-6">
        <div className="text-center">
          <MapIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No locations specified</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <div className="p-6 space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Target Locations
        </h3>
        
        <div className="space-y-3">
          {states && states.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-muted-foreground">States</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {states.map((state, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-400">
                    {state}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {counties && counties.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-muted-foreground">Counties</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {counties.map((county, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-400">
                    {county}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {cities && cities.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-muted-foreground">Cities</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {cities.map((city, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                    {city}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {zipCodes && zipCodes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-muted-foreground">ZIP Codes</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {zipCodes.map((zip, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    {zip}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadLocationMap;
