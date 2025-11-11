import { MapPin, Building2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface LocationData {
  city: string;
  state: string;
  zipCodes?: string[];
}

interface ProfileLocationMapProps {
  locations?: LocationData[];
}

const ProfileLocationMap = ({ locations = [] }: ProfileLocationMapProps) => {
  if (!locations || locations.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg p-6">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No coverage areas defined</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg border bg-card p-6">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        Coverage Areas
      </h3>
      
      <div className="space-y-4">
        {locations.map((location, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-medium">{location.city}, {location.state}</span>
            </div>
            {location.zipCodes && location.zipCodes.length > 0 && (
              <div className="flex flex-wrap gap-2 ml-6">
                {location.zipCodes.map((zip, zipIdx) => (
                  <Badge key={zipIdx} variant="secondary" className="text-xs">
                    {zip}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileLocationMap;
